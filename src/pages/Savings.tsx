
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PiggyBank, PlusCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SavingsAccountModal from "@/components/savings/SavingsAccountModal";
import TransactionModal from "@/components/savings/TransactionModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { useToast } from "@/hooks/use-toast";

interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  account_type: string;
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
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [transactionType, setTransactionType] = useState<"deposit" | "withdrawal">("deposit");
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("savings_accounts")
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching savings accounts:", error);
        toast({
          title: "Failed to fetch accounts",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountModalClose = () => {
    setSelectedAccount(null);
    setIsAccountModalOpen(false);
  };

  const handleTransactionModalClose = () => {
    setSelectedAccount(null);
    setIsTransactionModalOpen(false);
  };

  const handleAccountSaved = () => {
    fetchAccounts();
    setIsAccountModalOpen(false);
    setSelectedAccount(null);
  };

  const handleTransactionSaved = () => {
    fetchAccounts();
    setIsTransactionModalOpen(false);
    setSelectedAccount(null);
  };

  const handleDeposit = (account: SavingsAccount) => {
    setSelectedAccount(account);
    setTransactionType("deposit");
    setIsTransactionModalOpen(true);
  };

  const handleWithdrawal = (account: SavingsAccount) => {
    setSelectedAccount(account);
    setTransactionType("withdrawal");
    setIsTransactionModalOpen(true);
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case "regular":
        return <Badge className="bg-blue-500">Regular</Badge>;
      case "fixed_deposit":
        return <Badge className="bg-purple-500">Fixed Deposit</Badge>;
      case "susu":
        return <Badge className="bg-green-500">Susu</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };
  
  const filteredAccounts = accounts.filter((account) => {
    // Apply search filter
    const searchMatches = !searchQuery || 
      (account.account_number.includes(searchQuery) || 
      (account.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (account.profiles?.phone_number.includes(searchQuery)));
      
    // Apply account type filter
    const typeMatches = !accountTypeFilter || account.account_type === accountTypeFilter;
    
    return searchMatches && typeMatches;
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Savings Management</h1>
        <p className="text-gray-600">Manage customer savings accounts</p>
      </div>

      <Card className="mb-6">
        <div className="p-4 flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 md:items-center w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search accounts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All account types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All account types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                <SelectItem value="susu">Susu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setSelectedAccount(null);
              setIsAccountModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PiggyBank className="mr-2 h-4 w-4" />
            New Savings Account
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Balance (₵)</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_number}</TableCell>
                    <TableCell>
                      {account.profiles?.full_name || "Unknown"}
                      <div className="text-xs text-gray-500">
                        {account.profiles?.phone_number}
                      </div>
                    </TableCell>
                    <TableCell>{getAccountTypeBadge(account.account_type)}</TableCell>
                    <TableCell className="font-semibold">
                      {account.balance.toFixed(2)}
                    </TableCell>
                    <TableCell>{account.interest_rate}%</TableCell>
                    <TableCell>
                      {account.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleDeposit(account)}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleWithdrawal(account)}
                          disabled={account.balance <= 0}
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsAccountModalOpen(true);
                          }}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchQuery || accountTypeFilter
                      ? "No savings accounts matching your search criteria"
                      : "No savings accounts found. Create your first account!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <SavingsAccountModal
        isOpen={isAccountModalOpen}
        onClose={handleAccountModalClose}
        onSave={handleAccountSaved}
        account={selectedAccount}
      />

      {selectedAccount && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleTransactionModalClose}
          onSave={handleTransactionSaved}
          account={selectedAccount}
          type={transactionType}
        />
      )}
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
