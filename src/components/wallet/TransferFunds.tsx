
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
import { TransactionType, TransferMetadata } from "@/types/app";

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
      
      const transactionType: TransactionType = "transfer";
      
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
          metadata,
          performed_by_profile:profiles!transactions_performed_by_fkey(full_name)
        `)
        .eq('transaction_type', transactionType)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('No data returned');
      }
      
      // Process transfers using the metadata column
      const processedTransfers = data.map((transaction) => {
        // Safely handle the metadata conversion with type checking
        const rawMeta = transaction.metadata;
        let meta: TransferMetadata | null = null;
        
        // Check if metadata is an object and has the required properties
        if (rawMeta && 
            typeof rawMeta === 'object' && 
            !Array.isArray(rawMeta) &&
            'source_account' in rawMeta && 
            'destination_account' in rawMeta && 
            'source_customer' in rawMeta && 
            'destination_customer' in rawMeta) {
          meta = rawMeta as TransferMetadata;
        }
        
        return {
          id: transaction.id,
          source_account: meta?.source_account || "Unknown account",
          destination_account: meta?.destination_account || "Unknown account",
          amount: transaction.amount,
          transaction_number: transaction.transaction_number,
          description: transaction.description || "Fund transfer",
          created_at: transaction.created_at,
          source_customer: meta?.source_customer || "Source Customer",
          destination_customer: meta?.destination_customer || "Destination Customer"
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
      
      // Store metadata about the transfer
      const transferMetadata: TransferMetadata = {
        source_account: source.account_number,
        destination_account: destination.account_number,
        source_customer: source.profiles.full_name,
        destination_customer: destination.profiles.full_name
      };
      
      // Create transfer transaction - fix the insert call
      const { error: transferError } = await supabase
        .from('transactions')
        .insert({
          user_id: source.user_id,
          amount: amount,
          transaction_type: "transfer",
          payment_method: 'cash', // Using cash as default since we don't have an internal type
          transaction_number: transactionNumber,
          description: description || `Transfer from ${source.account_number} to ${destination.account_number}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id || "",
          metadata: transferMetadata
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
