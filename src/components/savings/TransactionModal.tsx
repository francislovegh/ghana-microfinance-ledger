
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethod, TransactionType } from "@/types/app";

interface SavingsProfile {
  full_name: string;
  phone_number: string;
}

interface SavingsAccount {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  account_type: string;
  interest_rate: number;
  profiles: SavingsProfile;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account: SavingsAccount | null;
  type: "deposit" | "withdrawal";
}

const TransactionModal = ({ isOpen, onClose, onSave, account, type }: Props) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const resetForm = () => {
    setAmount(0);
    setPaymentMethod("cash");
    setReference("");
    setDescription("");
  };
  
  const handleSubmit = async () => {
    if (!account) return;
    
    if (amount <= 0) {
      toast({
        title: "Error",
        description: `${type === "deposit" ? "Deposit" : "Withdrawal"} amount must be greater than zero`,
        variant: "destructive",
      });
      return;
    }
    
    if (type === "withdrawal" && amount > account.balance) {
      toast({
        title: "Error",
        description: "Withdrawal amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate transaction number
      const { data: transactionNumber, error: numberError } = await supabase
        .rpc('generate_transaction_number');
      
      if (numberError) throw numberError;
      
      // Process the transaction
      const newBalance = type === "deposit" 
        ? account.balance + amount 
        : account.balance - amount;
        
      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: account.id,
          user_id: account.user_id,
          amount: amount,
          transaction_type: type as TransactionType,
          payment_method: paymentMethod,
          transaction_number: transactionNumber,
          reference_number: reference || null,
          description: description || `${type === "deposit" ? "Deposit to" : "Withdrawal from"} account ${account.account_number}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id || ""
        });
      
      if (transactionError) throw transactionError;
      
      // Update account balance
      const { error: balanceError } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', account.id);
      
      if (balanceError) throw balanceError;
      
      toast({
        title: "Success",
        description: `${type === "deposit" ? "Deposit" : "Withdrawal"} processed successfully`,
      });
      
      resetForm();
      onSave();
    } catch (error) {
      console.error(`Error processing ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to process ${type}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!account) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "deposit" ? "Make Deposit" : "Make Withdrawal"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{account.profiles?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium">{account.account_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium">{account.account_type.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="font-medium">₵{account.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {type === "deposit" ? "Deposit" : "Withdrawal"} Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2">₵</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-6"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                  <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                  <SelectItem value="airteltigo_money">AirtelTigo Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="e.g. Receipt number, transaction ID"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : type === "deposit" ? "Make Deposit" : "Make Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
