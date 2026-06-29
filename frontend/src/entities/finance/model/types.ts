export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export type FinanceCurrency = 'USD' | 'CAD';

export const financeCurrencyOptions = ['USD', 'CAD'] as const;

export type Payment = {
  id: number;
  company: number;
  project: number;
  amount: string;
  client: number;
  manager: number;
  status: PaymentStatus;
  currency: FinanceCurrency;
  created_at: string;
  session_id: string | null;
  session_url: string | null;
};

export type ManagerPaymentPayload = {
  client: number;
  project: number;
  amount: string;
  currency: FinanceCurrency;
};

export type Salary = {
  id: number;
  company: number;
  manager: number;
  worker: number;
  amount: string;
  currency: FinanceCurrency;
  date_paid: string;
};

export type ManagerSalaryPayload = {
  worker: number;
  amount: string;
  currency: FinanceCurrency;
};

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: number;
  company: number;
  amount: string;
  transaction_type: TransactionType;
  currency: FinanceCurrency;
  description: string;
  created_at: string;
};

export type TransactionPayload = {
  amount: string;
  transaction_type: TransactionType;
  currency: FinanceCurrency;
  description: string;
};

export type TransactionUpdatePayload = Partial<TransactionPayload>;

export type CurrencyTotals = {
  total_income: string;
  total_expenses: string;
  net_profit: string;
};

export type FinancialReport = {
  id: number;
  company: number;
  start_date: string;
  end_date: string | null;
  total_income: string;
  total_expenses: string;
  net_profit: string;
  generated_at: string;
  totals_by_currency: Record<FinanceCurrency, CurrencyTotals>;
};

export type FinancialReportRefreshPayload = {
  company?: number;
};
