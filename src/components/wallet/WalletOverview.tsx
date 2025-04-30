
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, ArrowDown, ArrowUp, CreditCard, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WalletStats {
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  mobileMoneyBalance: number;
  bankBalance: number;
  transactionHistory: {
    date: string;
    deposits: number;
    withdrawals: number;
    transfers: number;
  }[];
  recentTransactions: {
    id: string;
    transaction_number: string;
    amount: number;
    transaction_type: string;
    payment_method: string;
    created_at: string;
    customer_name: string;
  }[];
}

const WalletOverview = () => {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletStats = async () => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        
        // Fetch transactions
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select(`
            *,
            profiles:user_id(full_name)
          `)
          .gte('created_at', format(startDate, 'yyyy-MM-dd'))
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Calculate wallet stats
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let mobileMoneyBalance = 0;
        let bankBalance = 0;
        
        const depositTypes = ['deposit'];
        const withdrawalTypes = ['withdrawal'];
        const mobileMoneyMethods = ['mtn_momo', 'vodafone_cash', 'airteltigo_money'];
        const bankMethods = ['bank_transfer'];
        
        transactions?.forEach(transaction => {
          if (depositTypes.includes(transaction.transaction_type)) {
            totalDeposits += transaction.amount;
            
            if (mobileMoneyMethods.includes(transaction.payment_method)) {
              mobileMoneyBalance += transaction.amount;
            } else if (bankMethods.includes(transaction.payment_method)) {
              bankBalance += transaction.amount;
            }
          }
          
          if (withdrawalTypes.includes(transaction.transaction_type)) {
            totalWithdrawals += transaction.amount;
            
            if (mobileMoneyMethods.includes(transaction.payment_method)) {
              mobileMoneyBalance -= transaction.amount;
            } else if (bankMethods.includes(transaction.payment_method)) {
              bankBalance -= transaction.amount;
            }
          }
        });
        
        const totalBalance = totalDeposits - totalWithdrawals;
        
        // Group transactions by day for history chart
        const transactionsByDay = transactions?.reduce((acc: Record<string, any>, transaction) => {
          const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
          
          if (!acc[date]) {
            acc[date] = {
              date: format(new Date(date), 'MMM dd'),
              deposits: 0,
              withdrawals: 0,
              transfers: 0,
            };
          }
          
          if (depositTypes.includes(transaction.transaction_type)) {
            acc[date].deposits += transaction.amount;
          } else if (withdrawalTypes.includes(transaction.transaction_type)) {
            acc[date].withdrawals += transaction.amount;
          } else if (transaction.transaction_type === 'transfer') {
            acc[date].transfers += transaction.amount;
          }
          
          return acc;
        }, {});
        
        const transactionHistory = Object.values(transactionsByDay || {}).sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Format recent transactions
        const recentTransactions = transactions?.slice(0, 5).map(transaction => ({
          id: transaction.id,
          transaction_number: transaction.transaction_number,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          payment_method: transaction.payment_method,
          created_at: transaction.created_at,
          customer_name: transaction.profiles?.full_name || "Unknown"
        }));
        
        setStats({
          totalBalance,
          totalDeposits,
          totalWithdrawals,
          mobileMoneyBalance,
          bankBalance,
          transactionHistory,
          recentTransactions
        });
      } catch (error) {
        console.error("Error fetching wallet stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Banknote className="mr-2 h-4 w-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₵{stats?.totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <ArrowDown className="mr-2 h-4 w-4 text-green-500" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₵{stats?.totalDeposits.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <ArrowUp className="mr-2 h-4 w-4 text-orange-500" />
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">₵{stats?.totalWithdrawals.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Phone className="mr-2 h-4 w-4 text-blue-500" />
              Mobile Money Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">₵{stats?.mobileMoneyBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
              Bank Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">₵{stats?.bankBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats?.transactionHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                  dataKey="transfers" 
                  name="Transfers" 
                  stroke="#6366f1" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletOverview;
