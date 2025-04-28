
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import DashboardChart from "@/components/dashboard/DashboardChart";
import { 
  DollarSign, 
  Users, 
  BarChart4, 
  PiggyBank, 
  CreditCard 
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/auth/AuthGuard";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSavings: 0,
    activeLoans: 0,
    totalCustomers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch total savings
        const { data: savingsData, error: savingsError } = await supabase
          .from("savings_accounts")
          .select("balance")
          .eq("is_active", true);

        // Fetch active loans
        const { count: activeLoansCount, error: loansError } = await supabase
          .from("loans")
          .select("id", { count: "exact" })
          .eq("status", "active");

        // Fetch total customers
        const { count: customersCount, error: customersError } = await supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("role", "customer");

        // Fetch revenue (total interest payments)
        const { data: revenueData, error: revenueError } = await supabase
          .from("transactions")
          .select("amount")
          .eq("transaction_type", "interest_payment");

        if (savingsError || loansError || customersError || revenueError) {
          console.error("Error fetching dashboard stats:", 
            savingsError || loansError || customersError || revenueError);
        } else {
          const totalSavings = savingsData?.reduce((sum, account) => sum + account.balance, 0) || 0;
          const revenue = revenueData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
          
          setStats({
            totalSavings,
            activeLoans: activeLoansCount || 0,
            totalCustomers: customersCount || 0,
            revenue,
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Ghana Microfinance Ledger system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Savings"
          value={`₵ ${loading ? '...' : stats.totalSavings.toLocaleString()}`}
          icon={<PiggyBank className="h-6 w-6" />}
          trend={{ value: "+2.5%", positive: true }}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Active Loans"
          value={loading ? '...' : stats.activeLoans.toString()}
          icon={<CreditCard className="h-6 w-6" />}
          trend={{ value: "-1.2%", positive: false }}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />

        <StatCard
          title="Total Customers"
          value={loading ? '...' : stats.totalCustomers.toString()}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: "+3.1%", positive: true }}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />

        <StatCard
          title="Revenue"
          value={`₵ ${loading ? '...' : stats.revenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: "+5.4%", positive: true }}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <DashboardChart />
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            New Savings Account
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Process Loan Application
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Register New Customer
          </Button>
          <Button variant="outline">Generate Reports</Button>
        </div>
      </div>
    </AppLayout>
  );
};

const Index = () => {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
};

export default Index;
