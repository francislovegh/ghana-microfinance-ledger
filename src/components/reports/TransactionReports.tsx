
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TransactionType, PaymentMethod } from "@/types/app";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TransactionData {
  totalTransactions: number;
  totalAmount: number;
  depositAmount: number;
  withdrawalAmount: number;
  transactionsByType: {
    type: string;
    count: number;
    amount: number;
  }[];
  transactionsByDay: {
    date: string;
    deposits: number;
    withdrawals: number;
    other: number;
  }[];
  recentTransactions: {
    id: string;
    transaction_number: string;
    amount: number;
    transaction_type: TransactionType;
    payment_method: PaymentMethod;
    created_at: string;
    customer_name: string;
  }[];
}

interface TransactionReportsProps {
  dateRange: DateRange;
}

const TransactionReports = ({ dateRange }: TransactionReportsProps) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['transactionReports', dateRange],
    queryFn: async (): Promise<TransactionData> => {
      // Get transaction data
      // Fix: specify the column name with user_id to avoid ambiguity
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, profiles:user_id(full_name)')
        .gte('created_at', dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '')
        .lte('created_at', dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '');
        
      if (transactionsError) throw transactionsError;
      
      // Process transactions to include customer name
      const processedTransactions = transactions.map(transaction => ({
        ...transaction,
        // Handle the case where profiles might be null
        customer_name: transaction.profiles?.full_name || 'Unknown'
      }));
      
      // Calculate transaction statistics
      const totalTransactions = processedTransactions.length;
      const totalAmount = processedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const depositAmount = processedTransactions
        .filter(t => t.transaction_type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawalAmount = processedTransactions
        .filter(t => t.transaction_type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Group transactions by type
      const transactionsByType = Object.entries(
        processedTransactions.reduce((acc: Record<string, any>, t) => {
          const type = t.transaction_type;
          if (!acc[type]) {
            acc[type] = {
              type,
              count: 0,
              amount: 0,
            };
          }
          acc[type].count += 1;
          acc[type].amount += t.amount;
          return acc;
        }, {})
      ).map(([_, value]) => value);
      
      // Group transactions by day
      const transactionsByDay = processedTransactions.reduce((acc: Record<string, any>, t) => {
        const date = format(new Date(t.created_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = {
            date: format(new Date(date), 'MMM dd'),
            deposits: 0,
            withdrawals: 0,
            other: 0,
          };
        }
        
        if (t.transaction_type === 'deposit') {
          acc[date].deposits += t.amount;
        } else if (t.transaction_type === 'withdrawal') {
          acc[date].withdrawals += t.amount;
        } else {
          acc[date].other += t.amount;
        }
        
        return acc;
      }, {});
      
      // Convert to array and sort by date
      const transactionsByDayArray = Object.values(transactionsByDay).sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Get recent transactions
      const recentTransactions = processedTransactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      return {
        totalTransactions,
        totalAmount,
        depositAmount,
        withdrawalAmount,
        transactionsByType,
        transactionsByDay: transactionsByDayArray,
        recentTransactions
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
  
  if (error) return <div className="text-red-500">Error loading transaction reports</div>;
  
  if (!data) return <div>No data available</div>;

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-green-500">Deposit</Badge>;
      case "withdrawal":
        return <Badge className="bg-orange-500">Withdrawal</Badge>;
      case "loan_disbursement":
        return <Badge className="bg-purple-500">Loan Disbursement</Badge>;
      case "loan_repayment":
        return <Badge className="bg-blue-500">Loan Repayment</Badge>;
      case "interest_payment":
        return <Badge className="bg-cyan-500">Interest Payment</Badge>;
      case "penalty_payment":
        return <Badge className="bg-red-500">Penalty Payment</Badge>;
      default:
        return <Badge>{type.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-semibold">{data.totalTransactions}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-semibold">₵{data.totalAmount.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Deposits</p>
          <p className="text-2xl font-semibold text-green-600">₵{data.depositAmount.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Withdrawals</p>
          <p className="text-2xl font-semibold text-orange-600">₵{data.withdrawalAmount.toLocaleString()}</p>
        </Card>
      </div>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Transaction Activity</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.transactionsByDay}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₵${Number(value).toLocaleString()}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="deposits" 
                name="Deposits" 
                stroke="#10b981" 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="withdrawals" 
                name="Withdrawals" 
                stroke="#f97316" 
              />
              <Line 
                type="monotone" 
                dataKey="other" 
                name="Other" 
                stroke="#6366f1" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Transactions by Type</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Type</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transactionsByType.map((type) => (
              <TableRow key={type.type}>
                <TableCell>
                  {getTransactionTypeBadge(type.type)}
                </TableCell>
                <TableCell>{type.count}</TableCell>
                <TableCell>₵{type.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction No</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.transaction_number.slice(-6)}</TableCell>
                <TableCell>{transaction.customer_name}</TableCell>
                <TableCell>
                  {getTransactionTypeBadge(transaction.transaction_type)}
                </TableCell>
                <TableCell>₵{transaction.amount.toLocaleString()}</TableCell>
                <TableCell>{transaction.payment_method.replace('_', ' ')}</TableCell>
                <TableCell>{format(new Date(transaction.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TransactionReports;
