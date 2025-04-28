
declare global {
  type UserRole = "admin" | "manager" | "agent" | "customer";
  
  type IdType = "ghana_card" | "voter_id" | "passport";
  
  type AccountType = "regular" | "fixed_deposit" | "susu";
  
  type TransactionType = 
    | "deposit" 
    | "withdrawal" 
    | "loan_disbursement" 
    | "loan_repayment" 
    | "interest_payment" 
    | "penalty_payment";
    
  type PaymentMethod = 
    | "cash" 
    | "bank_transfer" 
    | "mtn_momo" 
    | "vodafone_cash" 
    | "airteltigo_money";
    
  type LoanStatus = 
    | "pending" 
    | "approved" 
    | "disbursed" 
    | "active" 
    | "fully_paid" 
    | "defaulted";
}

export {};
