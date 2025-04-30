
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, ArrowDown, ArrowUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const MobileMoneyProviders = [
  { id: "mtn_momo", name: "MTN Mobile Money", color: "bg-yellow-500" },
  { id: "vodafone_cash", name: "Vodafone Cash", color: "bg-red-500" },
  { id: "airteltigo_money", name: "AirtelTigo Money", color: "bg-blue-500" },
];

interface MobileMoneyTransaction {
  id: string;
  transaction_number: string;
  amount: number;
  phone_number: string;
  provider: string;
  transaction_type: string;
  status: string;
  created_at: string;
  reference?: string;
}

const MobileMoneyIntegration = () => {
  const [activeTab, setActiveTab] = useState("deposit");
  const [transactions, setTransactions] = useState<MobileMoneyTransaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleTransaction = async () => {
    if (!provider || !phoneNumber || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      // In a real application, this would integrate with the mobile money provider's API
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
          payment_method: provider as any,
          transaction_number: transactionNumber,
          reference_number: reference || undefined,
          description: description || `${activeTab === "deposit" ? "Deposit from" : "Withdrawal to"} ${provider.replace('_', ' ')} - ${phoneNumber}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id || "",
          metadata: {
            phone_number: phoneNumber,
            provider: provider,
            account_id: selectedAccount || null
          },
          status: "completed"
        });
        
      if (transactionError) throw transactionError;

      toast({
        title: "Transaction Successful",
        description: `${activeTab === "deposit" ? "Deposit from" : "Withdrawal to"} ${phoneNumber} completed successfully`,
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
    setProvider("");
    setPhoneNumber("");
    setAmount(0);
    setReference("");
    setDescription("");
    setSelectedAccount("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Mobile Money Integration</h2>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleOpenDialog}>
              {activeTab === "deposit" ? "New Deposit" : "New Withdrawal"}
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {MobileMoneyProviders.map((provider) => (
                <Card key={provider.id} className="p-4 flex items-center">
                  <div className={`rounded-full ${provider.color} p-2 mr-3`}>
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
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
                    <TableHead>Provider</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No mobile money deposits available.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="withdrawal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {MobileMoneyProviders.map((provider) => (
                <Card key={provider.id} className="p-4 flex items-center">
                  <div className={`rounded-full ${provider.color} p-2 mr-3`}>
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
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
                    <TableHead>Provider</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No mobile money withdrawals available.
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
              {activeTab === "deposit" ? "Mobile Money Deposit" : "Mobile Money Withdrawal"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">Mobile Money Provider</Label>
              <Select
                value={provider}
                onValueChange={setProvider}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {MobileMoneyProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                placeholder="e.g. 0201234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
              <Label htmlFor="reference">Reference/Token (Optional)</Label>
              <Input
                id="reference"
                placeholder="Transaction reference or token"
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
              {processing ? "Processing..." : activeTab === "deposit" ? "Complete Deposit" : "Complete Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileMoneyIntegration;
