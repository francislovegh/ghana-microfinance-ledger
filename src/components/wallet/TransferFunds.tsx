
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SavingsAccount {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  account_type: string;
  profiles: {
    full_name: string;
  };
}

interface TransferTransaction {
  id: string;
  source_account: string;
  destination_account: string;
  amount: number;
  transaction_number: string;
  description: string;
  created_at: string;
  source_customer: string;
  destination_customer: string;
}

const TransferFunds = () => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [transfers, setTransfers] = useState<TransferTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceAccount, setSourceAccount] = useState<string>("");
  const [destinationAccount, setDestinationAccount] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
    fetchTransfers();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          id,
          user_id,
          account_number,
          balance,
          account_type,
          profiles:user_id(full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAccounts(data as SavingsAccount[]);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      setTransfersLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          amount,
          description,
          created_at,
          user_id,
          performed_by,
          metadata
        `)
        .eq('transaction_type', 'transfer')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const processedTransfers = data.map(transfer => {
        const metadata = transfer.metadata || {};
        const sourceAccountNum = metadata.source_account || 'Unknown';
        const destAccountNum = metadata.destination_account || 'Unknown';
        
        const sourceAccount = accounts.find(acc => acc.account_number === sourceAccountNum);
        const destAccount = accounts.find(acc => acc.account_number === destAccountNum);
        
        return {
          id: transfer.id,
          source_account: sourceAccountNum,
          destination_account: destAccountNum,
          amount: transfer.amount,
          transaction_number: transfer.transaction_number,
          description: transfer.description,
          created_at: transfer.created_at,
          source_customer: sourceAccount?.profiles?.full_name || 'Unknown',
          destination_customer: destAccount?.profiles?.full_name || 'Unknown'
        };
      });
      
      setTransfers(processedTransfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer history",
        variant: "destructive",
      });
    } finally {
      setTransfersLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!sourceAccount || !destinationAccount || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide valid source and destination accounts, and amount",
        variant: "destructive",
      });
      return;
    }
    
    if (sourceAccount === destinationAccount) {
      toast({
        title: "Invalid Accounts",
        description: "Source and destination accounts cannot be the same",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setProcessing(true);
      
      // Find source and destination account details
      const source = accounts.find(acc => acc.id === sourceAccount);
      const destination = accounts.find(acc => acc.id === destinationAccount);
      
      if (!source || !destination) {
        throw new Error("Invalid account selection");
      }
      
      if (source.balance < amount) {
        toast({
          title: "Insufficient Balance",
          description: "Source account has insufficient funds",
          variant: "destructive",
        });
        return;
      }
      
      // Generate transaction number
      const { data: transactionNumber, error: numberError } = await supabase
        .rpc('generate_transaction_number');
      
      if (numberError) throw numberError;
      
      // Create transfer transaction
      const { error: transferError } = await supabase
        .from('transactions')
        .insert({
          user_id: source.user_id,
          amount: amount,
          transaction_type: 'transfer',
          payment_method: 'internal',
          transaction_number: transactionNumber,
          description: description || `Transfer from ${source.account_number} to ${destination.account_number}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id || "",
          metadata: {
            source_account: source.account_number,
            destination_account: destination.account_number,
            source_account_id: source.id,
            destination_account_id: destination.id
          }
        });
        
      if (transferError) throw transferError;
      
      // Update source account balance
      const { error: sourceError } = await supabase
        .from('savings_accounts')
        .update({ balance: source.balance - amount })
        .eq('id', source.id);
        
      if (sourceError) throw sourceError;
      
      // Update destination account balance
      const { error: destError } = await supabase
        .from('savings_accounts')
        .update({ balance: destination.balance + amount })
        .eq('id', destination.id);
        
      if (destError) throw destError;
      
      toast({
        title: "Transfer Successful",
        description: `₵${amount} transferred successfully`,
      });
      
      setIsDialogOpen(false);
      setSourceAccount("");
      setDestinationAccount("");
      setAmount(0);
      setDescription("");
      
      // Refresh data
      fetchAccounts();
      fetchTransfers();
    } catch (error) {
      console.error('Error processing transfer:', error);
      toast({
        title: "Transfer Failed",
        description: "An error occurred while processing the transfer",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Internal Fund Transfers</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            New Transfer
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction No</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfersLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="text-center">
                      Loading transfer history...
                    </TableCell>
                  </TableRow>
                ))
              ) : transfers.length > 0 ? (
                transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.transaction_number.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transfer.source_account}</p>
                        <p className="text-xs text-gray-500">{transfer.source_customer}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transfer.destination_account}</p>
                        <p className="text-xs text-gray-500">{transfer.destination_customer}</p>
                      </div>
                    </TableCell>
                    <TableCell>₵{transfer.amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(transfer.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No transfer history available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="source-account">From Account</Label>
              <Select
                value={sourceAccount}
                onValueChange={setSourceAccount}
              >
                <SelectTrigger id="source-account">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_number} - {account.profiles.full_name} (₵{account.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="destination-account">To Account</Label>
              <Select
                value={destinationAccount}
                onValueChange={setDestinationAccount}
              >
                <SelectTrigger id="destination-account">
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_number} - {account.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₵)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter transfer description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={processing}>
              {processing ? "Processing..." : "Transfer Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransferFunds;
