import {
  CalcInput,
  CalcResult,
  ClaimBasis,
  ClaimStrength,
  CommissionEstimate,
  CommissionTier,
  AgreementType,
} from '../types';
import { getLenderById, MARKET_AVERAGE_BUY_RATES } from '../data/lenders';

// ─── APR via Newton-Raphson IRR ──────────────────────────────────────────────

function monthlyIRR(cashflows: number[]): number {
  let rate = 0.01;
  for (let i = 0; i < 300; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const pv = Math.pow(1 + rate, t);
      npv += cashflows[t] / pv;
      dnpv -= (t * cashflows[t]) / (pv * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-14) break;
    const next = rate - npv / dnpv;
    if (Math.abs(next - rate) < 1e-10) { rate = next; break; }
    rate = Math.max(next, -0.9999); // prevent negative blow-up
  }
  return rate;
}

function toAnnualAPR(monthly: number): number {
  return (Math.pow(1 + monthly, 12) - 1) * 100;
}

// ─── Commission tier by rate spread ─────────────────────────────────────────
//
// The broker's profit is the spread between what the lender charges them (buy rate)
// and what they charge the client (sell rate). A high spread = high hidden commission.
//
// In unregulated commercial finance there is no legal cap on this spread.
// Common markups observed in the market:
//   <2%  spread  → commission ~0.25–1%   of loan  (likely at or near cost)
//   2–6% spread  → commission ~1–4%     of loan  (moderate markup)
//   6–15% spread → commission ~4–10%    of loan  (significant markup)
//   15–30% spread → commission ~8–15%   of loan  (aggressive markup)
//   >30% spread  → commission ~12–20%   of loan  (MCA / predatory territory)

type TierRates = [min: number, max: number]; // % of loan value

const TIER_RATES: Record<CommissionTier, TierRates> = {
  negligible: [0.25, 1.0],
  low:        [1.0,  4.0],
  medium:     [4.0,  10.0],
  high:       [8.0,  15.0],
  very_high:  [10.0, 15.0],
};

function getCommissionTier(spread: number): CommissionTier {
  if (spread < 2)  return 'negligible';
  if (spread < 6)  return 'low';
  if (spread < 15) return 'medium';
  if (spread < 30) return 'high';
  return 'very_high';
}

// ─── Claim summary text ──────────────────────────────────────────────────────

function buildClaimSummary(
  basis: ClaimBasis,
  strength: ClaimStrength,
  rateDelta: number,
  tier: CommissionTier,
  isMCA: boolean,
): string {
  if (strength === 'none') {
    return 'Based on the information provided, there is no clear basis for a claim at this time.';
  }

  const tierDesc =
    tier === 'negligible' ? 'a negligible broker markup' :
    tier === 'low'        ? 'a low-to-moderate broker markup' :
    tier === 'medium'     ? 'a significant broker markup' :
    tier === 'high'       ? 'a substantial broker markup' :
                            'an extremely high broker markup';

  if (basis === 'misrepresentation') {
    return `The rate you were quoted at sale (${rateDelta > 0 ? `${rateDelta.toFixed(1)}% lower than your agreement rate` : 'does not match your agreement'}) is a potential indicator of misrepresentation. Combined with ${tierDesc} and non-disclosure of commission, this may constitute fraud under the Financial Services and Markets Act 2000 and common law. This is one of the strongest grounds for a claim in unregulated commercial finance.`;
  }

  if (basis === 'inflated_rate') {
    return `The rate on your agreement suggests ${tierDesc} above this lender's typical cost of funds. In unregulated commercial finance, brokers are not required to disclose this spread — but the Johnson v Firstrand [2024] Supreme Court ruling has opened the door to claims based on undisclosed conflicts of interest. The higher the spread, the stronger the non-disclosure argument.`;
  }

  if (basis === 'non_disclosure') {
    return isMCA
      ? `Merchant Cash Advances are not regulated as credit agreements, but brokers arranging them may still owe a duty of disclosure where a commission creates a conflict of interest. The factor rate structure used by MCA lenders can obscure the true cost in ways that are difficult for clients to compare.`
      : `Commission was not disclosed at the point of sale. Under FCA Principle 8 (conflicts of interest) and the Supreme Court's ruling in Johnson v Firstrand [2024], failure to disclose broker commission — particularly where that commission was influenced by the rate set — may give rise to a civil claim for the return of the hidden amount.`;
  }

  return 'There may be grounds for a review based on the information provided.';
}

