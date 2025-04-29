
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { LoanStatus } from "@/types/app";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LoanData {
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalOutstanding: number;
  loansByStatus: {
    status: LoanStatus;
    count: number;
    amount: number;
    outstanding: number;
  }[];
  recentLoans: {
    id: string;
    loan_number: string;
    amount: number;
    remaining_balance: number;
    interest_rate: number;
    loan_status: LoanStatus;
    created_at: string;
    customer_name: string;
  }[];
}

interface LoanReportsProps {
  dateRange: DateRange;
}

const LoanReports = ({ dateRange }: LoanReportsProps) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['loanReports', dateRange],
    queryFn: async (): Promise<LoanData> => {
      // Get loan data - specify the column relationship with profiles(full_name)
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*, profiles:user_id(full_name)')
        .gte('created_at', dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '')
        .lte('created_at', dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '');
        
      if (loansError) throw loansError;
      
      const processedLoans = loans.map(loan => ({
        ...loan,
        customer_name: loan.profiles?.full_name || 'Unknown',
        loan_status: loan.status as LoanStatus
      }));
      
      // Calculate loan statistics
      const totalLoans = processedLoans.length;
      const activeLoans = processedLoans.filter(l => 
        ['approved', 'disbursed', 'active'].includes(l.status as string)
      ).length;
      const totalDisbursed = processedLoans.reduce((sum, loan) => sum + loan.amount, 0);
      const totalOutstanding = processedLoans.reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0);
      
      // Group loans by status
      const loansByStatus = Object.entries(
        processedLoans.reduce((acc: Record<string, any>, loan) => {
          const status = loan.status as LoanStatus;
          if (!acc[status]) {
            acc[status] = {
              status,
              count: 0,
              amount: 0,
              outstanding: 0,
            };
          }
          acc[status].count += 1;
          acc[status].amount += loan.amount;
          acc[status].outstanding += loan.remaining_balance || 0;
          return acc;
        }, {})
      ).map(([_, value]) => value);
      
      // Get recent loans
      const recentLoans = processedLoans
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(loan => ({
          id: loan.id,
          loan_number: loan.loan_number,
          amount: loan.amount,
          remaining_balance: loan.remaining_balance,
          interest_rate: loan.interest_rate,
          loan_status: loan.status as LoanStatus,
          created_at: loan.created_at,
          customer_name: loan.customer_name
        }));
      
      return {
        totalLoans,
        activeLoans,
        totalDisbursed,
        totalOutstanding,
        loansByStatus,
        recentLoans
      };
    }
  });
  
  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
  
  if (error) return <div className="text-red-500">Error loading loan reports</div>;
  
  if (!data) return <div>No data available</div>;
  
  const barChartData = data.loansByStatus.map(item => ({
    name: item.status.replace('_', ' '),
    loans: item.count,
    amount: item.amount,
    outstanding: item.outstanding
  }));

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Loans</p>
          <p className="text-2xl font-semibold">{data.totalLoans}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active Loans</p>
          <p className="text-2xl font-semibold text-blue-600">{data.activeLoans}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Disbursed</p>
          <p className="text-2xl font-semibold">₵{data.totalDisbursed.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-semibold text-amber-600">₵{data.totalOutstanding.toLocaleString()}</p>
        </Card>
      </div>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Loans by Status</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₵${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="amount" name="Total Amount" fill="#8884d8" />
              <Bar dataKey="outstanding" name="Outstanding" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Recently Created Loans</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentLoans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.loan_number}</TableCell>
                <TableCell>{loan.customer_name}</TableCell>
                <TableCell>₵{loan.amount.toLocaleString()}</TableCell>
                <TableCell>₵{loan.remaining_balance.toLocaleString()}</TableCell>
                <TableCell>{loan.loan_status.replace('_', ' ')}</TableCell>
                <TableCell>{format(new Date(loan.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default LoanReports;
