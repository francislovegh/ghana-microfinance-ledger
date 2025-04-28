
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { format } from "date-fns";

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
  penalty_amount: number | null;
}

interface LoanCollateral {
  id: string;
  collateral_type: string;
  description: string;
  value: number;
  document_url: string | null;
}

interface LoanGuarantor {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string;
  id_type: string;
  id_number: string;
  relationship: string;
  document_url: string | null;
}

interface LoanTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  created_at: string;
  payment_method: string;
  performed_by_profile: {
    full_name: string;
  } | null;
}

interface Loan {
  id: string;
  loan_number: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  purpose: string | null;
  status: string;
  disbursed_at: string | null;
  next_payment_date: string | null;
  total_paid: number | null;
  remaining_balance: number | null;
  created_at: string | null;
  profiles?: {
    full_name: string;
    phone_number: string;
    email: string | null;
  } | null;
}

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
}

const LoanDetailsModal = ({ isOpen, onClose, loan }: LoanDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [schedules, setSchedules] = useState<LoanSchedule[]>([]);
  const [collaterals, setCollaterals] = useState<LoanCollateral[]>([]);
  const [guarantors, setGuarantors] = useState<LoanGuarantor[]>([]);
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen && loan) {
      fetchLoanDetails();
    }
  }, [isOpen, loan]);
  
  const fetchLoanDetails = async () => {
    if (!loan) return;
    
    setLoading(true);
    try {
      // Fetch loan schedules
      const { data: schedulesData } = await supabase
        .from("loan_schedules")
        .select("*")
        .eq("loan_id", loan.id)
        .order("payment_number", { ascending: true });
        
      if (schedulesData) {
        setSchedules(schedulesData);
      }
      
      // Fetch collaterals
      const { data: collateralsData } = await supabase
        .from("loan_collaterals")
        .select("*")
        .eq("loan_id", loan.id);
        
      if (collateralsData) {
        setCollaterals(collateralsData);
      }
      
      // Fetch guarantors
      const { data: guarantorsData } = await supabase
        .from("loan_guarantors")
        .select("*")
        .eq("loan_id", loan.id);
        
      if (guarantorsData) {
        setGuarantors(guarantorsData);
      }
      
      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select(`
          *,
          performed_by_profile:performed_by(full_name)
        `)
        .eq("loan_id", loan.id)
        .order("created_at", { ascending: false });
        
      if (transactionsData) {
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500">Approved</Badge>;
      case "disbursed":
        return <Badge className="bg-purple-500">Disbursed</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "fully_paid":
        return <Badge className="bg-gray-500">Fully Paid</Badge>;
      case "defaulted":
        return <Badge className="bg-red-500">Defaulted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getCollateralTypeName = (type: string) => {
    const types: Record<string, string> = {
      "real_estate": "Real Estate",
      "vehicle": "Vehicle",
      "equipment": "Equipment",
      "inventory": "Inventory/Stock",
      "financial_asset": "Financial Asset",
      "other": "Other"
    };
    
    return types[type] || type;
  };
  
  const getIdTypeName = (type: string) => {
    const types: Record<string, string> = {
      "ghana_card": "Ghana Card",
      "voter_id": "Voter ID",
      "passport": "Passport"
    };
    
    return types[type] || type;
  };
  
  const getTransactionTypeName = (type: string) => {
    const types: Record<string, string> = {
      "loan_disbursement": "Disbursement",
      "loan_repayment": "Repayment",
      "interest_payment": "Interest Payment",
      "penalty_payment": "Penalty Payment"
    };
    
    return types[type] || type;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Details: {loan.loan_number}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="schedules">Schedule</TabsTrigger>
            <TabsTrigger value="collateral">Collateral</TabsTrigger>
            <TabsTrigger value="guarantor">Guarantor</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Loan Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-gray-700 font-medium">Status:</div>
                    <div>{getStatusBadge(loan.status)}</div>
                    
                    <div className="text-gray-700 font-medium">Loan Amount:</div>
                    <div>₵ {loan.amount.toLocaleString()}</div>
                    
                    <div className="text-gray-700 font-medium">Interest Rate:</div>
                    <div>{loan.interest_rate}%</div>
                    
                    <div className="text-gray-700 font-medium">Term:</div>
                    <div>{loan.term_months} months</div>
                    
                    <div className="text-gray-700 font-medium">Total Paid:</div>
                    <div>₵ {loan.total_paid ? loan.total_paid.toLocaleString() : "0.00"}</div>
                    
                    <div className="text-gray-700 font-medium">Remaining Balance:</div>
                    <div>₵ {loan.remaining_balance ? loan.remaining_balance.toLocaleString() : loan.amount.toLocaleString()}</div>
                    
                    <div className="text-gray-700 font-medium">Disbursed Date:</div>
                    <div>{loan.disbursed_at ? format(new Date(loan.disbursed_at), "MMM d, yyyy") : "Not disbursed"}</div>
                    
                    <div className="text-gray-700 font-medium">Next Payment Date:</div>
                    <div>{loan.next_payment_date ? format(new Date(loan.next_payment_date), "MMM d, yyyy") : "N/A"}</div>
                    
                    <div className="text-gray-700 font-medium">Application Date:</div>
                    <div>{loan.created_at ? format(new Date(loan.created_at), "MMM d, yyyy") : "Unknown"}</div>
                    
                    {loan.purpose && (
                      <>
                        <div className="text-gray-700 font-medium">Purpose:</div>
                        <div>{loan.purpose}</div>
                      </>
                    )}
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-gray-700 font-medium">Name:</div>
                    <div>{loan.profiles?.full_name || "Unknown"}</div>
                    
                    <div className="text-gray-700 font-medium">Phone:</div>
                    <div>{loan.profiles?.phone_number || "N/A"}</div>
                    
                    <div className="text-gray-700 font-medium">Email:</div>
                    <div>{loan.profiles?.email || "N/A"}</div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Payment Schedule Tab */}
          <TabsContent value="schedules">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : schedules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.payment_number}</TableCell>
                      <TableCell>{format(new Date(schedule.due_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>₵ {schedule.principal_amount.toFixed(2)}</TableCell>
                      <TableCell>₵ {schedule.interest_amount.toFixed(2)}</TableCell>
                      <TableCell>₵ {schedule.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {schedule.is_paid ? (
                          <Badge className="bg-green-500">Paid</Badge>
                        ) : new Date(schedule.due_date) < new Date() ? (
                          <Badge className="bg-red-500">Overdue</Badge>
                        ) : (
                          <Badge className="bg-yellow-500">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p>No payment schedule found for this loan.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Collateral Tab */}
          <TabsContent value="collateral">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : collaterals.length > 0 ? (
              <div className="space-y-4">
                {collaterals.map((collateral) => (
                  <Card key={collateral.id} className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-gray-700 font-medium">Type:</div>
                      <div>{getCollateralTypeName(collateral.collateral_type)}</div>
                      
                      <div className="text-gray-700 font-medium">Value:</div>
                      <div>₵ {collateral.value.toLocaleString()}</div>
                      
                      <div className="text-gray-700 font-medium">Description:</div>
                      <div className="col-span-2 mt-2 bg-gray-50 p-3 rounded">
                        {collateral.description}
                      </div>
                      
                      {collateral.document_url && (
                        <>
                          <div className="text-gray-700 font-medium">Document:</div>
                          <div>
                            <Button variant="outline" className="text-blue-600" size="sm">
                              View Document
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No collateral information found for this loan.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Guarantor Tab */}
          <TabsContent value="guarantor">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : guarantors.length > 0 ? (
              <div className="space-y-4">
                {guarantors.map((guarantor) => (
                  <Card key={guarantor.id} className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-gray-700 font-medium">Name:</div>
                      <div>{guarantor.full_name}</div>
                      
                      <div className="text-gray-700 font-medium">Phone:</div>
                      <div>{guarantor.phone_number}</div>
                      
                      <div className="text-gray-700 font-medium">Email:</div>
                      <div>{guarantor.email || "N/A"}</div>
                      
                      <div className="text-gray-700 font-medium">Relationship:</div>
                      <div>{guarantor.relationship}</div>
                      
                      <div className="text-gray-700 font-medium">ID Type:</div>
                      <div>{getIdTypeName(guarantor.id_type)}</div>
                      
                      <div className="text-gray-700 font-medium">ID Number:</div>
                      <div>{guarantor.id_number}</div>
                      
                      <div className="text-gray-700 font-medium">Address:</div>
                      <div className="col-span-2 mt-2 bg-gray-50 p-3 rounded">
                        {guarantor.address}
                      </div>
                      
                      {guarantor.document_url && (
                        <>
                          <div className="text-gray-700 font-medium">Document:</div>
                          <div>
                            <Button variant="outline" className="text-blue-600" size="sm">
                              View Document
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No guarantor information found for this loan.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Processed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getTransactionTypeName(transaction.transaction_type)}</TableCell>
                      <TableCell>₵ {transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.payment_method.replace("_", " ")}</TableCell>
                      <TableCell>{transaction.performed_by_profile?.full_name || "Unknown"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p>No transactions found for this loan.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailsModal;
