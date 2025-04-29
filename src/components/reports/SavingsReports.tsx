
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AccountType } from "@/types/app";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SavingsData {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  totalBalance: number;
  accountsByType: {
    type: string;
    count: number;
    balance: number;
  }[];
  recentAccounts: {
    id: string;
    account_number: string;
    balance: number;
    account_type: AccountType;
    interest_rate: number;
    created_at: string;
    customer_name: string;
  }[];
}

interface SavingsReportsProps {
  dateRange: DateRange;
}

const SavingsReports = ({ dateRange }: SavingsReportsProps) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['savingsReports', dateRange],
    queryFn: async (): Promise<SavingsData> => {
      // Get account totals
      const { data: accounts, error: accountsError } = await supabase
        .from('savings_accounts')
        .select('*, profiles:user_id(full_name)')
        .gte('created_at', dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '')
        .lte('created_at', dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '');
        
      if (accountsError) throw accountsError;
      
      const processedAccounts = accounts.map(account => ({
        ...account,
        customer_name: account.profiles?.full_name || 'Unknown'
      }));
      
      // Calculate account statistics
      const totalAccounts = processedAccounts.length;
      const activeAccounts = processedAccounts.filter(a => a.is_active).length;
      const inactiveAccounts = totalAccounts - activeAccounts;
      const totalBalance = processedAccounts.reduce((sum, account) => sum + account.balance, 0);
      
      // Group accounts by type
      const accountsByType = Object.entries(
        processedAccounts.reduce((acc: Record<string, any>, account) => {
          const type = account.account_type;
          if (!acc[type]) {
            acc[type] = {
              type,
              count: 0,
              balance: 0,
            };
          }
          acc[type].count += 1;
          acc[type].balance += account.balance;
          return acc;
        }, {})
      ).map(([_, value]) => value);
      
      // Get recent accounts
      const recentAccounts = processedAccounts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      return {
        totalAccounts,
        activeAccounts,
        inactiveAccounts,
        totalBalance,
        accountsByType,
        recentAccounts
      };
    }
  });
  
  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
  
  if (error) return <div className="text-red-500">Error loading savings reports</div>;
  
  if (!data) return <div>No data available</div>;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
  
  const pieData = data.accountsByType.map(item => ({
    name: item.type.replace('_', ' '),
    value: item.count
  }));

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Accounts</p>
          <p className="text-2xl font-semibold">{data.totalAccounts}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active Accounts</p>
          <p className="text-2xl font-semibold text-green-600">{data.activeAccounts}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-2xl font-semibold">₵{data.totalBalance.toLocaleString()}</p>
        </Card>
      </div>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Accounts by Type</h3>
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full md:w-1/2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Total Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.accountsByType.map((type) => (
                  <TableRow key={type.type}>
                    <TableCell className="font-medium">
                      {type.type.replace('_', ' ')}
                    </TableCell>
                    <TableCell>{type.count}</TableCell>
                    <TableCell>₵{type.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Recently Created Accounts</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Interest Rate</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.account_number}</TableCell>
                <TableCell>{account.customer_name}</TableCell>
                <TableCell>{account.account_type.replace('_', ' ')}</TableCell>
                <TableCell>{account.interest_rate}%</TableCell>
                <TableCell>₵{account.balance.toLocaleString()}</TableCell>
                <TableCell>{format(new Date(account.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default SavingsReports;
