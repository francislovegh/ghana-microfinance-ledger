
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IdType } from "@/types/app";
import { nanoid } from "nanoid";

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
}

interface Guarantor {
  id: string;
  full_name: string;
  phone_number: string;
  relationship: string;
  id_type: IdType;
  id_number: string;
}

const LoanApplicationModal = ({ isOpen, onClose, onSave }: LoanApplicationModalProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(15);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [purpose, setPurpose] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    { id: nanoid(), full_name: "", phone_number: "", relationship: "", id_type: "ghana_card", id_number: "" }
  ]);
  const { toast } = useToast();

  // Fix for guarantor ID type selection
  const handleGuarantorIdTypeChange = (value: string, index: number) => {
    const updatedGuarantors = [...guarantors];
    updatedGuarantors[index].id_type = value as IdType;
    setGuarantors(updatedGuarantors);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number")
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
    
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, toast]);

  const addGuarantor = () => {
    setGuarantors([...guarantors, {
      id: nanoid(),
      full_name: "",
      phone_number: "",
      relationship: "",
      id_type: "ghana_card",
      id_number: ""
    }]);
  };

  const removeGuarantor = (id: string) => {
    if (guarantors.length > 1) {
      setGuarantors(guarantors.filter(g => g.id !== id));
    }
  };

  const updateGuarantor = (id: string, field: keyof Guarantor, value: string) => {
    setGuarantors(guarantors.map(g => {
      if (g.id === id) {
        return { ...g, [field]: value };
      }
      return g;
    }));
  };

  const handleSubmit = async () => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Loan amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (interestRate <= 0) {
      toast({
        title: "Error",
        description: "Interest rate must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (termMonths <= 0) {
      toast({
        title: "Error",
        description: "Term length must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call stored procedure to generate loan number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_loan_number');
        
      if (numberError) throw numberError;
      const loanNumber = numberData;
      
      // Insert loan record
      const { error: loanError } = await supabase
        .from('loans')
        .insert({
          loan_number: loanNumber,
          user_id: customerId,
          amount: amount,
          interest_rate: interestRate,
          term_months: termMonths,
          purpose: purpose || null,
          status: 'pending'
        });
        
      if (loanError) throw loanError;
      
      // Get the inserted loan
      const { data: loanData, error: fetchError } = await supabase
        .from('loans')
        .select('id')
        .eq('loan_number', loanNumber)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Insert guarantors
      if (guarantors.length > 0) {
        const validGuarantors = guarantors.filter(g => 
          g.full_name.trim() !== "" && 
          g.phone_number.trim() !== "" && 
          g.id_number.trim() !== ""
        );
        
        if (validGuarantors.length > 0) {
          const guarantorsForInsert = validGuarantors.map(g => ({
            loan_id: loanData.id,
            full_name: g.full_name,
            phone_number: g.phone_number,
            relationship: g.relationship,
            id_type: g.id_type,
            id_number: g.id_number
          }));
          
          const { error: guarantorError } = await supabase
            .from('loan_guarantors')
            .insert(guarantorsForInsert);
            
          if (guarantorError) throw guarantorError;
        }
      }
      
      toast({
        title: "Success",
        description: "Loan application created successfully",
      });
      
      onSave();
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to create loan application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyPayment = () => {
    if (amount <= 0 || interestRate <= 0 || termMonths <= 0) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    const payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    return payment;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Loan Application</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Select Customer</Label>
                    <Select 
                      value={customerId || ""} 
                      onValueChange={setCustomerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name} - {customer.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Loan Amount (₵)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount || ""}
                        onChange={(e) => setAmount(Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Interest Rate (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        placeholder="15.00"
                        value={interestRate || ""}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="termMonths">Term Length (months)</Label>
                      <Input
                        id="termMonths"
                        type="number"
                        placeholder="12"
                        value={termMonths || ""}
                        onChange={(e) => setTermMonths(Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estimated Monthly Payment</Label>
                      <div className="h-10 px-3 py-2 rounded-md border bg-gray-50 flex items-center">
                        ₵{calculateMonthlyPayment().toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Loan Purpose</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Purpose of the loan"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Guarantors</CardTitle>
              <Button size="sm" variant="outline" onClick={addGuarantor}>
                Add Guarantor
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {guarantors.map((guarantor, index) => (
                  <div key={guarantor.id} className="space-y-3 pb-4 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Guarantor {index + 1}</h4>
                      {guarantors.length > 1 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeGuarantor(guarantor.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          placeholder="Full name"
                          value={guarantor.full_name}
                          onChange={(e) => updateGuarantor(guarantor.id, "full_name", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="Phone number"
                          value={guarantor.phone_number}
                          onChange={(e) => updateGuarantor(guarantor.id, "phone_number", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Relationship to Borrower</Label>
                      <Input
                        placeholder="e.g. Parent, Sibling, Spouse"
                        value={guarantor.relationship}
                        onChange={(e) => updateGuarantor(guarantor.id, "relationship", e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>ID Type</Label>
                        <Select 
                          value={guarantor.id_type || "ghana_card"}
                          onValueChange={(value) => handleGuarantorIdTypeChange(value, index)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ghana_card">Ghana Card</SelectItem>
                            <SelectItem value="voter_id">Voter ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ID Number</Label>
                        <Input
                          placeholder="ID number"
                          value={guarantor.id_number}
                          onChange={(e) => updateGuarantor(guarantor.id, "id_number", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add default export to fix import issues
export default LoanApplicationModal;
export type { LoanApplicationModalProps };
