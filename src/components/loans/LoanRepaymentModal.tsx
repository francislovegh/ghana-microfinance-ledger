
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethod, LoanStatus } from "@/types/app";
import { format } from "date-fns";

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

interface LoanSchedule {
  id: string;
  payment_number: number;
  due_date: string;
  total_amount: number;
  is_paid: boolean;
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
  const [isEarlyPayment, setIsEarlyPayment] = useState(false);
  const [schedules, setSchedules] = useState<LoanSchedule[]>([]);
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (loan && isOpen) {
      // Set default payment amount to next payment due
      fetchNextPayment(loan.id);
      setDescription(`Loan repayment for ${loan.loan_number}`);
    }
  }, [loan, isOpen]);

  const fetchNextPayment = async (loanId: string) => {
    try {
      const { data, error } = await supabase
        .from("loan_schedules")
        .select("*")
        .eq("loan_id", loanId)
        .eq("is_paid", false)
        .order("payment_number", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSchedules(data);
        setNextPaymentAmount(data[0].total_amount);
        setAmount(data[0].total_amount);
      } else if (loan?.remaining_balance && loan.remaining_balance > 0) {
        // If no schedule but balance remaining, set full remaining balance
        setNextPaymentAmount(loan.remaining_balance);
        setAmount(loan.remaining_balance);
      }
    } catch (error) {
      console.error("Error fetching next payment:", error);
    }
  };
  
  const resetForm = () => {
    setAmount(0);
    setPaymentMethod("cash");
    setReference("");
    setDescription("");
    setIsEarlyPayment(false);
  };

  const handleAmountChange = (value: number) => {
    setAmount(value);
    setIsEarlyPayment(value > nextPaymentAmount);
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
      
      // Process payment through the new function
      const { data: excessAmount, error: processError } = await supabase
        .rpc('process_loan_payment', {
          p_loan_id: loan.id,
          p_amount: amount
        });
      
      if (processError) throw processError;
      
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
      
      let successMessage = "Payment recorded successfully";
      
      // Check if there was excess payment
      if (excessAmount && excessAmount > 0) {
        successMessage += ` (Excess amount: ₵${excessAmount.toFixed(2)})`;
      }
      
      toast({
        title: "Success",
        description: successMessage,
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
              {loan.next_payment_date && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Next Payment Due</p>
                  <p className="font-medium">
                    {format(new Date(loan.next_payment_date), "MMMM d, yyyy")} 
                    {nextPaymentAmount > 0 && ` - ₵${nextPaymentAmount.toFixed(2)}`}
                  </p>
                </div>
              )}
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
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                />
              </div>
            </div>

            {isEarlyPayment && (
              <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-md">
                <div>
                  <Checkbox 
                    id="earlyPayment" 
                    checked={true} 
                    disabled={true}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="earlyPayment">Early/Excess Payment</Label>
                  <p className="text-sm text-gray-600">
                    This payment is higher than the next scheduled amount. The excess will be applied to future payments.
                  </p>
                </div>
              </div>
            )}
            
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
