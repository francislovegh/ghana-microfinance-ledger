
// Common types for the application
export type IdType = "ghana_card" | "voter_id" | "passport";
export type LoanStatus = "pending" | "approved" | "disbursed" | "active" | "fully_paid" | "defaulted";
export type AccountType = "regular" | "fixed_deposit" | "susu";
export type PaymentMethod = "cash" | "bank_transfer" | "mtn_momo" | "vodafone_cash" | "airteltigo_money";
export type TransactionType = "deposit" | "withdrawal" | "loan_disbursement" | "loan_repayment" | "interest" | "fee" | "transfer";
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
  performed_by_profile: LoanProfile;
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
