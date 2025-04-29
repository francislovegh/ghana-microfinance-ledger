
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarClock, Check, X, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LoanStatus } from "@/types/app";

interface LoanProfile {
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
  disbursed_at: string | null;
  next_payment_date: string | null;
  total_paid: number | null;
  remaining_balance: number | null;
  created_at: string | null;
  profiles: LoanProfile | null;
}

interface LoanSchedule {
  id: string;
  loan_id: string;
  payment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  paid_amount: number | null;
  is_paid: boolean;
  payment_date: string | null;
  penalty_amount: number | null;
  created_at: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

const LoanScheduleModal = ({ isOpen, onClose, loan }: Props) => {
  const [schedules, setSchedules] = useState<LoanSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (loan && isOpen) {
      fetchLoanSchedules(loan.id);
    }
  }, [loan, isOpen]);
  
  const fetchLoanSchedules = async (loanId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("loan_schedules")
        .select("*")
        .eq("loan_id", loanId)
        .order("payment_number", { ascending: true });
        
      if (error) throw error;
      
      setSchedules(data as LoanSchedule[]);
    } catch (error) {
      console.error("Error fetching loan schedules:", error);
      toast({
        title: "Error",
        description: "Failed to load loan repayment schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (schedule: LoanSchedule) => {
    const isPastDue = new Date(schedule.due_date) < new Date() && !schedule.is_paid;
    
    if (schedule.is_paid) {
      return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
        <Check size={14} />
        Paid
      </Badge>;
    } else if (isPastDue) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle size={14} />
        Overdue
      </Badge>;
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <CalendarClock size={14} />
        Upcoming
      </Badge>;
    }
  };
  
  const generateSchedule = async () => {
    if (!loan) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase.rpc('generate_loan_schedule', {
        p_loan_id: loan.id
      });
      
      if (error) throw error;
      
      await fetchLoanSchedules(loan.id);
      
      toast({
        title: "Success",
        description: "Repayment schedule generated successfully",
      });
    } catch (error) {
      console.error("Error generating repayment schedule:", error);
      toast({
        title: "Error",
        description: "Failed to generate repayment schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!loan) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Repayment Schedule - {loan.loan_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{loan.profiles?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Principal Amount</p>
                <p className="font-medium">₵{loan.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Interest Rate</p>
                <p className="font-medium">{loan.interest_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Term</p>
                <p className="font-medium">{loan.term_months} months</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Disbursed Date</p>
                <p className="font-medium">
                  {loan.disbursed_at ? format(new Date(loan.disbursed_at), "MMM d, yyyy") : "Not disbursed yet"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{loan.status}</p>
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-500">No repayment schedule has been generated yet.</p>
              {["approved", "disbursed", "active"].includes(loan.status) && (
                <Button onClick={generateSchedule}>
                  Generate Repayment Schedule
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repayment Schedule</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Due Date</th>
                      <th className="px-4 py-2 text-right">Principal</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                      <th className="px-4 py-2 text-right">Total Due</th>
                      <th className="px-4 py-2 text-right">Paid</th>
                      <th className="px-4 py-2 text-right">Penalty</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className={`hover:bg-gray-50 ${schedule.is_paid ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-3">{schedule.payment_number}</td>
                        <td className="px-4 py-3">
                          {format(new Date(schedule.due_date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₵{schedule.principal_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₵{schedule.interest_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ₵{schedule.total_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {schedule.paid_amount !== null 
                            ? `₵${schedule.paid_amount.toFixed(2)}` 
                            : "-"
                          }
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          {schedule.penalty_amount && schedule.penalty_amount > 0
                            ? `₵${schedule.penalty_amount.toFixed(2)}`
                            : "-"
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(schedule)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
        
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanScheduleModal;
