
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LoanProfile, LoanStatus, LoanTransaction } from "@/types/app";
import { CalendarClock, DollarSign } from "lucide-react";

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

interface Collateral {
  id: string;
  collateral_type: string;
  description: string;
  value: number;
  document_url: string | null;
}

interface ScheduleSummary {
  total_payments: number;
  total_principal: number;
  total_interest: number;
  total_paid: number;
  total_pending: number;
  next_payment_date: string | null;
  next_payment_amount: number | null;
  overdue_payments: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onUpdate: () => void;
}

const LoanDetailsModal = ({ isOpen, onClose, loan, onUpdate }: Props) => {
  const [status, setStatus] = useState<LoanStatus>(loan?.status || "pending");
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [collaterals, setCollaterals] = useState<Collateral[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingCollaterals, setLoadingCollaterals] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (loan) {
      setStatus(loan.status);
      fetchTransactions(loan.id);
      fetchCollaterals(loan.id);
      fetchScheduleSummary(loan.id);
    }
  }, [loan]);
  
  const fetchTransactions = async (loanId: string) => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, performed_by_profile:profiles(full_name, phone_number)")
        .eq("loan_id", loanId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setTransactions(data ? data as unknown as LoanTransaction[] : []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  const fetchCollaterals = async (loanId: string) => {
    setLoadingCollaterals(true);
    try {
      const { data, error } = await supabase
        .from("loan_collaterals")
        .select("*")
        .eq("loan_id", loanId);
        
      if (error) throw error;
      setCollaterals(data || []);
    } catch (error) {
      console.error("Error fetching collaterals:", error);
    } finally {
      setLoadingCollaterals(false);
    }
  };
  
  const fetchScheduleSummary = async (loanId: string) => {
    setLoadingSchedule(true);
    try {
      const { data, error } = await supabase
        .from("loan_schedules")
        .select("*")
        .eq("loan_id", loanId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const now = new Date();
        const totalPrincipal = data.reduce((sum, item) => sum + Number(item.principal_amount), 0);
        const totalInterest = data.reduce((sum, item) => sum + Number(item.interest_amount), 0);
        const totalPaid = data.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
        const totalPending = data.reduce((sum, item) => 
          item.is_paid ? sum : sum + Number(item.total_amount) - Number(item.paid_amount || 0), 0);
        
        const overduePayments = data.filter(item => 
          !item.is_paid && new Date(item.due_date) < now
        ).length;
        
        const nextPayment = data
          .filter(item => !item.is_paid)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
        
        setScheduleSummary({
          total_payments: data.length,
          total_principal: totalPrincipal,
          total_interest: totalInterest,
          total_paid: totalPaid,
          total_pending: totalPending,
          next_payment_date: nextPayment?.due_date || null,
          next_payment_amount: nextPayment?.total_amount || null,
          overdue_payments: overduePayments
        });
      } else {
        setScheduleSummary(null);
      }
    } catch (error) {
      console.error("Error fetching schedule summary:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };
  
  const handleStatusChange = async (newStatus: LoanStatus) => {
    if (!loan) return;
    
    try {
      // If changing to disbursed, set the disbursed_at date
      let updateData: any = { status: newStatus };
      
      if (newStatus === "disbursed" && loan.status !== "disbursed") {
        updateData.disbursed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from("loans")
        .update(updateData)
        .eq("id", loan.id);
        
      if (error) throw error;
      
      setStatus(newStatus);
      onUpdate();
      toast({
        title: "Success",
        description: "Loan status updated successfully",
      });
    } catch (error) {
      console.error("Error updating loan status:", error);
      toast({
        title: "Error",
        description: "Failed to update loan status",
        variant: "destructive",
      });
    }
  };

  // Fix for the performed_by_profile null check
  const renderTransactions = () => {
    if (loadingTransactions) {
      return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
    }
      
    if (transactions.length === 0) {
      return <p className="text-center py-4 text-gray-500">No transactions found</p>;
    }
      
    return (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{transaction.transaction_type.replace("_", " ")}</p>
                  <p className="text-sm text-gray-500">{transaction.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₵{transaction.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(transaction.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Ref: {transaction.reference_number}</span>
                <span>By: {transaction.performed_by_profile?.full_name || "System"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCollaterals = () => {
    if (loadingCollaterals) {
      return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
    }
      
    if (collaterals.length === 0) {
      return <p className="text-center py-4 text-gray-500">No collaterals registered for this loan</p>;
    }
      
    return (
      <div className="space-y-4">
        {collaterals.map((collateral) => (
          <div key={collateral.id} className="border rounded-md p-4">
            <div className="flex justify-between mb-2">
              <div>
                <Badge variant="outline">
                  {collateral.collateral_type.replace('_', ' ')}
                </Badge>
              </div>
              <div className="font-medium">₵{collateral.value.toFixed(2)}</div>
            </div>
            <p className="text-sm">{collateral.description}</p>
          </div>
        ))}
      </div>
    );
  };
  
  const renderScheduleSummary = () => {
    if (loadingSchedule) {
      return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
    }
    
    if (!scheduleSummary) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No repayment schedule has been generated yet.</p>
          <p className="text-sm text-gray-400">Schedule will be generated when the loan is disbursed.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Total Payments</p>
            <p className="font-medium">{scheduleSummary.total_payments}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Principal</p>
            <p className="font-medium">₵{scheduleSummary.total_principal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Interest</p>
            <p className="font-medium">₵{scheduleSummary.total_interest.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Amount Paid</p>
            <p className="font-medium">₵{scheduleSummary.total_paid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Amount Pending</p>
            <p className="font-medium">₵{scheduleSummary.total_pending.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Overdue Payments</p>
            <p className={`font-medium ${scheduleSummary.overdue_payments > 0 ? "text-red-600" : ""}`}>
              {scheduleSummary.overdue_payments}
            </p>
          </div>
        </div>
        
        {scheduleSummary.next_payment_date && (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-center gap-3">
            <CalendarClock className="text-blue-500" size={24} />
            <div>
              <p className="font-medium">Next Payment Due</p>
              <p className="text-sm">{format(new Date(scheduleSummary.next_payment_date), "MMMM d, yyyy")}</p>
            </div>
            <div className="ml-auto">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">₵{scheduleSummary.next_payment_amount?.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (!loan) return null;
  
  const getStatusBadgeVariant = (status: LoanStatus) => {
    switch(status) {
      case "pending": return "secondary";
      case "approved": return "outline"; // Changed from warning to outline
      case "disbursed": return "outline"; // Changed from warning to outline
      case "active": return "default"; // Changed from success to default
      case "fully_paid": return "outline";
      case "defaulted": return "destructive";
      default: return "default";
    }
  };
  
  const formatLoanStatus = (status: string) => {
    return status.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loan Details - {loan.loan_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Customer Name</p>
                  <p className="font-medium">{loan.profiles?.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone Number</p>
                  <p className="font-medium">{loan.profiles?.phone_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Loan Amount</p>
                  <p className="font-medium">₵{loan.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Interest Rate</p>
                  <p className="font-medium">{loan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Term</p>
                  <p className="font-medium">{loan.term_months} months</p>
                </div>
                <div>
                  <p className="text-gray-500">Purpose</p>
                  <p className="font-medium">{loan.purpose || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Disbursed At</p>
                  <p className="font-medium">
                    {loan.disbursed_at ? format(new Date(loan.disbursed_at), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Next Payment Date</p>
                  <p className="font-medium">
                    {loan.next_payment_date ? format(new Date(loan.next_payment_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Paid</p>
                  <p className="font-medium">₵{loan.total_paid?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining Balance</p>
                  <p className="font-medium">₵{loan.remaining_balance?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-gray-500">Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(status)}>
                    {formatLoanStatus(status)}
                  </Badge>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="disbursed">Disbursed</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="fully_paid">Fully Paid</SelectItem>
                      <SelectItem value="defaulted">Defaulted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Repayment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {renderScheduleSummary()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Collaterals</CardTitle>
              </CardHeader>
              <CardContent>
                {renderCollaterals()}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTransactions()}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailsModal;
