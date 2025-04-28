import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

type LoanStatus = "pending" | "approved" | "disbursed" | "active" | "fully_paid" | "defaulted";
type IdType = "ghana_card" | "voter_id" | "passport";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
}

interface Loan {
  id: string;
  loan_number: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  purpose: string | null;
  status: LoanStatus;
}

interface LoanProduct {
  id: string;
  name: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  min_term: number;
  max_term: number;
  description: string;
}

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  loan: Loan | null;
}

interface BasicFormValues {
  user_id: string;
  amount: string;
  interest_rate: string;
  term_months: string;
  purpose: string;
  loan_product_id?: string;
}

interface CollateralFormValues {
  collateral_type: string;
  description: string;
  value: string;
  document_url?: FileList;
}

interface GuarantorFormValues {
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  id_type: IdType;
  id_number: string;
  relationship: string;
  document_url?: FileList;
}

const LoanApplicationModal = ({ isOpen, onClose, onSave, loan }: LoanApplicationModalProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { register: registerBasic, handleSubmit: handleSubmitBasic, setValue: setBasicValue, watch: watchBasic, reset: resetBasic, formState: { errors: errorsBasic } } = useForm<BasicFormValues>({
    defaultValues: {
      user_id: "",
      amount: "",
      interest_rate: "20",
      term_months: "12",
      purpose: ""
    }
  });
  
  const { register: registerCollateral, handleSubmit: handleSubmitCollateral, reset: resetCollateral, formState: { errors: errorsCollateral } } = useForm<CollateralFormValues>({
    defaultValues: {
      collateral_type: "real_estate",
      description: "",
      value: ""
    }
  });
  
  const { register: registerGuarantor, handleSubmit: handleSubmitGuarantor, setValue: setGuarantorValue, reset: resetGuarantor, formState: { errors: errorsGuarantor } } = useForm<GuarantorFormValues>({
    defaultValues: {
      full_name: "",
      phone_number: "",
      email: "",
      address: "",
      id_type: "ghana_card",
      id_number: "",
      relationship: ""
    }
  });
  
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchLoanProducts();
      
      if (loan) {
        setCurrentLoanId(loan.id);
        setBasicValue("user_id", loan.user_id);
        setBasicValue("amount", loan.amount.toString());
        setBasicValue("interest_rate", loan.interest_rate.toString());
        setBasicValue("term_months", loan.term_months.toString());
        setBasicValue("purpose", loan.purpose || "");
      } else {
        setCurrentLoanId(null);
        resetBasic({
          user_id: "",
          amount: "",
          interest_rate: "20",
          term_months: "12",
          purpose: ""
        });
      }
      
      resetCollateral({
        collateral_type: "real_estate",
        description: "",
        value: ""
      });
      
      resetGuarantor({
        full_name: "",
        phone_number: "",
        email: "",
        address: "",
        id_type: "ghana_card",
        id_number: "",
        relationship: ""
      });
      
      setActiveTab("basic");
    }
  }, [isOpen, loan, setBasicValue, resetBasic, resetCollateral, resetGuarantor]);
  
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
      } else {
        setCustomers(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };
  
  const fetchLoanProducts = async () => {
    try {
      setLoanProducts([
        {
          id: "1",
          name: "Business Loan",
          interest_rate: 20,
          min_amount: 1000,
          max_amount: 50000,
          min_term: 3,
          max_term: 24,
          description: "Short-term financing for business expansion"
        },
        {
          id: "2",
          name: "Agriculture Loan",
          interest_rate: 15,
          min_amount: 500,
          max_amount: 20000,
          min_term: 6,
          max_term: 36,
          description: "Financing for farming activities"
        },
        {
          id: "3",
          name: "Education Loan",
          interest_rate: 10,
          min_amount: 1000,
          max_amount: 15000,
          min_term: 12,
          max_term: 48,
          description: "Support for educational expenses"
        }
      ]);
    } catch (error) {
      console.error("Error fetching loan products:", error);
    }
  };
  
  const onSubmitBasic = async (data: BasicFormValues) => {
    try {
      setLoading(true);
      
      const loanData = {
        user_id: data.user_id,
        amount: parseFloat(data.amount),
        interest_rate: parseFloat(data.interest_rate),
        term_months: parseInt(data.term_months),
        purpose: data.purpose || null,
        status: loan?.status || "pending" as LoanStatus
      };
      
      let loanId = currentLoanId;
      let error;
      
      if (loanId) {
        const { error: updateError } = await supabase
          .from("loans")
          .update(loanData)
          .eq("id", loanId);
          
        error = updateError;
      } else {
        const { data: newLoan, error: insertError } = await supabase
          .from("loans")
          .insert({
            ...loanData,
            loan_number: await generateLoanNumber()
          })
          .select()
          .single();
          
        error = insertError;
        if (!error && newLoan) {
          loanId = newLoan.id;
          setCurrentLoanId(loanId);
        }
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
          description: loanId === currentLoanId
            ? "Loan application updated successfully"
            : "Loan application created successfully",
        });
        
        if (loanId !== currentLoanId) {
          setActiveTab("collateral");
        } else if (activeTab === "basic") {
          onSave();
        }
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
  
  const generateLoanNumber = async (): Promise<string> => {
    return "20" + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  };
  
  const onSubmitCollateral = async (data: CollateralFormValues) => {
    if (!currentLoanId) {
      toast({
        title: "Error",
        description: "Please save basic loan details first",
        variant: "destructive",
      });
      setActiveTab("basic");
      return;
    }
    
    try {
      setLoading(true);
      
      let documentUrl = null;
      
      if (data.document_url && data.document_url.length > 0) {
        const file = data.document_url[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `loan_collaterals/${currentLoanId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
          
        if (uploadError) {
          toast({
            title: "Error uploading file",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }
        
        if (uploadData) {
          documentUrl = filePath;
        }
      }
      
      const collateralData = {
        loan_id: currentLoanId,
        collateral_type: data.collateral_type,
        description: data.description,
        value: parseFloat(data.value),
        document_url: documentUrl
      };
      
      const { error } = await supabase
        .from("loan_collaterals")
        .insert(collateralData);
        
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Collateral information saved",
        });
        
        resetCollateral({
          collateral_type: "real_estate",
          description: "",
          value: ""
        });
        
        setActiveTab("guarantor");
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
  
  const onSubmitGuarantor = async (data: GuarantorFormValues) => {
    if (!currentLoanId) {
      toast({
        title: "Error",
        description: "Please save basic loan details first",
        variant: "destructive",
      });
      setActiveTab("basic");
      return;
    }
    
    try {
      setLoading(true);
      
      let documentUrl = null;
      
      if (data.document_url && data.document_url.length > 0) {
        const file = data.document_url[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `loan_guarantors/${currentLoanId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
          
        if (uploadError) {
          toast({
            title: "Error uploading file",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }
        
        if (uploadData) {
          documentUrl = filePath;
        }
      }
      
      const guarantorData = {
        loan_id: currentLoanId,
        full_name: data.full_name,
        phone_number: data.phone_number,
        email: data.email || null,
        address: data.address,
        id_type: data.id_type,
        id_number: data.id_number,
        relationship: data.relationship,
        document_url: documentUrl
      };
      
      const { error } = await supabase
        .from("loan_guarantors")
        .insert(guarantorData);
        
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Guarantor information saved",
        });
        
        resetGuarantor({
          full_name: "",
          phone_number: "",
          email: "",
          address: "",
          id_type: "ghana_card",
          id_number: "",
          relationship: ""
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
  
  const handleSelectLoanProduct = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    if (product) {
      setBasicValue("interest_rate", product.interest_rate.toString());
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loan ? `Edit Loan: ${loan.loan_number}` : "New Loan Application"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="collateral" disabled={!currentLoanId}>Collateral</TabsTrigger>
            <TabsTrigger value="guarantor" disabled={!currentLoanId}>Guarantor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <form onSubmit={handleSubmitBasic(onSubmitBasic)} className="space-y-4">
              {!loan && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-medium">Loan Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loanProducts.map((product) => (
                      <Card 
                        key={product.id}
                        className="cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => handleSelectLoanProduct(product.id)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                          <div className="mt-2 text-sm">
                            <div>Interest Rate: {product.interest_rate}%</div>
                            <div>Amount: ₵{product.min_amount} - ₵{product.max_amount}</div>
                            <div>Term: {product.min_term} - {product.max_term} months</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">Customer *</Label>
                  <Select
                    value={watchBasic("user_id")}
                    onValueChange={(value) => setBasicValue("user_id", value)}
                    disabled={loan !== null || loadingCustomers}
                  >
                    <SelectTrigger className={errorsBasic.user_id ? "border-red-500" : ""}>
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
                  {errorsBasic.user_id && (
                    <p className="text-red-500 text-xs">A customer is required</p>
                  )}
                  {loan && (
                    <p className="text-xs text-gray-500">Customer cannot be changed after loan creation</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Loan Amount (₵) *</Label>
                    <Input
                      id="amount"
                      {...registerBasic("amount", { 
                        required: "Amount is required", 
                        pattern: { 
                          value: /^\d*\.?\d*$/, 
                          message: "Must be a valid number" 
                        },
                        validate: {
                          positive: (value) => parseFloat(value) > 0 || "Amount must be greater than 0"
                        }
                      })}
                      placeholder="Enter loan amount"
                      className={errorsBasic.amount ? "border-red-500" : ""}
                    />
                    {errorsBasic.amount && (
                      <p className="text-red-500 text-xs">{errorsBasic.amount.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                    <Input
                      id="interest_rate"
                      {...registerBasic("interest_rate", { 
                        required: "Interest rate is required", 
                        pattern: { 
                          value: /^\d*\.?\d*$/, 
                          message: "Must be a valid number" 
                        }
                      })}
                      placeholder="e.g., 20"
                      className={errorsBasic.interest_rate ? "border-red-500" : ""}
                    />
                    {errorsBasic.interest_rate && (
                      <p className="text-red-500 text-xs">{errorsBasic.interest_rate.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="term_months">Loan Term (months) *</Label>
                  <Input
                    id="term_months"
                    {...registerBasic("term_months", { 
                      required: "Term is required", 
                      pattern: { 
                        value: /^\d+$/, 
                        message: "Must be a whole number" 
                      },
                      validate: {
                        positive: (value) => parseInt(value) > 0 || "Term must be greater than 0"
                      }
                    })}
                    placeholder="e.g., 12"
                    className={errorsBasic.term_months ? "border-red-500" : ""}
                  />
                  {errorsBasic.term_months && (
                    <p className="text-red-500 text-xs">{errorsBasic.term_months.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Loan Purpose</Label>
                  <Textarea
                    id="purpose"
                    {...registerBasic("purpose")}
                    placeholder="Enter the purpose of the loan"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? <LoadingSpinner /> : currentLoanId ? "Update" : "Next"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="collateral">
            <form onSubmit={handleSubmitCollateral(onSubmitCollateral)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="collateral_type">Collateral Type *</Label>
                  <Select
                    defaultValue="real_estate"
                    onValueChange={(value) => registerCollateral("collateral_type").onChange({
                      target: { name: "collateral_type", value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collateral type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="inventory">Inventory/Stock</SelectItem>
                      <SelectItem value="financial_asset">Financial Asset</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...registerCollateral("description", { required: "Description is required" })}
                    placeholder="Describe the collateral in detail"
                    rows={3}
                    className={errorsCollateral.description ? "border-red-500" : ""}
                  />
                  {errorsCollateral.description && (
                    <p className="text-red-500 text-xs">{errorsCollateral.description.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">Estimated Value (₵) *</Label>
                  <Input
                    id="value"
                    {...registerCollateral("value", { 
                      required: "Value is required", 
                      pattern: { 
                        value: /^\d*\.?\d*$/, 
                        message: "Must be a valid number" 
                      },
                      validate: {
                        positive: (value) => parseFloat(value) > 0 || "Value must be greater than 0"
                      }
                    })}
                    placeholder="Enter the estimated value"
                    className={errorsCollateral.value ? "border-red-500" : ""}
                  />
                  {errorsCollateral.value && (
                    <p className="text-red-500 text-xs">{errorsCollateral.value.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document_url">Upload Document</Label>
                  <Input
                    id="document_url"
                    type="file"
                    {...registerCollateral("document_url")}
                  />
                  <p className="text-xs text-gray-500">
                    Upload proof of ownership or other relevant documents (optional)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? <LoadingSpinner /> : "Next"}
                </Button>
                <Button type="button" onClick={onSave} variant="ghost">
                  Skip
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="guarantor">
            <form onSubmit={handleSubmitGuarantor(onSubmitGuarantor)} className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      {...registerGuarantor("full_name", { required: "Full name is required" })}
                      placeholder="Enter guarantor's full name"
                      className={errorsGuarantor.full_name ? "border-red-500" : ""}
                    />
                    {errorsGuarantor.full_name && (
                      <p className="text-red-500 text-xs">{errorsGuarantor.full_name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      {...registerGuarantor("phone_number", { required: "Phone number is required" })}
                      placeholder="Enter phone number"
                      className={errorsGuarantor.phone_number ? "border-red-500" : ""}
                    />
                    {errorsGuarantor.phone_number && (
                      <p className="text-red-500 text-xs">{errorsGuarantor.phone_number.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerGuarantor("email")}
                    placeholder="Enter email (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    {...registerGuarantor("address", { required: "Address is required" })}
                    placeholder="Enter guarantor's address"
                    rows={2}
                    className={errorsGuarantor.address ? "border-red-500" : ""}
                  />
                  {errorsGuarantor.address && (
                    <p className="text-red-500 text-xs">{errorsGuarantor.address.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id_type">ID Type *</Label>
                    <Select 
                      defaultValue="ghana_card"
                      onValueChange={(value) => setGuarantorValue("id_type", value)}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="id_number">ID Number *</Label>
                    <Input
                      id="id_number"
                      {...registerGuarantor("id_number", { required: "ID number is required" })}
                      placeholder="Enter ID number"
                      className={errorsGuarantor.id_number ? "border-red-500" : ""}
                    />
                    {errorsGuarantor.id_number && (
                      <p className="text-red-500 text-xs">{errorsGuarantor.id_number.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship to Borrower *</Label>
                  <Input
                    id="relationship"
                    {...registerGuarantor("relationship", { required: "Relationship is required" })}
                    placeholder="E.g., Family member, Friend, Colleague"
                    className={errorsGuarantor.relationship ? "border-red-500" : ""}
                  />
                  {errorsGuarantor.relationship && (
                    <p className="text-red-500 text-xs">{errorsGuarantor.relationship.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guarantor_document">Upload ID Document</Label>
                  <Input
                    id="guarantor_document"
                    type="file"
                    {...registerGuarantor("document_url")}
                  />
                  <p className="text-xs text-gray-500">
                    Upload a copy of the guarantor's ID (optional)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("collateral")}>
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? <LoadingSpinner /> : "Save"}
                </Button>
                <Button type="button" onClick={onSave} variant="ghost">
                  Skip
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoanApplicationModal;
