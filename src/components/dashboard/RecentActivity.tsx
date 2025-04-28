
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { CreditCard, PiggyBank } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionProfile {
  full_name: string;
}

interface Transaction {
  id: string;
  transaction_number: string;
  amount: number;
  transaction_type: string;
  created_at: string;
  user_id: string;
  profiles?: TransactionProfile | null;
}

const RecentActivity = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*, profiles:user_id(full_name)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching transactions:", error);
        } else if (data) {
          // Transform the data to ensure it matches our Transaction type
          const typedTransactions = data.map(transaction => {
            // Handle potentially invalid profile data
            const transformedTransaction: Transaction = {
              ...transaction,
              profiles: typeof transaction.profiles === 'object' && transaction.profiles !== null 
                ? transaction.profiles as TransactionProfile 
                : { full_name: "Unknown Customer" }
            };
            return transformedTransaction;
          });
          
          setTransactions(typedTransactions);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  const getTransactionIcon = (type: string) => {
    if (type === "deposit" || type === "loan_repayment") {
      return <PiggyBank className="h-5 w-5 text-blue-600" />;
    }
    return <CreditCard className="h-5 w-5 text-green-600" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === "deposit" || type === "loan_repayment") {
      return "bg-blue-100";
    }
    return "bg-green-100";
  };

  const formatTransactionType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <h3 className="text-lg font-semibold px-6 pt-4 pb-2">Recent Activities</h3>
        <ul className="divide-y divide-gray-200">
          {loading ? (
            Array(5).fill(0).map((_, index) => (
              <li key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </li>
            ))
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <li key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${getTransactionColor(transaction.transaction_type)} p-2 rounded-full`}>
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatTransactionType(transaction.transaction_type)} - ₵ {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.profiles?.full_name || "Unknown Customer"} - #{transaction.transaction_number.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center">
              <p className="text-gray-500">No recent transactions</p>
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
};

export default RecentActivity;
