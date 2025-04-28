import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ArrowUpCircle } from "lucide-react";

interface LoanSchedule {
  id: string;
  payment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  paid_amount: number | null;
  is_paid: boolean;
  payment_date: string | null;
}

interface Loan {
  id: string;
  loan_number: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  remaining_balance: number;
  total_paid: number;
  profiles?: {
    full_name: string;
  };
}

interface LoanRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  loan: Loan;
}

interface FormValues {
  amount: string;
  payment_method: string;
  reference_number: string;
  description: string;
  schedule_id?: string;
}

const LoanRepaymentModal = ({ isOpen, onClose, onSave, loan }: LoanRepaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedules, setSchedules] = useState<LoanSchedule[]>([]);
  const [nextPayment, setNextPayment] = useState<LoanSchedule | null>(null);
  const [userDetails, setUserDetails] = useState<{ id: string } | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      amount: "",
      payment_method: "cash",
      reference_number: "",
      description: ""
    }
  });
  
  useEffect(() => {
    if (isOpen && loan) {
      reset({
        amount: "",
        payment_method: "cash",
        reference_number: "",
        description: ""
      });
      
      fetchCurrentUser();
      fetchLoanSchedules();
    }
  }, [isOpen, loan, reset]);
  
  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserDetails({ id: user.id });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };
  
  const fetchLoanSchedules = async () => {
    if (!loan) return;
    
    setLoadingSchedules(true);
    try {
      const { data, error } = await supabase
        .from("loan_schedules")
        .select("*")
        .eq("loan_id", loan.id)
        .order("payment_number", { ascending: true });
        
      if (error) {
        console.error("Error fetching loan schedules:", error);
      } else if (data) {
        setSchedules(data);
        
        const nextUnpaidSchedule = data.find(schedule => !schedule.is_paid);
        if (nextUnpaidSchedule) {
          setNextPayment(nextUnpaidSchedule);
          setValue("amount", nextUnpaidSchedule.total_amount.toString());
          setValue("schedule_id", nextUnpaidSchedule.id);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoadingSchedules(false);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      if (!userDetails) {
        toast({
          title: "Error",
          description: "User authentication required",
          variant: "destructive",
        });
        return;
      }
      
      const amount = parseFloat(data.amount);
      const scheduleId = watch("schedule_id");
      
      let updatedSchedule = false;
      if (scheduleId) {
        const schedule = schedules.find(s => s.id === scheduleId);
        
        if (schedule) {
          const isPaidInFull = amount >= schedule.total_amount;
          const newPaidAmount = isPaidInFull ? schedule.total_amount : amount;
          
          const { error: scheduleError } = await supabase
            .from("loan_schedules")
            .update({
              paid_amount: newPaidAmount,
              is_paid: isPaidInFull,
              payment_date: new Date().toISOString()
            })
            .eq("id", scheduleId);
            
          if (scheduleError) {
            toast({
              title: "Error updating loan schedule",
              description: scheduleError.message,
              variant: "destructive",
            });
            return;
          }
          
          updatedSchedule = true;
        }
      }
      
      const newTotalPaid = (loan.total_paid || 0) + amount;
      const newRemainingBalance = loan.amount - newTotalPaid;
      
      const isFullyPaid = newRemainingBalance <= 0;
      
      const { error: loanError } = await supabase
        .from("loans")
        .update({
          total_paid: newTotalPaid,
          remaining_balance: Math.max(0, newRemainingBalance),
          status: isFullyPaid ? "fully_paid" : "active",
          next_payment_date: isFullyPaid 
            ? null 
            : schedules.find(s => !s.is_paid && s.id !== scheduleId)?.due_date || null
        })
        .eq("id", loan.id);
        
      if (loanError) {
        toast({
          title: "Error updating loan",
          description: loanError.message,
          variant: "destructive",
        });
        return;
      }
      
      const transactionData = {
        loan_id: loan.id,
        user_id: loan.user_id,
        amount: amount,
        transaction_type: "loan_repayment",
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        description: data.description || null,
        performed_by: userDetails.id
      };
      
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData);
        
      if (transactionError) {
        toast({
          title: "Error creating transaction record",
          description: transactionError.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: `Loan repayment of ₵${amount.toFixed(2)} recorded successfully`,
      });
      
      onSave();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center">
              <ArrowUpCircle className="mr-2 h-5 w-5 text-green-600" />
              Loan Repayment
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-3 bg-gray-50 rounded-md text-sm mb-4">
          <p className="font-medium">Loan Information</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-gray-500">Loan Number:</span>
            </div>
            <div>{loan.loan_number}</div>
            <div>
              <span className="text-gray-500">Customer:</span>
            </div>
            <div>{loan.profiles?.full_name || "Unknown"}</div>
            <div>
              <span className="text-gray-500">Loan Amount:</span>
            </div>
            <div>₵ {loan.amount.toLocaleString()}</div>
            <div>
              <span className="text-gray-500">Remaining Balance:</span>
            </div>
            <div>₵ {loan.remaining_balance.toLocaleString()}</div>
            <div>
              <span className="text-gray-500">Total Paid:</span>
            </div>
            <div>₵ {loan.total_paid ? loan.total_paid.toLocaleString() : "0.00"}</div>
          </div>
        </div>
        
        {nextPayment && (
          <div className="p-3 bg-blue-50 rounded-md text-sm mb-4 border border-blue-100">
            <p className="font-medium text-blue-800">Next Scheduled Payment</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-blue-700">Payment Number:</span>
              </div>
              <div>#{nextPayment.payment_number}</div>
              <div>
                <span className="text-blue-700">Due Date:</span>
              </div>
              <div>{new Date(nextPayment.due_date).toLocaleDateString()}</div>
              <div>
                <span className="text-blue-700">Amount Due:</span>
              </div>
              <div>₵ {nextPayment.total_amount.toLocaleString()}</div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {schedules.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="schedule_id">Apply Payment To</Label>
                <Select 
                  value={watch("schedule_id") || ""}
                  onValueChange={(value) => setValue("schedule_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Amount</SelectItem>
                    {schedules
                      .filter(schedule => !schedule.is_paid)
                      .map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          #{schedule.payment_number} - ₵{schedule.total_amount} (Due: {new Date(schedule.due_date).toLocaleDateString()})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">
                Payment Amount (₵) *
              </Label>
              <Input
                id="amount"
                {...register("amount", { 
                  required: "Amount is required", 
                  pattern: { 
                    value: /^\d*\.?\d*$/, 
                    message: "Must be a valid number" 
                  },
                  validate: {
                    positive: (value) => parseFloat(value) > 0 || "Amount must be greater than 0"
                  }
                })}
                placeholder="Enter payment amount"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs">{errors.amount.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select 
                defaultValue="cash"
                onValueChange={(value) => register("payment_method").onChange({
                  target: { name: "payment_method", value }
                })}
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
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                {...register("reference_number")}
                placeholder="Optional reference number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional transaction description"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? <LoadingSpinner /> : "Process Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRepaymentModal;
