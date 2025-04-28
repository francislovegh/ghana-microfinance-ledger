
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, ArrowUpDown } from "lucide-react";
import SavingsAccountModal from "@/components/savings/SavingsAccountModal";
import TransactionModal from "@/components/savings/TransactionModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { AccountType } from "@/types/app";
import { format } from "date-fns";

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

const SavingsPage = () => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [transactionType, setTransactionType] = useState<"deposit" | "withdrawal">("deposit");
  const { toast } = useToast();

  // Fetch accounts on component mount
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

  const handleOpenAccountModal = (account: SavingsAccount | null = null) => {
    // Later in the component where the type error occurs, cast the account_type to AccountType
    if (account) {
      setSelectedAccount({
        ...account,
        account_type: account.account_type as AccountType
      });
    } else {
      setSelectedAccount(null);
    }
    setIsAccountModalOpen(true);
  };

  const handleOpenTransactionModal = (account: SavingsAccount, type: "deposit" | "withdrawal") => {
    setSelectedAccount(account);
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  const handleAccountCreated = () => {
    setIsAccountModalOpen(false);
    fetchAccounts();
  };

  const handleTransactionCompleted = () => {
    setIsTransactionModalOpen(false);
    fetchAccounts();
  };

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter(account => 
    account.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.profiles?.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format account type for display
  const formatAccountType = (type: string) => {
    return type.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Savings Accounts</h1>
          <p className="text-gray-600">Manage customer savings accounts</p>
        </div>
        <Button 
          onClick={() => handleOpenAccountModal()} 
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
                    <td className="px-4 py-3">{formatAccountType(account.account_type)}</td>
                    <td className="px-4 py-3 font-medium">₵{account.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">{account.interest_rate}%</td>
                    <td className="px-4 py-3">
                      {account.maturity_date 
                        ? format(new Date(account.maturity_date), "MMM d, yyyy") 
                        : "N/A"
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.is_active ? "success" : "destructive"}>
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenAccountModal(account)}
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenTransactionModal(account, "deposit")}
                          className="text-green-600"
                        >
                          <ArrowUpDown size={16} className="mr-1" />
                          Transact
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
      
      {/* Account Modal */}
      <SavingsAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleAccountCreated}
        account={selectedAccount}
      />
      
      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleTransactionCompleted}
        account={selectedAccount}
        type={transactionType}
      />
    </AppLayout>
  );
};

const Savings = () => {
  return (
    <AuthGuard>
      <SavingsPage />
    </AuthGuard>
  );
};

export default Savings;
