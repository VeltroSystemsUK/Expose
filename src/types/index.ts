export type AgreementType = 'asset_finance' | 'business_loan' | 'mca' | 'invoice_finance' | 'hire_purchase';
export type DisclosureStatus = 'none' | 'partial' | 'full';
export type Severity = 'high' | 'medium' | 'low';
export type ClaimBasis = 'none' | 'non_disclosure' | 'inflated_rate' | 'misrepresentation';
export type ClaimStrength = 'none' | 'possible' | 'probable' | 'strong';
export type CommissionTier = 'negligible' | 'low' | 'medium' | 'high' | 'very_high';

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
}

export type FactFlag = 'ok' | 'warning' | 'danger' | 'neutral';

export interface DealFact {
  label: string;
  value: string;
  flag: FactFlag;
}

export interface ScanResult {
  id: string;
  agreementType: AgreementType;
  timestamp: number;
  concernScore: number;
  findings: Finding[];
  /** Structured key facts extracted from the document */
  keyFacts?: DealFact[];
  /** Capital / advance amount in £ (null if undetectable) */
  estimatedCapital?: number | null;
  /** Total amount repayable in £ (null if undetectable) */
  estimatedTotalCost?: number | null;
  /** Sum of suspected hidden fees / undisclosed commission in £ */
  estimatedHiddenCost?: number | null;
  /** Advisor summary sentence from the AI */
  advisorSummary?: string;
}

export type LenderCategory =
  | 'major_bank'
  | 'specialist_bank'
  | 'challenger_bank'
  | 'asset_finance'
  | 'alternative_lender'
  | 'invoice_finance'
  | 'mca'
  | 'trade_finance'
  | 'development_finance';

export interface LenderProfile {
  id: string;
  name: string;
  products: AgreementType[];
  category?: LenderCategory;
  /** Typical minimum buy rate lender charges the broker (annual %) */
  buyRateMin: number;
  /** Typical maximum buy rate lender charges the broker (annual %) */
  buyRateMax: number;
  /** Maximum broker commission as % of loan value */
  maxCommission: number;
  fcaRef?: string;
  trustpilotSlug?: string;
  feefoSlug?: string;
  /** True if this lender uses factor rates (MCA) rather than APR */
  isMCA?: boolean;
}

export interface CommissionEstimate {
  /** Estimated commission £ min */
  min: number;
  /** Estimated commission £ max */
  max: number;
  /** % of loan value (min) */
  rateMin: number;
  /** % of loan value (max) */
  rateMax: number;
  /** Actual APR minus lender's typical buy rate floor */
  spread: number;
  tier: CommissionTier;
}

export interface CalcInput {
  agreementType: AgreementType;
  lenderId: string | null;
  brokerName: string;
  amountBorrowed: number;
  monthlyPayment: number;
  termMonths: number;
  /** Rate the broker verbally quoted the client at point of sale (annual %) — the smoking gun */
  quotedRate: number | null;
  disclosureStatus: DisclosureStatus;
}

export interface CalcResult {
  totalRepaid: number;
  totalInterest: number;
  actualAPR: number;
  /** True if broker's quoted rate differs from actual APR by >1.5% */
  quotedRateMismatch: boolean;
  /** Actual APR minus quoted rate (%) — positive = client was undersold */
  rateDelta: number;
  commissionEstimate: CommissionEstimate;
  potentialClaimValue: number;
  claimBasis: ClaimBasis;
  claimStrength: ClaimStrength;
  claimSummary: string;
}

export interface LeadData {
  name: string;
  email: string;
  mobile: string;
  company: string;
  lenderName: string;
  agreementType: AgreementType | '';
  agreementValue: string;
  agreementDate: string;
  consent: boolean;
  marketingConsent: boolean;
  refNumber: string;
}

export type RootStackParamList = {
  Tabs: undefined;
  Analysing: undefined;
  Results: undefined;
  LeadStep1: undefined;
  LeadStep2: undefined;
  LeadStep3: undefined;
  LeadSuccess: undefined;
};

export type TabParamList = {
  Home: undefined;
  Scanner: undefined;
  Calculator: undefined;
};
