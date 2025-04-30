
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

const AccountingLedger = () => {
  const [period, setPeriod] = useState("current-month");
  
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">General Ledger</h1>
        <p className="text-gray-600">View and manage financial transactions</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ledger Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Time Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="previous-month">Previous Month</SelectItem>
                  <SelectItem value="quarter">Current Quarter</SelectItem>
                  <SelectItem value="year-to-date">Year to Date</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account">Account Filter</Label>
              <Select>
                <SelectTrigger id="account">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="liabilities">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search Transactions</Label>
              <Input id="search" placeholder="Search by description or amount" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2025-04-28</TableCell>
                <TableCell>JE-2025042801</TableCell>
                <TableCell>Cash</TableCell>
                <TableCell>Customer payment - John Doe</TableCell>
                <TableCell className="text-right">₵ 2,500.00</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">₵ 2,500.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-04-28</TableCell>
                <TableCell>JE-2025042801</TableCell>
                <TableCell>Accounts Receivable</TableCell>
                <TableCell>Customer payment - John Doe</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">₵ 2,500.00</TableCell>
                <TableCell className="text-right">₵ 0.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-04-27</TableCell>
                <TableCell>JE-2025042702</TableCell>
                <TableCell>Loan Disbursement</TableCell>
                <TableCell>Loan issued - Sarah Johnson</TableCell>
                <TableCell className="text-right">₵ 5,000.00</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">₵ 5,000.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-04-27</TableCell>
                <TableCell>JE-2025042702</TableCell>
                <TableCell>Cash</TableCell>
                <TableCell>Loan issued - Sarah Johnson</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">₵ 5,000.00</TableCell>
                <TableCell className="text-right">₵ 0.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AccountingLedger;
