
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye, ArrowDown } from "lucide-react";
import LoanApplicationModal from "@/components/loans/LoanApplicationModal";
import LoanDetailsModal from "@/components/loans/LoanDetailsModal";
import LoanRepaymentModal from "@/components/loans/LoanRepaymentModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { LoanStatus } from "@/types/app";
import { format } from "date-fns";

interface LoanProfile {
  full_name: string;
  phone_number: string;
}

// Update Loan type to use LoanStatus
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

const LoansPage = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const { toast } = useToast();

  // Fetch loans on component mount
  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*, profiles(full_name, phone_number)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoans(data as unknown as Loan[]);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast({
        title: "Error",
        description: "Failed to load loans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplicationModal = () => {
    setIsApplicationModalOpen(true);
  };

  const handleOpenDetailsModal = (loan: Loan) => {
    // Later in the component where the type error occurs, cast the status to LoanStatus
    setSelectedLoan({
      ...loan,
      status: loan.status as LoanStatus
    });
    setIsDetailsModalOpen(true);
  };

  const handleOpenRepaymentModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsRepaymentModalOpen(true);
  };

  const handleApplicationCreated = () => {
    setIsApplicationModalOpen(false);
    fetchLoans();
    toast({
      title: "Success",
      description: "Loan application submitted successfully",
    });
  };

  const handleLoanUpdated = () => {
    setIsDetailsModalOpen(false);
    fetchLoans();
  };

  const handleRepaymentComplete = () => {
    setIsRepaymentModalOpen(false);
    fetchLoans();
  };

  // Filter loans based on search query
  const filteredLoans = loans.filter(loan => 
    loan.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.profiles?.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.loan_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get badge color based on loan status
  const getStatusBadgeVariant = (status: LoanStatus) => {
    switch(status) {
      case "pending": return "secondary";
      case "approved": return "outline"; // Changed from warning to outline
      case "disbursed": return "outline"; // Changed from warning to outline
      case "active": return "default";
      case "fully_paid": return "outline";
      case "defaulted": return "destructive";
      default: return "default";
    }
  };

  // Format loan status for display
  const formatLoanStatus = (status: string) => {
    return status.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Loans</h1>
          <p className="text-gray-600">Manage loan applications and repayments</p>
        </div>
        <Button 
          onClick={handleOpenApplicationModal} 
          className="flex items-center gap-2"
        >
          <Plus size={18} /> New Application
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-2" size={20} />
            <Input
              placeholder="Search by customer name, phone or loan number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-700 bg-gray-50">
              <tr>
                <th className="px-4 py-3">Loan Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Term</th>
                <th className="px-4 py-3">Next Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center">Loading loans...</td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center">No loans found</td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{loan.loan_number}</td>
                    <td className="px-4 py-3">
                      <div>{loan.profiles?.full_name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{loan.profiles?.phone_number || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">₵{loan.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {loan.remaining_balance !== null 
                        ? `₵${loan.remaining_balance.toFixed(2)}` 
                        : "N/A"
                      }
                    </td>
                    <td className="px-4 py-3">{loan.term_months} months</td>
                    <td className="px-4 py-3">
                      {loan.next_payment_date 
                        ? format(new Date(loan.next_payment_date), "MMM d, yyyy") 
                        : "N/A"
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(loan.status as LoanStatus)}>
                        {formatLoanStatus(loan.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDetailsModal(loan)}
                        >
                          <Eye size={16} className="mr-1" />
                          Details
                        </Button>
                        {(loan.status === "active" || loan.status === "disbursed") && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenRepaymentModal(loan)}
                            className="text-green-600"
                          >
                            <ArrowDown size={16} className="mr-1" />
                            Payment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Loan Application Modal */}
      <LoanApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onSave={handleApplicationCreated}
      />
      
      {/* Loan Details Modal */}
      <LoanDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        loan={selectedLoan}
        onUpdate={handleLoanUpdated}
      />
      
      {/* Loan Repayment Modal */}
      <LoanRepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        onSave={handleRepaymentComplete}
        loan={selectedLoan}
      />
    </AppLayout>
  );
};

const Loans = () => {
  return (
    <AuthGuard>
      <LoansPage />
    </AuthGuard>
  );
};

export default Loans;
