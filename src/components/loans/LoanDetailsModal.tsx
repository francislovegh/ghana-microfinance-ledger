
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface LoanProfile {
  full_name: string;
}

interface PerformedByProfile {
  full_name: string;
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
  disbursed_at: string | null;
  next_payment_date: string | null;
  total_paid: number | null;
  remaining_balance: number | null;
  created_at: string | null;
  profiles: LoanProfile | null;
}

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

interface LoanTransaction {
  id: string;
  transaction_number: string;
  amount: number;
  transaction_type: TransactionType;
  payment_method: PaymentMethod;
  reference_number: string | null;
  created_at: string;
  performed_by_profile: PerformedByProfile | null;
}

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

const LoanDetailsModal = ({ isOpen, onClose, loan }: LoanDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [schedules, setSchedules] = useState<LoanSchedule[]>([]);
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (loan && isOpen) {
      fetchLoanSchedules();
      fetchLoanTransactions();
    }
  }, [loan, isOpen]);
  
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
        toast({
          title: "Failed to fetch loan schedules",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSchedules(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoadingSchedules(false);
    }
  };
  
  const fetchLoanTransactions = async () => {
    if (!loan) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          performed_by_profile:performed_by (
            full_name
          )
        `)
        .eq("loan_id", loan.id)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching loan transactions:", error);
        toast({
          title: "Failed to fetch loan transactions",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        // Handle potential errors in the relationship and transform into our expected type
        const safeTransactions: LoanTransaction[] = data.map(transaction => {
          return {
            id: transaction.id,
            transaction_number: transaction.transaction_number,
            amount: transaction.amount,
            transaction_type: transaction.transaction_type as TransactionType,
            payment_method: transaction.payment_method as PaymentMethod,
            reference_number: transaction.reference_number,
            created_at: transaction.created_at || new Date().toISOString(),
            performed_by_profile: transaction.performed_by_profile && 
              typeof transaction.performed_by_profile === 'object' && 
              !('error' in transaction.performed_by_profile)
              ? transaction.performed_by_profile as PerformedByProfile
              : null
          };
        });
        
        setTransactions(safeTransactions);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Loan Details - {loan?.loan_number}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Loan Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Customer:</span>
                </div>
                <div>{loan?.profiles?.full_name || "Unknown"}</div>
                <div>
                  <span className="text-gray-500">Loan Amount:</span>
                </div>
                <div>₵ {loan?.amount.toLocaleString()}</div>
                <div>
                  <span className="text-gray-500">Interest Rate:</span>
                </div>
                <div>{loan?.interest_rate}%</div>
                <div>
                  <span className="text-gray-500">Term:</span>
                </div>
                <div>{loan?.term_months} months</div>
                <div>
                  <span className="text-gray-500">Status:</span>
                </div>
                <div>
                  <Badge>{loan?.status}</Badge>
                </div>
                <div>
                  <span className="text-gray-500">Remaining Balance:</span>
                </div>
                <div>₵ {loan?.remaining_balance?.toLocaleString() || "N/A"}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Loan Dates</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Created At:</span>
                </div>
                <div>
                  {loan?.created_at
                    ? format(new Date(loan.created_at), "MMM d, yyyy")
                    : "N/A"}
                </div>
                <div>
                  <span className="text-gray-500">Disbursed At:</span>
                </div>
                <div>
                  {loan?.disbursed_at
                    ? format(new Date(loan.disbursed_at), "MMM d, yyyy")
                    : "N/A"}
                </div>
                <div>
                  <span className="text-gray-500">Next Payment:</span>
                </div>
                <div>
                  {loan?.next_payment_date
                    ? format(new Date(loan.next_payment_date), "MMM d, yyyy")
                    : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="border-b">
          <nav className="-mb-0.5 flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`pb-4 px-1 text-sm font-medium text-gray-500 whitespace-nowrap border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 ${activeTab === "schedule" ? "text-blue-600 border-blue-600" : ""
                }`}
            >
              Payment Schedule
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-4 px-1 text-sm font-medium text-gray-500 whitespace-nowrap border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 ${activeTab === "transactions" ? "text-blue-600 border-blue-600" : ""
                }`}
            >
              Transactions
            </button>
          </nav>
        </div>
        
        <div className="mt-4">
          {activeTab === "schedule" && (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSchedules ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : schedules.length > 0 ? (
                      schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{schedule.payment_number}</TableCell>
                          <TableCell>
                            {format(new Date(schedule.due_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{schedule.principal_amount}</TableCell>
                          <TableCell>{schedule.interest_amount}</TableCell>
                          <TableCell>{schedule.total_amount}</TableCell>
                          <TableCell>{schedule.paid_amount || 0}</TableCell>
                          <TableCell>
                            {schedule.payment_date
                              ? format(new Date(schedule.payment_date), "MMM d, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {schedule.is_paid ? (
                              <Badge className="bg-green-500">Paid</Badge>
                            ) : (
                              <Badge className="bg-yellow-500">Unpaid</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No payment schedules found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
          
          {activeTab === "transactions" && (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Processed By</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.transaction_number}</TableCell>
                          <TableCell>
                            {format(new Date(transaction.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{transaction.transaction_type}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.performed_by_profile?.full_name || "N/A"}</TableCell>
                          <TableCell>{transaction.payment_method}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No transactions found for this loan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailsModal;
