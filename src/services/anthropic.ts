/**
 * Document analysis service — powered by Google Gemini.
 * File kept as anthropic.ts to avoid touching imports elsewhere.
 */
import { Platform } from 'react-native';
import { AgreementType, DealFact, Finding, ScanResult } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const TIMEOUT_MS = 60_000;

export const AGREEMENT_LABELS: Record<AgreementType, string> = {
  asset_finance: 'Asset Finance',
  business_loan: 'Business Loan',
  mca: 'Merchant Cash Advance',
  invoice_finance: 'Invoice Finance',
  hire_purchase: 'Hire Purchase',
};

const SYSTEM_PROMPT = `You are an expert UK commercial finance agreement analyst. Your job is to protect UK business owners by identifying predatory clauses, hidden costs, and legal risks — with specific knowledge of UK law, FCA regulation, and market practice.


LEGAL FRAMEWORK TO APPLY:
- Johnson v Firstrand Bank Ltd [2024] EWCA Civ 1282 — undisclosed or secret broker commissions
- Unfair Contract Terms Act 1977 — terms creating significant imbalance are unenforceable
- Consumer Credit Act 1974 — can apply to sole traders and small partnerships
- FCA CONC rules — conflicts of interest, unfair relationships, commission disclosure
- UK MCA market practice — distinguish genuine revenue-share from disguised loans

WHAT TO LOOK FOR AND HOW TO RATE IT:

HIGH SEVERITY — flag any of:
1. Personal Guarantee / Joint & Several Liability
   - Look for: "personal guarantee", "personally guarantees", "joint and several liability", "jointly and severally liable", "director guarantees", "irrevocably guarantees"
   - UK risk: pierces limited liability — director's personal home and assets are exposed
   - Always flag as HIGH

2. Confession of Judgment / Warrant of Attorney
   - Look for: "confession of judgment", "warrant of attorney", "irrevocably authorises [party] to appoint any person to act as attorney", "cognovit"
   - Allows lender to obtain judgment without notice — highly oppressive

3. Disguised Loan (MCA misclassified)
   - Look for: agreement called "purchase of future receivables" BUT payment is a FIXED daily/weekly amount (not a true percentage of actual sales)
   - If fixed payment regardless of revenue: this is a loan in disguise, not an MCA — the merchant loses the key protection of revenue-contingent repayment
   - Flag: "This contract is structured as a Purchase of Receivables but mandates a fixed payment — it behaves like an unregulated loan, not a true MCA."

4. Predatory Factor Rate / Effective APR
   - Factor rates above 1.35 on MCA, or APR above 40% on business loans, are HIGH concern
   - Calculate effective APR where possible and flag if excessive

5. Exclusivity / Anti-Stacking Clause with Penalty
   - Look for: "exclusivity", "stacking", "double-funding", "no additional financing", penalty for seeking other finance
   - UK term is typically "stacking" — flag both US and UK terminology
   - Penalty percentage above 10% of advance = HIGH

6. Hidden / Undisclosed Broker Commission
   - Look for commission, introducer fee, referral payment not disclosed at point of sale
   - Under Johnson v Firstrand, secret commissions are recoverable

MEDIUM SEVERITY — flag any of:
7. Fees Deducted from Advance (Effective Hidden Cost)
   - Underwriting fees, technology fees, origination fees deducted from the advance
   - Increases effective APR — should be disclosed clearly

8. Reconciliation Fee / Administrative Barrier
   - Charging a fee (especially >£250) to request a reconciliation review
   - Under UK law this may be an unenforceable penalty under UCTA 1977
   - Flag: "This fee may be challengeable as an unfair penalty under the Unfair Contract Terms Act 1977."

9. Binding Arbitration at Lender's Chosen Location
   - Imbalance of power — disadvantages UK SME in dispute resolution

10. Choice of Law Designed to Avoid UK Protection
    - Governing law clause choosing a jurisdiction with weak usury or consumer protection laws
    - Attempt to circumvent FCA rules or UK statutory protections

LOW SEVERITY — flag any of:
11. Vague or One-sided Default Definitions
12. Automatic renewal or rollover clauses
13. Right to vary terms unilaterally

SCORING GUIDE:
- 80–100: Multiple HIGH findings, especially Personal Guarantee + Disguised Loan or COJ
- 60–79: One HIGH finding or several MEDIUMs
- 40–59: Mostly MEDIUMs with some LOWs
- 0–39: Only LOWs or minor concerns

FINANCIAL EXTRACTION:
Extract the following financial figures from the document where present. Convert all currency to £ (use the face value if already in £, or convert from $ at 1:1 for UK-targeted documents). Use null if a figure cannot be determined.

KEY FACTS to extract (up to 8 most relevant):
- Advance / Capital amount
- Factor rate (if MCA)
- APR or interest rate (if stated)
- Total amount repayable
- Effective APR (calculate if possible)
- Broker / Introducer fee or commission (if disclosed)
- Upfront fees deducted from advance
- Agreement term / duration
- Daily / weekly / monthly payment amount
- Personal guarantee: Yes / No

Flag each fact as: "ok" (normal/acceptable), "warning" (elevated concern), "danger" (predatory/highly concerning), or "neutral" (informational)

ADVISOR SUMMARY:
Write a single plain-English sentence (max 30 words) that captures the most important thing a UK business owner should know about this agreement. Be direct and specific.

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no code fences, no explanation outside the JSON:
{
  "concernScore": <integer 0-100>,
  "findings": [
    { "severity": "high"|"medium"|"low", "title": "<concise UK-focused title>", "detail": "<1-2 sentences including relevant UK legal angle where applicable>" }
  ],
  "keyFacts": [
    { "label": "<short label>", "value": "<formatted value>", "flag": "ok"|"warning"|"danger"|"neutral" }
  ],
  "estimatedCapital": <number in £ or null>,
  "estimatedTotalCost": <number in £ or null>,
  "estimatedHiddenCost": <number in £ representing undisclosed fees/commission or null>,
  "advisorSummary": "<single sentence plain English summary>"
}`;

