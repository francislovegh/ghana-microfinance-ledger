
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
}

interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  account_type: string;
  balance: number;
  interest_rate: number;
  maturity_date: string | null;
  is_active: boolean;
}

interface SavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account: SavingsAccount | null;
}

interface FormValues {
  user_id: string;
  account_type: string;
  interest_rate: string;
  maturity_date?: Date;
  is_active: boolean;
}

const SavingsAccountModal = ({ isOpen, onClose, onSave, account }: SavingsAccountModalProps) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      user_id: "",
      account_type: "regular",
      interest_rate: "5.0",
      is_active: true
    }
  });
  
  const accountType = watch("account_type");
  
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      
      if (account) {
        setValue("user_id", account.user_id);
        setValue("account_type", account.account_type);
        setValue("interest_rate", account.interest_rate.toString());
        setValue("is_active", account.is_active);
        
        if (account.maturity_date) {
          setValue("maturity_date", new Date(account.maturity_date));
        }
      } else {
        reset({
          user_id: "",
          account_type: "regular",
          interest_rate: "5.0",
          is_active: true
        });
      }
    }
  }, [isOpen, account, setValue, reset]);
  
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number")
        .eq("role", "customer")
        .order("full_name");
        
      if (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Failed to load customers",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setCustomers(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      const accountData = {
        user_id: data.user_id,
        account_type: data.account_type,
        interest_rate: parseFloat(data.interest_rate),
        maturity_date: data.account_type === "fixed_deposit" && data.maturity_date 
          ? data.maturity_date.toISOString() 
          : null,
        is_active: data.is_active
      };
      
      let error;
      
      if (account) {
        // Update existing account
        const { error: updateError } = await supabase
          .from("savings_accounts")
          .update(accountData)
          .eq("id", account.id);
          
        error = updateError;
      } else {
        // Create new account
        const { error: insertError } = await supabase
          .from("savings_accounts")
          .insert({
            ...accountData,
            balance: 0.00
          });
          
        error = insertError;
      }
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: account 
            ? "Savings account updated successfully" 
            : "Savings account created successfully",
        });
        onSave();
      }
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
          <DialogTitle>{account ? "Edit Savings Account" : "New Savings Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Customer *</Label>
              <Select
                value={watch("user_id")}
                onValueChange={(value) => setValue("user_id", value)}
                disabled={account !== null || loadingCustomers}
              >
                <SelectTrigger className={errors.user_id ? "border-red-500" : ""}>
                  <SelectValue placeholder={loadingCustomers ? "Loading..." : "Select a customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name} - {customer.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-red-500 text-xs">A customer is required</p>
              )}
              {account && (
                <p className="text-xs text-gray-500">Customer cannot be changed after account creation</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type *</Label>
              <Select
                value={watch("account_type")}
                onValueChange={(value) => setValue("account_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Savings</SelectItem>
                  <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                  <SelectItem value="susu">Susu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
              <Input
                id="interest_rate"
                {...register("interest_rate", { 
                  required: "Interest rate is required", 
                  pattern: { 
                    value: /^\d*\.?\d*$/, 
                    message: "Must be a valid number" 
                  }
                })}
                placeholder="e.g., 5.0"
                className={errors.interest_rate ? "border-red-500" : ""}
              />
              {errors.interest_rate && (
                <p className="text-red-500 text-xs">{errors.interest_rate.message}</p>
              )}
            </div>
            
            {accountType === "fixed_deposit" && (
              <div className="space-y-2">
                <Label>Maturity Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("maturity_date") && "text-muted-foreground",
                        errors.maturity_date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("maturity_date") ? (
                        format(watch("maturity_date") as Date, "PPP")
                      ) : (
                        <span>Select a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch("maturity_date") as Date}
                      onSelect={(date) => setValue("maturity_date", date)}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {accountType === "fixed_deposit" && !watch("maturity_date") && (
                  <p className="text-red-500 text-xs">Maturity date is required for fixed deposits</p>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register("is_active")}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active">Account Active</Label>
            </div>
            
            {account && (
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                <p className="font-medium">Account Information</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-gray-500">Account Number:</span>
                  </div>
                  <div>{account.account_number}</div>
                  <div>
                    <span className="text-gray-500">Current Balance:</span>
                  </div>
                  <div>₵ {account.balance.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <LoadingSpinner /> : account ? "Update Account" : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsAccountModal;
