
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const DashboardChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        // Get data for the last 6 months
        const lastSixMonths = Array(6)
          .fill(0)
          .map((_, index) => {
            const date = subMonths(new Date(), index);
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            return {
              month: format(date, "MMM"),
              startDate: start.toISOString(),
              endDate: end.toISOString(),
            };
          })
          .reverse();

        const monthlyData = await Promise.all(
          lastSixMonths.map(async (month) => {
            // Fetch deposits
            const { data: deposits, error: depositsError } = await supabase
              .from("transactions")
              .select("amount")
              .eq("transaction_type", "deposit")
              .gte("created_at", month.startDate)
              .lte("created_at", month.endDate);

            // Fetch loans
            const { data: loans, error: loansError } = await supabase
              .from("transactions")
              .select("amount")
              .eq("transaction_type", "loan_disbursement")
              .gte("created_at", month.startDate)
              .lte("created_at", month.endDate);

            // Fetch repayments
            const { data: repayments, error: repaymentsError } = await supabase
              .from("transactions")
              .select("amount")
              .eq("transaction_type", "loan_repayment")
              .gte("created_at", month.startDate)
              .lte("created_at", month.endDate);

            if (depositsError || loansError || repaymentsError) {
              console.error("Error fetching chart data:", depositsError || loansError || repaymentsError);
              return {
                name: month.month,
                deposits: 0,
                loans: 0,
                repayments: 0,
              };
            }

            const totalDeposits = deposits?.reduce((sum, item) => sum + item.amount, 0) || 0;
            const totalLoans = loans?.reduce((sum, item) => sum + item.amount, 0) || 0;
            const totalRepayments = repayments?.reduce((sum, item) => sum + item.amount, 0) || 0;

            return {
              name: month.month,
              deposits: totalDeposits,
              loans: totalLoans,
              repayments: totalRepayments,
            };
          })
        );

        setChartData(monthlyData);
      } catch (error) {
        console.error("Unexpected error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionData();
  }, []);

  // Generate placeholder data if no data or loading
  const placeholderData = [
    { name: "Jul", deposits: 24000, loans: 18000, repayments: 15000 },
    { name: "Aug", deposits: 30000, loans: 22000, repayments: 18000 },
    { name: "Sep", deposits: 27000, loans: 20000, repayments: 17000 },
    { name: "Oct", deposits: 32000, loans: 25000, repayments: 21000 },
    { name: "Nov", deposits: 35000, loans: 28000, repayments: 23000 },
    { name: "Dec", deposits: 40000, loans: 30000, repayments: 26000 },
  ];

  const displayData = loading || chartData.length === 0 ? placeholderData : chartData;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Financial Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `₵ ${Number(value).toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="deposits" name="Savings" fill="#3b82f6" />
              <Bar dataKey="loans" name="Loans" fill="#10b981" />
              <Bar dataKey="repayments" name="Repayments" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardChart;
