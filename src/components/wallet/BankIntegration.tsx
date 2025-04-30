
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

const Banks = [
  { id: "gn_bank", name: "GN Bank" },
  { id: "gcb", name: "Ghana Commercial Bank" },
  { id: "ecobank", name: "Ecobank Ghana" },
  { id: "zenith", name: "Zenith Bank Ghana" },
  { id: "stanbic", name: "Stanbic Bank Ghana" },
  { id: "uba", name: "UBA Ghana" },
];

const BankIntegration = () => {
  const [activeTab, setActiveTab] = useState("deposit");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bank, setBank] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleTransaction = async () => {
    if (!bank || !accountName || !accountNumber || amount <= 0 || !date) {
      toast({
        title: "Invalid Input",
        description: "Please provide all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      // In a real application, this would integrate with a bank API
      // For demo purposes, we're simulating the transaction
      
      // Generate transaction number
      const { data: transactionNumber, error: numberError } = await supabase
        .rpc('generate_transaction_number');
      
      if (numberError) throw numberError;
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id || "",
          amount: amount,
          transaction_type: activeTab === "deposit" ? "deposit" : "withdrawal",
          payment_method: "bank_transfer",
          transaction_number: transactionNumber,
          reference_number: reference || undefined,
          description: description || `${activeTab === "deposit" ? "Bank deposit from" : "Bank withdrawal to"} ${bank.replace('_', ' ')} - ${accountName}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id || "",
          metadata: {
            bank: bank,
            account_name: accountName,
            account_number: accountNumber,
            transaction_date: date?.toISOString()
          },
          status: "completed"
        });
        
      if (transactionError) throw transactionError;

      toast({
        title: "Transaction Recorded",
        description: `Bank ${activeTab === "deposit" ? "deposit" : "withdrawal"} has been recorded successfully`,
      });
      
      setIsDialogOpen(false);
      resetForm();
      
      // In a real app, we'd update the customer's account balance here
      
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast({
        title: "Transaction Failed",
        description: "An error occurred while processing the transaction",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setBank("");
    setAccountName("");
    setAccountNumber("");
    setAmount(0);
    setReference("");
    setDate(new Date());
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Bank Integration</h2>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleOpenDialog}>
              {activeTab === "deposit" ? "Record Bank Deposit" : "Record Bank Withdrawal"}
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Bank Deposits</TabsTrigger>
            <TabsTrigger value="withdrawal">Bank Withdrawals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {Banks.slice(0, 3).map((bank) => (
                <Card key={bank.id} className="p-4 flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{bank.name}</h3>
                    <p className="text-sm text-gray-500">Connected</p>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction No</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No bank deposits available.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="withdrawal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {Banks.slice(0, 3).map((bank) => (
                <Card key={bank.id} className="p-4 flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{bank.name}</h3>
                    <p className="text-sm text-gray-500">Connected</p>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction No</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No bank withdrawals available.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "deposit" ? "Record Bank Deposit" : "Record Bank Withdrawal"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bank">Bank</Label>
              <Select
                value={bank}
                onValueChange={setBank}
              >
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {Banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Bank account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
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
              <Label htmlFor="transaction-date">Transaction Date</Label>
              <DatePicker
                date={date}
                onSelect={setDate}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="Bank reference number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransaction} disabled={processing}>
              {processing ? "Processing..." : "Record Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankIntegration;
