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
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

type TransactionType = "deposit" | "withdrawal";
type PaymentMethod = "cash" | "bank_transfer" | "mtn_momo" | "vodafone_cash" | "airteltigo_money";

interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  balance: number;
  account_type: string;
  profiles?: {
    full_name: string;
  };
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account: SavingsAccount;
  type: TransactionType;
}

interface FormValues {
  amount: string;
  payment_method: PaymentMethod;
  reference_number: string;
  description: string;
}

const TransactionModal = ({ isOpen, onClose, onSave, account, type }: TransactionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<{ id: string } | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      amount: "",
      payment_method: "cash",
      reference_number: "",
      description: ""
    }
  });
  
  useEffect(() => {
    if (isOpen) {
      reset({
        amount: "",
        payment_method: "cash",
        reference_number: "",
        description: ""
      });
      
      fetchCurrentUser();
    }
  }, [isOpen, reset]);
  
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
      
      // Validation for withdrawal
      if (type === "withdrawal" && amount > account.balance) {
        toast({
          title: "Insufficient funds",
          description: "Withdrawal amount exceeds available balance",
          variant: "destructive",
        });
        return;
      }
      
      // Create transaction record
      const transactionData = {
        account_id: account.id,
        user_id: account.user_id,
        amount: amount,
        transaction_type: type,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        description: data.description || null,
        performed_by: userDetails.id
      };
      
      // Update the account balance
      const newBalance = type === "deposit" 
        ? account.balance + amount 
        : account.balance - amount;
      
      // Try to use a custom RPC function directly instead of using rpc()
      let transactionSuccess = false;
      
      // Manually handle the transaction with multiple operations
      // 1. Insert transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData);
      
      if (transactionError) {
        toast({
          title: "Failed to record transaction",
          description: transactionError.message,
          variant: "destructive",
        });
        return;
      }
      
      // 2. Update account balance
      const { error: updateError } = await supabase
        .from("savings_accounts")
        .update({ balance: newBalance })
        .eq("id", account.id);
      
      if (updateError) {
        toast({
          title: "Failed to update account balance",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: `${type === "deposit" ? "Deposit" : "Withdrawal"} completed successfully`,
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
            {type === "deposit" ? (
              <div className="flex items-center">
                <ArrowUpCircle className="mr-2 h-5 w-5 text-green-600" />
                Deposit Funds
              </div>
            ) : (
              <div className="flex items-center">
                <ArrowDownCircle className="mr-2 h-5 w-5 text-red-600" />
                Withdraw Funds
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-3 bg-gray-50 rounded-md text-sm mb-4">
          <p className="font-medium">Account Information</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-gray-500">Account:</span>
            </div>
            <div>{account.account_number}</div>
            <div>
              <span className="text-gray-500">Customer:</span>
            </div>
            <div>{account.profiles?.full_name || "Unknown"}</div>
            <div>
              <span className="text-gray-500">Type:</span>
            </div>
            <div>{account.account_type.replace("_", " ")}</div>
            <div>
              <span className="text-gray-500">Current Balance:</span>
            </div>
            <div>₵ {account.balance.toFixed(2)}</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (₵) *
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
                    positive: (value) => parseFloat(value) > 0 || "Amount must be greater than 0",
                    notExceedBalance: (value) => 
                      type !== "withdrawal" || 
                      parseFloat(value) <= account.balance || 
                      "Insufficient funds"
                  }
                })}
                placeholder="Enter amount"
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
              className={type === "deposit" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {loading ? (
                <LoadingSpinner />
              ) : type === "deposit" ? (
                "Complete Deposit"
              ) : (
                "Complete Withdrawal"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
