
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethod, LoanStatus } from "@/types/app";

interface LoanProfile {
  full_name: string;
  phone_number: string;
}

interface Loan {
  id: string;
  user_id: string;
  loan_number: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  purpose: string | null;
  status: LoanStatus;
  disbursed_at: string | null;
  next_payment_date: string | null;
  total_paid: number | null;
  remaining_balance: number | null;
  profiles: LoanProfile | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  loan: Loan | null;
}

const LoanRepaymentModal = ({ isOpen, onClose, onSave, loan }: Props) => {
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
    if (!loan) return;
    
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Payment amount must be greater than zero",
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
      
      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          loan_id: loan.id,
          user_id: loan.user_id,
          amount: amount,
          transaction_type: "loan_repayment",
          payment_method: paymentMethod,
          transaction_number: transactionNumber,
          reference_number: reference || null,
          description: description || `Loan repayment for ${loan.loan_number}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id || "",
        });
      
      if (transactionError) throw transactionError;
      
      // Update loan record
      const newTotalPaid = (loan.total_paid || 0) + amount;
      const newRemainingBalance = loan.amount - newTotalPaid;
      const newStatus = newRemainingBalance <= 0 ? "fully_paid" : loan.status;
      
      const { error: loanUpdateError } = await supabase
        .from('loans')
        .update({
          total_paid: newTotalPaid,
          remaining_balance: newRemainingBalance,
          status: newStatus,
          // Calculate next payment date logic here if needed
        })
        .eq('id', loan.id);
      
      if (loanUpdateError) throw loanUpdateError;
      
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      
      resetForm();
      onSave();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!loan) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Loan Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{loan.profiles?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loan Number</p>
                <p className="font-medium">{loan.loan_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">₵{loan.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining Balance</p>
                <p className="font-medium">₵{(loan.remaining_balance || loan.amount).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
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
            {loading ? "Processing..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRepaymentModal;
