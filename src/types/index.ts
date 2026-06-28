export type SplitType = 'equal' | 'exact' | 'percentage';

export interface BalanceEntry {
  memberId: string;
  memberName: string;
  balance: number;
}

export interface DebtTransaction {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface HistoryEntry {
  type: 'expense' | 'settlement';
  id: string;
  description?: string;
  amount: number;
  paidBy?: string;
  from?: string;
  to?: string;
  createdAt: Date;
}

export interface GroupSummary {
  group: string;
  members: number;
  expenses: number;
  totalSpent: number;
  largestExpense: { description: string; amount: number } | null;
  topSpender: string | null;
  outstanding: number;
}

export interface SearchFilters {
  description?: string;
  paidBy?: string;
  minAmount?: number;
  maxAmount?: number;
  participant?: string;
  startDate?: string;
  endDate?: string;
}

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}
