
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CreditCard, PlusCircle, ArrowUpCircle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthGuard from "@/components/auth/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import LoanApplicationModal from "@/components/loans/LoanApplicationModal";
import LoanRepaymentModal from "@/components/loans/LoanRepaymentModal";
import LoanDetailsModal from "@/components/loans/LoanDetailsModal";

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
  status: string;
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
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching loans:", error);
        toast({
          title: "Failed to fetch loans",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setLoans(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanModalClose = () => {
    setSelectedLoan(null);
    setIsLoanModalOpen(false);
  };

  const handleRepaymentModalClose = () => {
    setSelectedLoan(null);
    setIsRepaymentModalOpen(false);
  };

  const handleDetailsModalClose = () => {
    setSelectedLoan(null);
    setIsDetailsModalOpen(false);
  };

  const handleLoanSaved = () => {
    fetchLoans();
    setIsLoanModalOpen(false);
    setSelectedLoan(null);
  };

  const handleRepaymentSaved = () => {
    fetchLoans();
    setIsRepaymentModalOpen(false);
  };

  const handleRepayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsRepaymentModalOpen(true);
  };

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDetailsModalOpen(true);
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
  
  const filteredLoans = loans.filter((loan) => {
    // Apply search filter
    const searchMatches = !searchQuery || 
      (loan.loan_number.includes(searchQuery) || 
      (loan.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (loan.profiles?.phone_number.includes(searchQuery)));
      
    // Apply status filter
    const statusMatches = !statusFilter || loan.status === statusFilter;
    
    return searchMatches && statusMatches;
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Loans Management</h1>
        <p className="text-gray-600">Manage customer loans and applications</p>
      </div>

      <Card className="mb-6">
        <div className="p-4 flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 md:items-center w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search loans..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="fully_paid">Fully Paid</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setSelectedLoan(null);
              setIsLoanModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            New Loan Application
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount (₵)</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Payment</TableHead>
                <TableHead>Balance (₵)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.loan_number}</TableCell>
                    <TableCell>
                      {loan.profiles?.full_name || "Unknown"}
                      <div className="text-xs text-gray-500">
                        {loan.profiles?.phone_number}
                      </div>
                    </TableCell>
                    <TableCell>{loan.amount.toLocaleString()}</TableCell>
                    <TableCell>{loan.term_months} months</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>
                      {loan.next_payment_date 
                        ? format(new Date(loan.next_payment_date), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {loan.remaining_balance !== null ? loan.remaining_balance.toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(loan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {["active", "disbursed"].includes(loan.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleRepayment(loan)}
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {loan.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsLoanModalOpen(true);
                            }}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {searchQuery || statusFilter
                      ? "No loans matching your search criteria"
                      : "No loans found. Create your first loan application!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <LoanApplicationModal
        isOpen={isLoanModalOpen}
        onClose={handleLoanModalClose}
        onSave={handleLoanSaved}
        loan={selectedLoan}
      />

      {selectedLoan && (
        <LoanRepaymentModal
          isOpen={isRepaymentModalOpen}
          onClose={handleRepaymentModalClose}
          onSave={handleRepaymentSaved}
          loan={selectedLoan}
        />
      )}

      {selectedLoan && (
        <LoanDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleDetailsModalClose}
          loan={selectedLoan}
        />
      )}
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
