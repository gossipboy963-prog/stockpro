export type BucketType = 'ETF' | 'Trading' | 'Hedge';

export interface Position {
  id: string;
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  prevClose: number; // For daily change calc
  bucket: BucketType;
  notes?: string;
}

export interface AppState {
  holdings: Position[];
  cashUSD: number;
  lastUpdate: number | null; // Timestamp
  lastMonthlyAdjustment: number | null; // Timestamp
}

export type SOPStatus = 'pass' | 'warn' | 'fail' | 'pending';

export interface SOPStep {
  id: number;
  label: string;
  description: string;
  status: SOPStatus;
  note: string;
}

export type ScoreLabel = 'Go' | 'Consider' | 'Watch' | 'Avoid';

export interface JournalEntry {
  id: string;
  date: number;
  symbol: string;
  direction: 'Long' | 'Short';
  action?: 'Buy' | 'Sell'; // Added Buy/Sell action
  price: number;
  bucket: BucketType;
  sopSteps: SOPStep[];
  noTradeTriggered: string[]; // List of reasons
  noTradeReasonNote?: string;
  result: 'tradable' | 'watch' | 'banned';
  score?: number;      // 7 - 21
  scoreLabel?: ScoreLabel; // Go, Consider, Watch, Avoid
  userNotes?: string;  // User written notes
  riskCalc?: {
    entry: number;
    stop: number;
    target?: number;
    shares: number;
    riskAmount: number;
    rr?: number;
  };
}

export const NO_TRADE_REASONS = [
  "大盤震盪盤 (Market Chop)",
  "價格漂亮但量能萎縮 (Low Volume)",
  "連續 2 筆停損 (2 Consecutive Losses)",
  "情緒不穩/想報復 (Emotional/Revenge)",
  "FOMO (Fear Of Missing Out)"
];