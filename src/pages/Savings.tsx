
// Update SavingsAccount type to use AccountType
interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  account_type: AccountType;
  balance: number;
  interest_rate: number;
  maturity_date: string | null;
  is_active: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    phone_number: string;
  } | null;
}

// Later in the component where the type error occurs, cast the account_type to AccountType
setSelectedAccount({
  ...account,
  account_type: account.account_type as AccountType
});
