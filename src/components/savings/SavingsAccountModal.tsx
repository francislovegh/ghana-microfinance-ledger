
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { format, addMonths } from "date-fns";

// Define the SavingsAccount interface with the right types
interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  account_type: AccountType;
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
  customer?: {
    id: string;
    full_name: string;
  } | null;
}

interface FormValues {
  user_id: string;
  account_type: AccountType;
  interest_rate: number;
  maturity_date: string;
}

const SavingsAccountModal = ({ isOpen, onClose, onSave, account, customer }: SavingsAccountModalProps) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const { toast } = useToast();

  // Initialize the form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      user_id: "",
      account_type: "regular",
      interest_rate: 5,
      maturity_date: ""
    }
  });

  // Load customers when needed
  useEffect(() => {
    if (isOpen && !customer) {
      fetchCustomers();
    }
  }, [isOpen, customer]);

  // Set form values when account or customer changes
  useEffect(() => {
    if (account) {
      setValue("user_id", account.user_id);
      setValue("account_type", account.account_type);
      setValue("interest_rate", account.interest_rate);
      setValue("maturity_date", account.maturity_date || "");
    } else {
      reset({
        user_id: customer?.id || "",
        account_type: "regular",
        interest_rate: 5,
        maturity_date: ""
      });
    }
  }, [account, customer, reset, setValue]);

  // Update maturity date when account type changes
  useEffect(() => {
    const accountType = watch("account_type");
    if (accountType === "fixed_deposit" && !watch("maturity_date")) {
      // Default to 6 months maturity for fixed deposits
      const sixMonthsLater = addMonths(new Date(), 6);
      setValue("maturity_date", format(sixMonthsLater, "yyyy-MM-dd"));
    }
  }, [watch, setValue]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "customer")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching customers:", error);
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

      if (account) {
        // Update existing account
        const { error } = await supabase
          .from("savings_accounts")
          .update({
            account_type: data.account_type,
            interest_rate: data.interest_rate,
            maturity_date: data.account_type === "fixed_deposit" ? data.maturity_date : null,
          })
          .eq("id", account.id);

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Savings account updated successfully",
        });
      } else {
        // For new accounts, generate a transaction number using the Supabase function
        const { data: accountNumberData } = await supabase.rpc('generate_account_number');
        const accountNumber = accountNumberData || `SA-${Date.now()}`;

        // Create new account
        const { error } = await supabase
          .from("savings_accounts")
          .insert({
            user_id: data.user_id,
            account_number: accountNumber,
            account_type: data.account_type,
            interest_rate: data.interest_rate,
            maturity_date: data.account_type === "fixed_deposit" ? data.maturity_date : null,
            is_active: true,
            balance: 0
          });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Savings account created successfully",
        });
      }

      onSave();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Savings Account" : "New Savings Account"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer selection */}
          <div className="space-y-2">
            <Label htmlFor="user_id">Customer</Label>
            {customer ? (
              <Input value={customer.full_name} readOnly disabled />
            ) : (
              <Select
                value={watch("user_id")}
                onValueChange={(value) => setValue("user_id", value)}
                disabled={!!account || loadingCustomers}
              >
                <SelectTrigger className={errors.user_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCustomers ? (
                    <SelectItem value="loading" disabled>
                      Loading customers...
                    </SelectItem>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.user_id && (
              <p className="text-red-500 text-xs">{errors.user_id.message}</p>
            )}
          </div>

          {/* Account type */}
          <div className="space-y-2">
            <Label htmlFor="account_type">Account Type</Label>
            <Select 
              defaultValue="regular"
              value={watch("account_type")}
              onValueChange={(value: AccountType) => setValue("account_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Savings</SelectItem>
                <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                <SelectItem value="susu">Susu (Group Savings)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interest rate */}
          <div className="space-y-2">
            <Label htmlFor="interest_rate">Interest Rate (%)</Label>
            <Input
              id="interest_rate"
              type="number"
              step="0.01"
              {...register("interest_rate", {
                required: "Interest rate is required",
                min: {
                  value: 0,
                  message: "Interest rate must be positive",
                },
              })}
              className={errors.interest_rate ? "border-red-500" : ""}
            />
            {errors.interest_rate && (
              <p className="text-red-500 text-xs">{errors.interest_rate.message}</p>
            )}
          </div>

          {/* Maturity date for fixed deposits */}
          {watch("account_type") === "fixed_deposit" && (
            <div className="space-y-2">
              <Label htmlFor="maturity_date">Maturity Date</Label>
              <Input
                id="maturity_date"
                type="date"
                {...register("maturity_date", {
                  required: "Maturity date is required for fixed deposits",
                  validate: {
                    futureDate: (value) =>
                      new Date(value) > new Date() || "Maturity date must be in the future",
                  },
                })}
                className={errors.maturity_date ? "border-red-500" : ""}
              />
              {errors.maturity_date && (
                <p className="text-red-500 text-xs">{errors.maturity_date.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <LoadingSpinner /> : account ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsAccountModal;
