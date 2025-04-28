
// Update Loan type to use LoanStatus
interface Loan {
  id: string;
  loan_number: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  purpose: string | null;
  status: LoanStatus;
  disbursed_at: string | null;
  next_payment_date: string | null;
  total_paid: number | null;
  remaining_balance: number | null;
  created_at: string | null;
  profiles: LoanProfile | null;
}

// Later in the component where the type error occurs, cast the status to LoanStatus
setSelectedLoan({
  ...loan,
  status: loan.status as LoanStatus
});
