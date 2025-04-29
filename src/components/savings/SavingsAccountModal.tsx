
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SavingsProfile {
  full_name: string;
  phone_number: string;
  id: string;
  email?: string;
}

interface SavingsAccount {
  id: string;
  account_number: string;
  account_type: "regular" | "fixed_deposit" | "susu";
  balance: number;
  interest_rate: number;
  is_active: boolean;
  maturity_date?: string;
  user_id: string;
  created_at: string;
  profiles?: SavingsProfile;
}

interface SavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mode: "create" | "edit";
  account?: SavingsAccount;
  customerId?: string;
}

const SavingsAccountModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  mode, 
  account, 
  customerId 
}: SavingsAccountModalProps) => {
  const [accountType, setAccountType] = useState<"regular" | "fixed_deposit" | "susu">("regular");
  const [interestRate, setInterestRate] = useState<number>(0);
  const [maturityDate, setMaturityDate] = useState<string>("");
  const [initialDeposit, setInitialDeposit] = useState<number>(0);
  const [customerOptions, setCustomerOptions] = useState<SavingsProfile[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (mode === "edit" && account) {
      setAccountType(account.account_type);
      setInterestRate(account.interest_rate);
      if (account.maturity_date) {
        setMaturityDate(account.maturity_date.split('T')[0]);
      }
    } else {
      // Reset form for create mode
      setAccountType("regular");
      setInterestRate(0);
      setMaturityDate("");
      setInitialDeposit(0);
      
      // Set selectedCustomerId if provided
      if (customerId) {
        setSelectedCustomerId(customerId);
      }
    }
    
    // Fetch customer options if creating a new account
    if (mode === "create" && !customerId) {
      fetchCustomers();
    }
  }, [isOpen, mode, account, customerId]);
  
  const fetchCustomers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, email')
        .order('full_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (profiles) {
        setCustomerOptions(profiles);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async () => {
    // Fix: Use string comparison instead of type comparison 
    if (mode === "create" && !customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    
    if (accountType === "fixed_deposit" && !maturityDate) {
      toast({
        title: "Error",
        description: "Please specify a maturity date for fixed deposit accounts",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Handle create mode
      if (mode === "create") {
        // Get account number from Supabase function
        const { data: accountNumber, error: numberError } = await supabase
          .rpc('generate_account_number');
        
        if (numberError) throw numberError;
        
        const userId = customerId || selectedCustomerId;
        
        // Create new account
        const { data: newAccount, error } = await supabase
          .from('savings_accounts')
          .insert({
            account_number: accountNumber,
            account_type: accountType,
            interest_rate: interestRate,
            maturity_date: accountType === "fixed_deposit" ? maturityDate : null,
            user_id: userId,
          })
          .select('*')
          .single();
        
        if (error) throw error;
        
        // If initial deposit > 0, create a transaction for it
        if (initialDeposit > 0) {
          // Generate transaction number
          const { data: transactionNumber, error: tnError } = await supabase
            .rpc('generate_transaction_number');
          
          if (tnError) throw tnError;
          
          // Create deposit transaction
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              account_id: newAccount.id,
              user_id: userId,
              amount: initialDeposit,
              transaction_type: 'deposit',
              payment_method: 'cash', // Default
              transaction_number: transactionNumber,
              description: `Initial deposit for account ${accountNumber}`,
              performed_by: (await supabase.auth.getUser()).data.user?.id || ""
            });
            
          if (transactionError) throw transactionError;
        }
      } 
      // Handle edit mode
      else if (mode === "edit" && account) {
        // Update the account
        const { error } = await supabase
          .from('savings_accounts')
          .update({
            account_type: accountType,
            interest_rate: interestRate,
            maturity_date: accountType === "fixed_deposit" ? maturityDate : null,
          })
          .eq('id', account.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `Account ${mode === "create" ? "created" : "updated"} successfully`,
      });
      
      // Reset form and close modal
      setAccountType("regular");
      setInterestRate(0);
      setMaturityDate("");
      setInitialDeposit(0);
      setSelectedCustomerId(null);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: `Failed to ${mode} account`,
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
        
        <div className="space-y-4 py-4">
          {mode === "create" && !customerId && (
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select 
                value={selectedCustomerId || undefined} 
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name} ({customer.phone_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select 
              value={accountType} 
              onValueChange={(value) => setAccountType(value as "regular" | "fixed_deposit" | "susu")}
            >
              <SelectTrigger id="accountType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Savings</SelectItem>
                <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                <SelectItem value="susu">Susu Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
            />
          </div>
          
          {accountType === "fixed_deposit" && (
            <div className="space-y-2">
              <Label htmlFor="maturityDate">Maturity Date</Label>
              <Input
                id="maturityDate"
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
              />
            </div>
          )}
          
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="initialDeposit">Initial Deposit (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2">₵</span>
                <Input
                  id="initialDeposit"
                  type="number"
                  placeholder="0.00"
                  className="pl-6"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
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
