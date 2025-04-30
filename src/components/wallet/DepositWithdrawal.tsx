
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import TransactionModal from "@/components/savings/TransactionModal";
import { format } from "date-fns";

interface SavingsAccount {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  account_type: string;
  interest_rate: number;
  profiles: {
    full_name: string;
    phone_number: string;
  };
}

const DepositWithdrawal = () => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [modalType, setModalType] = useState<"deposit" | "withdrawal">("deposit");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          profiles:user_id(full_name, phone_number)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setAccounts(data as SavingsAccount[]);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account: SavingsAccount, type: "deposit" | "withdrawal") => {
    setSelectedAccount(account);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleTransactionComplete = () => {
    handleCloseModal();
    fetchAccounts();
    toast({
      title: "Transaction Successful",
      description: `${modalType === "deposit" ? "Deposit" : "Withdrawal"} was processed successfully.`,
    });
  };

  const filteredAccounts = accounts.filter(account => {
    const accountNumber = account.account_number.toLowerCase();
    const customerName = account.profiles?.full_name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    return accountNumber.includes(query) || customerName.includes(query);
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Search by account number or customer name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-2"
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account_number}</TableCell>
                        <TableCell>{account.profiles?.full_name}</TableCell>
                        <TableCell className="capitalize">
                          {account.account_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>₵{account.balance.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenModal(account, "deposit")}
                          >
                            Make Deposit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No accounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="withdrawal" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Search by account number or customer name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-2"
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account_number}</TableCell>
                        <TableCell>{account.profiles?.full_name}</TableCell>
                        <TableCell className="capitalize">
                          {account.account_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>₵{account.balance.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenModal(account, "withdrawal")}
                          >
                            Make Withdrawal
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No accounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      {isModalOpen && selectedAccount && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleTransactionComplete}
          account={selectedAccount}
          type={modalType}
        />
      )}
    </div>
  );
};

export default DepositWithdrawal;
