
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search } from "lucide-react";

const ChartOfAccounts = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chart of Accounts</h1>
        <p className="text-gray-600">Manage financial accounts structure</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account List</CardTitle>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search accounts..."
              className="pl-9"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">1000</TableCell>
                <TableCell>Cash</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Current Asset</TableCell>
                <TableCell className="text-right">₵ 24,500.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">1100</TableCell>
                <TableCell>Accounts Receivable</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Current Asset</TableCell>
                <TableCell className="text-right">₵ 15,750.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">2000</TableCell>
                <TableCell>Accounts Payable</TableCell>
                <TableCell>Liability</TableCell>
                <TableCell>Current Liability</TableCell>
                <TableCell className="text-right">₵ 8,250.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">3000</TableCell>
                <TableCell>Member Shares</TableCell>
                <TableCell>Equity</TableCell>
                <TableCell>Capital</TableCell>
                <TableCell className="text-right">₵ 32,000.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">4000</TableCell>
                <TableCell>Interest Income</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Operating Revenue</TableCell>
                <TableCell className="text-right">₵ 7,800.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">5000</TableCell>
                <TableCell>Operating Expenses</TableCell>
                <TableCell>Expense</TableCell>
                <TableCell>General Expense</TableCell>
                <TableCell className="text-right">₵ 5,430.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">5100</TableCell>
                <TableCell>Staff Salaries</TableCell>
                <TableCell>Expense</TableCell>
                <TableCell>Personnel Expense</TableCell>
                <TableCell className="text-right">₵ 12,500.00</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default ChartOfAccounts;
