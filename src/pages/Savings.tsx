
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ArrowLeftRight } from "lucide-react";
import SavingsAccountModal from "@/components/savings/SavingsAccountModal";
import TransactionModal from "@/components/savings/TransactionModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { AccountType } from "@/types/app";
import { format } from "date-fns";

interface SavingsProfile {
  full_name: string;
  phone_number: string;
}

interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  balance: number;
  account_type: AccountType;
  interest_rate: number;
  maturity_date: string | null;
  is_active: boolean;
  created_at: string;
  profiles: SavingsProfile;
}

interface SavingsAccountModalState {
  isOpen: boolean;
  account: SavingsAccount | null;
  mode: "create" | "edit";
}

interface TransactionModalState {
  isOpen: boolean;
  account: SavingsAccount | null;
  type: "deposit" | "withdrawal";
}

const SavingsPage = () => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountModal, setAccountModal] = useState<SavingsAccountModalState>({
    isOpen: false,
    account: null,
    mode: "create"
  });
  const [transactionModal, setTransactionModal] = useState<TransactionModalState>({
    isOpen: false,
    account: null,
    type: "deposit"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("savings_accounts")
        .select("*, profiles(full_name, phone_number)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data as unknown as SavingsAccount[]);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load savings accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setAccountModal({
      isOpen: true,
      account: null,
      mode: "create"
    });
  };

  const handleOpenEditModal = (account: SavingsAccount) => {
    setAccountModal({
      isOpen: true,
      account: {
        ...account,
        account_type: account.account_type as AccountType
      },
      mode: "edit"
    });
  };

  const handleOpenTransactionModal = (account: SavingsAccount, type: "deposit" | "withdrawal") => {
    setTransactionModal({
      isOpen: true,
      account,
      type
    });
  };

  const handleCloseAccountModal = () => {
    setAccountModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleCloseTransactionModal = () => {
    setTransactionModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAccountSaved = () => {
    fetchAccounts();
    setAccountModal(prev => ({ ...prev, isOpen: false }));
    toast({
      title: "Success",
      description: accountModal.mode === "create" 
        ? "Savings account created successfully" 
        : "Savings account updated successfully",
    });
  };

  const handleTransactionComplete = () => {
    fetchAccounts();
    setTransactionModal(prev => ({ ...prev, isOpen: false }));
    toast({
      title: "Success",
      description: `${transactionModal.type === "deposit" ? "Deposit" : "Withdrawal"} completed successfully`,
    });
  };

  const filteredAccounts = accounts.filter(account => 
    account.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.profiles?.phone_number?.includes(searchQuery) ||
    account.account_number?.includes(searchQuery)
  );

  const getAccountTypeBadge = (type: AccountType) => {
    switch(type) {
      case "regular":
        return <Badge>Regular</Badge>;
      case "fixed_deposit":
        return <Badge variant="outline">Fixed Deposit</Badge>;
      case "susu":
        return <Badge variant="secondary">Susu</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Savings Accounts</h1>
          <p className="text-gray-600">Manage customer savings accounts and transactions</p>
        </div>
        <Button 
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2"
        >
          <Plus size={18} /> New Account
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-2" size={20} />
            <Input
              placeholder="Search by customer name, phone or account number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-700 bg-gray-50">
              <tr>
                <th className="px-4 py-3">Account Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Interest Rate</th>
                <th className="px-4 py-3">Maturity Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center">Loading accounts...</td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center">No accounts found</td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{account.account_number}</td>
                    <td className="px-4 py-3">
                      <div>{account.profiles?.full_name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{account.profiles?.phone_number || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3">{getAccountTypeBadge(account.account_type)}</td>
                    <td className="px-4 py-3 font-medium">₵{account.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">{account.interest_rate}%</td>
                    <td className="px-4 py-3">
                      {account.maturity_date 
                        ? format(new Date(account.maturity_date), "MMM d, yyyy") 
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.is_active ? "default" : "destructive"}>
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenEditModal(account)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTransactionModal(account, "deposit")}
                          className="text-green-600"
                          disabled={!account.is_active}
                        >
                          Deposit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTransactionModal(account, "withdrawal")}
                          className="text-amber-600"
                          disabled={!account.is_active || account.balance <= 0}
                        >
                          Withdraw
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Savings Account Modal */}
      <SavingsAccountModal
        isOpen={accountModal.isOpen}
        onClose={handleCloseAccountModal}
        onSave={handleAccountSaved}
        account={accountModal.account}
        mode={accountModal.mode}
      />
      
      {/* Transaction Modal */}
      <TransactionModal
        isOpen={transactionModal.isOpen}
        onClose={handleCloseTransactionModal}
        onSave={handleTransactionComplete}
        account={transactionModal.account}
        type={transactionModal.type}
      />
    </AppLayout>
  );
};

const Savings = () => (
  <AuthGuard>
    <SavingsPage />
  </AuthGuard>
);

export default Savings;
