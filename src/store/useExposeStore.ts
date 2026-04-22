import { create } from 'zustand';
import { AgreementType, CalcInput, CalcResult, ScanResult, LeadData } from '../types';

interface ExposeStore {
  // Scanner
  documentUri: string | null;
  documentMime: string | null;
  selectedAgreementType: AgreementType;
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  // Calculator
  calcInput: CalcInput;
  calcResult: CalcResult | null;
  // Lead
  leadData: Partial<LeadData>;
  /**
   * true  = a broker arranged the finance (default) — analyse for hidden commissions
   * false = finance arranged directly with the lender — analyse for excessive lender charges only
   */
  brokerInvolved: boolean;
  // Actions
  setDocument: (uri: string, mime: string) => void;
  setAgreementType: (type: AgreementType) => void;
  setScanResult: (result: ScanResult) => void;
  setCalcInput: (input: Partial<CalcInput>) => void;
  setCalcResult: (result: CalcResult | null) => void;
  updateLeadData: (data: Partial<LeadData>) => void;
  resetLead: () => void;
  setBrokerInvolved: (value: boolean) => void;
}

const defaultCalcInput: CalcInput = {
  agreementType: 'business_loan',
  lenderName: '',
  brokerName: '',
  amountBorrowed: 0,
  monthlyPayment: 0,
  termMonths: 0,
  quotedRate: null,
  disclosureStatus: 'none',
};

export const useExposeStore = create<ExposeStore>((set) => ({
  documentUri: null,
  documentMime: null,
  selectedAgreementType: 'business_loan',
  currentScan: null,
  scanHistory: [],
  calcInput: defaultCalcInput,
  calcResult: null,
  leadData: {},
  brokerInvolved: true,

  setDocument: (uri, mime) => set({ documentUri: uri, documentMime: mime }),
  setAgreementType: (type) => set({ selectedAgreementType: type }),
  setScanResult: (result) =>
    set((s) => ({
      currentScan: result,
      scanHistory: [result, ...s.scanHistory].slice(0, 10),
    })),
  setCalcInput: (input) =>
    set((s) => ({ calcInput: { ...s.calcInput, ...input } })),
  setCalcResult: (result) => set({ calcResult: result }),
  updateLeadData: (data) =>
    set((s) => ({ leadData: { ...s.leadData, ...data } })),
  resetLead: () => set({ leadData: {} }),
  setBrokerInvolved: (value) => set({ brokerInvolved: value }),
}));
