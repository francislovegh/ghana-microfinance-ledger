
// Common types for the application
export type IdType = "ghana_card" | "voter_id" | "passport";
export type LoanStatus = "pending" | "approved" | "disbursed" | "active" | "fully_paid" | "defaulted";
export type AccountType = "regular" | "fixed_deposit" | "susu";
export type PaymentMethod = "cash" | "bank_transfer" | "mtn_momo" | "vodafone_cash" | "airteltigo_money";
export type TransactionType = "deposit" | "withdrawal" | "loan_disbursement" | "loan_repayment" | "interest_payment" | "penalty_payment" | "interest" | "fee" | "transfer";
export type Role = "admin" | "manager" | "staff" | "customer";

// Define interfaces for common objects
export interface TransactionProfile {
  full_name: string;
}

export interface LoanProfile {
  full_name: string;
  phone_number: string;
}

export interface LoanTransaction {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  payment_method: PaymentMethod;
  transaction_number: string;
  reference_number: string;
  description: string;
  created_at: string;
  performed_by: string;
  performed_by_profile: LoanProfile | null;
}

export interface Transaction {
  id: string;
  account_id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  payment_method: PaymentMethod;
  transaction_number: string;
  reference_number: string;
  description: string;
  created_at: string;
  performed_by: string;
  profiles: TransactionProfile;
}

export interface LoanGuarantor {
  id: string; // Added id property which was missing in the type definition
  loan_id: string;
  full_name: string;
  phone_number: string;
  relationship: string;
  id_type: IdType;
  id_number: string;
  address: string;
  email?: string;
}

export interface LoanCollateral {
  id: string;
  loan_id: string;
  collateral_type: string;
  description: string;
  value: number;
  document_url?: string | null;
}

export interface LoanScheduleItem {
  id: string;
  loan_id: string;
  payment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  paid_amount: number | null;
  is_paid: boolean;
  payment_date: string | null;
  penalty_amount: number | null;
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  customerName: string;
}

// Accounting module types
export type AccountCategory = "asset" | "liability" | "equity" | "income" | "expense";

export interface ChartOfAccountItem {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  description?: string;
  is_active: boolean;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  description: string;
  entry_date: string;
  is_posted: boolean;
  is_recurring: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  posted_at?: string | null;
  posted_by?: string | null;
  total_debit: number;
  total_credit: number;
  reference_number?: string;
  source_document?: string;
  branch_id?: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account: ChartOfAccountItem;
  debit_amount: number | null;
  credit_amount: number | null;
  description?: string;
  created_at: string;
}

export interface AutoPostingRule {
  id: string;
  event_type: string;
  description: string;
  is_active: boolean;
  debit_account_id: string;
  debit_account: ChartOfAccountItem;
  credit_account_id: string;
  credit_account: ChartOfAccountItem;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  name: string;
  report_type: "balance_sheet" | "income_statement" | "cash_flow" | "trial_balance";
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  report_data: any; // JSON data containing report details
  branch_id?: string;
}

export interface AccountingIntegration {
  id: string;
  provider: "quickbooks" | "xero" | "csv" | "custom";
  is_active: boolean;
  config: any; // JSON configuration data
  last_sync_at?: string | null;
  created_at: string;
  updated_at: string;
}
