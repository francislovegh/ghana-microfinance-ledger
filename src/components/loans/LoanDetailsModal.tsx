
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onUpdate: () => void;
}

const LoanDetailsModal = ({ isOpen, onClose, loan, onUpdate }: Props) => {
  const [status, setStatus] = useState<LoanStatus>(loan?.status || "pending");
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (loan) {
      setStatus(loan.status);
      fetchTransactions(loan.id);
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
  
  const handleStatusChange = async (newStatus: LoanStatus) => {
    if (!loan) return;
    
    try {
      const { error } = await supabase
        .from("loans")
        .update({ status: newStatus })
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
        
        <Card className="mb-4">
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
              <div className="flex items-center space-x-2">
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
        
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTransactions()}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailsModal;