// ─── File → base64 ────────────────────────────────────────────────────────────

async function uriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // On web the URI is a blob: or data: URL
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Could not read the selected file.');
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Native — use expo-file-system
  const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
  return readAsStringAsync(uri, { encoding: EncodingType.Base64 });
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out after 60 seconds. Check your internet connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyseDocument(
  uri: string,
  mime: string,
  agreementType: AgreementType,
): Promise<ScanResult> {
  if (!API_KEY) {
    throw new Error(
      'No Gemini API key configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file and restart the dev server.',
    );
  }

  const isImage = mime.startsWith('image/');
  const isPDF = mime === 'application/pdf';

  if (!isImage && !isPDF) {
    throw new Error('Unsupported file type. Please upload a PDF or image.');
  }

  // Read file as base64
  let base64: string;
  try {
    base64 = await uriToBase64(uri);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Could not read the document: ${msg}`);
  }

  if (!base64 || base64.length < 10) {
    throw new Error('The document appears to be empty or unreadable. Please try a different file.');
  }

  // Build Gemini request body
  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mime,
              data: base64,
            },
          },
          {
            text: `This is a ${AGREEMENT_LABELS[agreementType]} agreement. Analyse it and return JSON only.`,
          },
        ],
      },
    ],
    generation_config: {
      max_output_tokens: 2048,
      temperature: 0.2,
    },
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(
      API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
    );
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      throw new Error('Network error — check your internet connection and try again.');
    }
    throw err;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 400) throw new Error(`Bad request to Gemini API: ${errText.slice(0, 200)}`);
    if (res.status === 403) throw new Error('Invalid or unauthorised Gemini API key. Check EXPO_PUBLIC_GEMINI_API_KEY.');
    if (res.status === 429) throw new Error('Gemini API rate limit reached — please wait a moment and try again.');
    if (res.status >= 500) throw new Error('Gemini service error — please try again shortly.');
    throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  // Parse Gemini response
  const data = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  let parsed: {
    concernScore: number;
    findings: Finding[];
    keyFacts?: DealFact[];
    estimatedCapital?: number | null;
    estimatedTotalCost?: number | null;
    estimatedHiddenCost?: number | null;
    advisorSummary?: string;
  };
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match?.[0] ?? clean) as typeof parsed;
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  return {
    id: Date.now().toString(),
    agreementType,
    timestamp: Date.now(),
    concernScore: Math.min(100, Math.max(0, parsed.concernScore ?? 50)),
    findings: parsed.findings ?? [],
    keyFacts: parsed.keyFacts ?? [],
    estimatedCapital: parsed.estimatedCapital ?? null,
    estimatedTotalCost: parsed.estimatedTotalCost ?? null,
    estimatedHiddenCost: parsed.estimatedHiddenCost ?? null,
    advisorSummary: parsed.advisorSummary ?? '',
  };
}
