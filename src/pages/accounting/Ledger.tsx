
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileDown, Filter, Calendar, ArrowUpDown, BookOpen } from "lucide-react";
import { format } from "date-fns";
import AuthGuard from "@/components/auth/AuthGuard";

const LedgerPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dummy data for the ledger entries
  const dummyEntries = [
    {
      id: "1",
      date: new Date().toISOString(),
      reference: "JE-0001",
      description: "Loan disbursement to John Doe",
      debit_account: "Cash",
      credit_account: "Loans Receivable",
      amount: 5000,
      entry_type: "loan"
    },
    {
      id: "2",
      date: new Date().toISOString(),
      reference: "JE-0002",
      description: "Interest income from Loan #20123456",
      debit_account: "Interest Receivable",
      credit_account: "Interest Income",
      amount: 250,
      entry_type: "interest"
    },
    {
      id: "3",
      date: new Date().toISOString(),
      reference: "JE-0003",
      description: "Savings deposit from Jane Smith",
      debit_account: "Cash",
      credit_account: "Customer Savings",
      amount: 1000,
      entry_type: "savings"
    },
    {
      id: "4",
      date: new Date().toISOString(),
      reference: "JE-0004",
      description: "Penalty fee for late payment",
      debit_account: "Accounts Receivable",
      credit_account: "Penalty Income",
      amount: 100,
      entry_type: "penalty"
    },
    {
      id: "5",
      date: new Date().toISOString(),
      reference: "JE-0005",
      description: "Staff salary payment",
      debit_account: "Salary Expense",
      credit_account: "Cash",
      amount: 3000,
      entry_type: "expense"
    }
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">General Ledger</h1>
        <p className="text-gray-600">Track and manage all financial transactions</p>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search ledger entries..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-grow md:justify-end">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Ledger
              </Button>
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                New Journal Entry
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange}
              className="w-full"
              placeholder="Filter by date range"
              align="start"
            />
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All account categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                <SelectItem value="main">Main Branch</SelectItem>
                <SelectItem value="east">East Branch</SelectItem>
                <SelectItem value="west">West Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="loan">Loan Entries</TabsTrigger>
          <TabsTrigger value="savings">Savings Entries</TabsTrigger>
          <TabsTrigger value="interest">Interest & Penalties</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit Account</TableHead>
                    <TableHead>Credit Account</TableHead>
                    <TableHead className="text-right">Amount (₵)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : dummyEntries
                      .filter(entry => activeTab === "all" || entry.entry_type === activeTab)
                      .map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.debit_account}</TableCell>
                      <TableCell>{entry.credit_account}</TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const AccountingLedger = () => {
  return (
    <AuthGuard>
      <LedgerPage />
    </AuthGuard>
  );
};

export default AccountingLedger;