// ─── Main calculate function ─────────────────────────────────────────────────

export function calculate(input: CalcInput): CalcResult {
  const {
    amountBorrowed,
    monthlyPayment,
    termMonths,
    agreementType,
    quotedRate,
    disclosureStatus,
  } = input;

  // 1. Repayment totals
  const totalRepaid = monthlyPayment * termMonths;
  const totalInterest = totalRepaid - amountBorrowed;

  // 2. Actual APR
  let actualAPR = 0;
  if (monthlyPayment > 0 && amountBorrowed > 0 && termMonths > 0 && totalRepaid > amountBorrowed) {
    try {
      const cashflows = [-amountBorrowed, ...Array(termMonths).fill(monthlyPayment)];
      const monthly = monthlyIRR(cashflows);
      actualAPR = Math.max(0, toAnnualAPR(monthly));
    } catch {
      actualAPR = 0;
    }
  }

  // 3. Lender buy rate floor (use market average since no specific lender)
  const isMCA = agreementType === 'mca';
  const buyRateFloor = MARKET_AVERAGE_BUY_RATES[agreementType as AgreementType] ?? 10;

  // 4. Rate spread = the broker's markup above their cost of funds
  const spread = Math.max(0, actualAPR - buyRateFloor);

  // 5. Commission estimate based on spread tier
  const tier = getCommissionTier(spread);
  const [rateMin, rateMax] = TIER_RATES[tier];

  const commissionEstimate: CommissionEstimate = {
    min: Math.round(amountBorrowed * rateMin / 100),
    max: Math.round(amountBorrowed * rateMax / 100),
    rateMin,
    rateMax,
    spread,
    tier,
  };

  // 6. Misrepresentation check
  // If the broker quoted a rate verbally and the actual agreement APR is materially higher,
  // that gap is evidence of misrepresentation or fraud.
  const MISMATCH_THRESHOLD = 1.5; // % — within margin of rounding/fees, >1.5% is significant
  const quotedRateMismatch =
    quotedRate !== null &&
    quotedRate > 0 &&
    actualAPR > 0 &&
    (actualAPR - quotedRate) > MISMATCH_THRESHOLD;
  const rateDelta = quotedRate ? Math.max(0, actualAPR - quotedRate) : 0;

  // 7. Claim basis and strength
  let claimBasis: ClaimBasis = 'none';
  let claimStrength: ClaimStrength = 'none';

  if (actualAPR > 0) {
    if (quotedRateMismatch && disclosureStatus !== 'full') {
      // Strongest: broker lied about the rate AND didn't disclose commission
      claimBasis = 'misrepresentation';
      claimStrength = 'strong';
    } else if (quotedRateMismatch) {
      // Strong: broker lied about rate (even if commission was disclosed)
      claimBasis = 'misrepresentation';
      claimStrength = 'probable';
    } else if (disclosureStatus !== 'full' && tier !== 'negligible') {
      // Moderate: non-disclosure with meaningful spread
      claimBasis = disclosureStatus === 'none' ? 'non_disclosure' : 'inflated_rate';
      claimStrength =
        tier === 'high' || tier === 'very_high' ? 'probable' :
        tier === 'medium' ? 'possible' : 'possible';
    } else if (disclosureStatus === 'full') {
      claimBasis = 'none';
      claimStrength = 'none';
    }
  }

  // 8. Potential claim value
  let potentialClaimValue = 0;
  if (claimStrength !== 'none') {
    if (claimStrength === 'strong' || claimStrength === 'probable') {
      potentialClaimValue = commissionEstimate.max;
    } else {
      potentialClaimValue = Math.round(commissionEstimate.max * 0.6);
    }
    if (disclosureStatus === 'partial') {
      potentialClaimValue = Math.round(potentialClaimValue * 0.5);
    }
  }

  // 9. Narrative summary
  const claimSummary = buildClaimSummary(claimBasis, claimStrength, rateDelta, tier, isMCA);

  return {
    totalRepaid,
    totalInterest,
    actualAPR,
    quotedRateMismatch,
    rateDelta,
    commissionEstimate,
    potentialClaimValue,
    claimBasis,
    claimStrength,
    claimSummary,
  };
}
