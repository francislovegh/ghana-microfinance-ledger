import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { IdType } from "@/types/app";

interface CustomerData {
  totalCustomers: number;
  newCustomers: number;
  customersWithSavings: number;
  customersWithLoans: number;
  idTypesDistribution: {
    id_type: IdType | null;
    count: number;
  }[];
  recentCustomers: {
    id: string;
    full_name: string;
    phone_number: string;
    email: string | null;
    id_type: IdType | null;
    created_at: string;
    has_savings: boolean;
    has_loans: boolean;
  }[];
  topCustomers: {
    id: string;
    full_name: string;
    phone_number: string;
    total_savings: number;
    total_loans: number;
  }[];
}

interface CustomerReportsProps {
  dateRange: DateRange;
}

const CustomerReports = ({ dateRange }: CustomerReportsProps) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['customerReports', dateRange],
    queryFn: async (): Promise<CustomerData> => {
      try {
        // Get customer data
        const { data: customers, error: customersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer')
          .gte('created_at', dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '')
          .lte('created_at', dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '');
          
        if (customersError) {
          console.error("Error fetching customers:", customersError);
          throw customersError;
        }
        
        // Get savings accounts data
        const { data: savingsAccounts, error: savingsError } = await supabase
          .from('savings_accounts')
          .select('user_id, balance');
          
        if (savingsError) {
          console.error("Error fetching savings accounts:", savingsError);
          throw savingsError;
        }
        
        // Get loans data
        const { data: loans, error: loansError } = await supabase
          .from('loans')
          .select('user_id, amount, remaining_balance');
          
        if (loansError) {
          console.error("Error fetching loans:", loansError);
          throw loansError;
        }
        
        // Calculate customer statistics
        const totalCustomers = customers.length;
        const newCustomers = customers.filter(c => 
          new Date(c.created_at) >= (dateRange.from || new Date(0)) && 
          new Date(c.created_at) <= (dateRange.to || new Date())
        ).length;
        
        // Get unique customers with savings
        const customersWithSavingsIds = new Set(savingsAccounts.map(a => a.user_id));
        const customersWithSavings = customersWithSavingsIds.size;
        
        // Get unique customers with loans
        const customersWithLoansIds = new Set(loans.map(l => l.user_id));
        const customersWithLoans = customersWithLoansIds.size;
        
        // Count ID types
        const idTypesDistribution = Object.entries(
          customers.reduce((acc: Record<string, any>, customer) => {
            const idType = customer.id_type || 'none';
            if (!acc[idType]) {
              acc[idType] = {
                id_type: customer.id_type,
                count: 0,
              };
            }
            acc[idType].count += 1;
            return acc;
          }, {})
        ).map(([_, value]) => value);
        
        // Process customer data with savings and loans information
        const processedCustomers = customers.map(customer => {
          const hasSavings = savingsAccounts.some(a => a.user_id === customer.id);
          const hasLoans = loans.some(l => l.user_id === customer.id);
          
          return {
            ...customer,
            has_savings: hasSavings,
            has_loans: hasLoans
          };
        });
        
        // Get recent customers
        const recentCustomers = processedCustomers
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // Calculate top customers by total financial activity
        const customerFinancials = customers.map(customer => {
          const customerSavings = savingsAccounts
            .filter(a => a.user_id === customer.id)
            .reduce((sum, a) => sum + a.balance, 0);
            
          const customerLoans = loans
            .filter(l => l.user_id === customer.id)
            .reduce((sum, l) => sum + l.amount, 0);
            
          return {
            id: customer.id,
            full_name: customer.full_name,
            phone_number: customer.phone_number,
            total_savings: customerSavings,
            total_loans: customerLoans
          };
        });
        
        // Sort by total financial activity (savings + loans)
        const topCustomers = customerFinancials
          .sort((a, b) => (b.total_savings + b.total_loans) - (a.total_savings + a.total_loans))
          .slice(0, 5);
        
        return {
          totalCustomers,
          newCustomers,
          customersWithSavings,
          customersWithLoans,
          idTypesDistribution,
          recentCustomers,
          topCustomers
        };
      } catch (error: any) {
        console.error("Error in customer reports query:", error);
        throw new Error(error.message || "Failed to load customer reports");
      }
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
  
  if (error) return <div className="text-red-500">Error loading customer reports: {(error as Error).message}</div>;
  
  if (!data) return <div>No data available</div>;

  const formatIdType = (idType: string | null) => {
    if (!idType || idType === 'none') return 'None';
    return idType.replace('_', ' ');
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-semibold">{data.totalCustomers}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">New Customers</p>
          <p className="text-2xl font-semibold text-blue-600">{data.newCustomers}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">With Savings Accounts</p>
          <p className="text-2xl font-semibold text-green-600">{data.customersWithSavings}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-500">With Loans</p>
          <p className="text-2xl font-semibold text-amber-600">{data.customersWithLoans}</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">ID Type Distribution</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Type</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.idTypesDistribution.map((item) => (
                <TableRow key={item.id_type || 'none'}>
                  <TableCell className="font-medium">
                    {formatIdType(item.id_type)}
                  </TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>
                    {Math.round((item.count / data.totalCustomers) * 100)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Top Customers</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Savings</TableHead>
                <TableHead>Loans</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.full_name}
                    <div className="text-xs text-gray-500">{customer.phone_number}</div>
                  </TableCell>
                  <TableCell>₵{customer.total_savings.toLocaleString()}</TableCell>
                  <TableCell>₵{customer.total_loans.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Recently Added Customers</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>ID Type</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Services</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.full_name}</TableCell>
                <TableCell>
                  {customer.phone_number}
                  {customer.email && (
                    <div className="text-xs text-gray-500">{customer.email}</div>
                  )}
                </TableCell>
                <TableCell>{formatIdType(customer.id_type)}</TableCell>
                <TableCell>{format(new Date(customer.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {customer.has_savings && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Savings</span>
                    )}
                    {customer.has_loans && (
                      <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">Loans</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CustomerReports;
