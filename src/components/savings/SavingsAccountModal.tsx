import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AccountType } from "@/types/app";
import { addMonths } from "date-fns";

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
}

interface SavingsAccount {
  id: string;
  account_number: string;
  user_id: string;
  balance: number;
  account_type: AccountType;
  interest_rate: number;
  maturity_date: string | null;
  is_active: boolean;
}

type ModalMode = "create" | "edit";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account: SavingsAccount | null;
  mode: ModalMode;
}

const SavingsAccountModal = ({ isOpen, onClose, onSave, account, mode }: Props) => {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [accountType, setAccountType] = useState<AccountType>("regular");
  const [initialDeposit, setInitialDeposit] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(5);
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      
      if (mode === "edit" && account) {
        setCustomerId(account.user_id);
        setAccountType(account.account_type);
        setInterestRate(account.interest_rate);
        setMaturityDate(account.maturity_date ? new Date(account.maturity_date) : undefined);
        setIsActive(account.is_active);
      } else {
        resetForm();
      }
    }
  }, [isOpen, account, mode]);
  
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number")
        .eq("role", "customer")
        .order("full_name");
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };
  
  const resetForm = () => {
    setCustomerId("");
    setAccountType("regular");
    setInitialDeposit(0);
    setInterestRate(5);
    setMaturityDate(undefined);
    setIsActive(true);
  };
  
  const handleAccountTypeChange = (value: string) => {
    const accountType = value as AccountType;
    setAccountType(accountType);
    
    // Set default values based on account type
    if (accountType === "fixed_deposit") {
      setInterestRate(15);
      setMaturityDate(addMonths(new Date(), 12));
    } else if (accountType === "susu") {
      setInterestRate(7.5);
      setMaturityDate(addMonths(new Date(), 6));
    } else {
      setInterestRate(5);
      setMaturityDate(undefined);
    }
  };
  
  const handleSubmit = async () => {
    if (mode === "create" && !customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    
    if (mode === "create" && initialDeposit < 0) {
      toast({
        title: "Error",
        description: "Initial deposit cannot be negative",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (mode === "create") {
        // Get account number from Supabase function
        const { data: accountNumber, error: numberError } = await supabase
          .rpc('generate_account_number');
          
        if (numberError) throw numberError;
        
        // Create the account
        const { error: accountError } = await supabase
          .from('savings_accounts')
          .insert({
            user_id: customerId,
            account_type: accountType,
            interest_rate: interestRate,
            balance: initialDeposit,
            maturity_date: maturityDate?.toISOString() || null,
            is_active: isActive,
            account_number: accountNumber
          });
          
        if (accountError) throw accountError;
        
        // If there's an initial deposit, record a transaction
        if (initialDeposit > 0) {
          // Generate transaction number
          const { data: transactionNumber, error: transNumberError } = await supabase
            .rpc('generate_transaction_number');
            
          if (transNumberError) throw transNumberError;
          
          // Get the inserted account
          const { data: accountData, error: fetchError } = await supabase
            .from('savings_accounts')
            .select('id')
            .eq('account_number', accountNumber)
            .single();
            
          if (fetchError) throw fetchError;
          
          // Record the deposit transaction
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              account_id: accountData.id,
              user_id: customerId,
              amount: initialDeposit,
              transaction_type: "deposit",
              payment_method: "cash",
              transaction_number: transactionNumber,
              reference_number: `Initial deposit for account ${accountNumber}`,
              description: "Initial account deposit",
              performed_by: (await supabase.auth.getUser()).data.user?.id || ""
            });
            
          if (transactionError) throw transactionError;
        }
      } else if (mode === "edit" && account) {
        // Update the account
        const { error } = await supabase
          .from('savings_accounts')
          .update({
            account_type: accountType,
            interest_rate: interestRate,
            maturity_date: maturityDate?.toISOString() || null,
            is_active: isActive
          })
          .eq('id', account.id);
          
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: mode === "create" ? "Account created successfully" : "Account updated successfully",
      });
      
      onSave();
    } catch (error) {
      console.error("Error saving account:", error);
      toast({
        title: "Error",
        description: `Failed to ${mode === "create" ? "create" : "update"} account`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Savings Account" : "Edit Savings Account"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {mode === "create" && customers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={mode === "edit"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name} - {customer.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {mode === "edit" && account && (
            <div className="bg-gray-50 p-4 rounded-md mb-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{account.account_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="font-medium">₵{account.balance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select 
              value={accountType} 
              onValueChange={handleAccountTypeChange}
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
          
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="initialDeposit">Initial Deposit (₵)</Label>
              <Input
                id="initialDeposit"
                type="number"
                value={initialDeposit || ""}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              value={interestRate || ""}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maturityDate">Maturity Date {accountType === "regular" && "(Optional)"}</Label>
            <DatePicker
              date={maturityDate}
              onSelect={setMaturityDate}
              disabled={false}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isActive">Account is active</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : mode === "create" ? "Create Account" : "Update Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsAccountModal;
