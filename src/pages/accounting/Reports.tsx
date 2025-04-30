
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Printer, BarChart2, PieChart, FileText, ReceiptText } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

const AccountingReportsPage = () => {
  const [reportTab, setReportTab] = useState("financial");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedReport, setSelectedReport] = useState("balance_sheet");
  
  // Dummy data for balance sheet
  const balanceSheetData = {
    assets: [
      { name: "Cash on Hand", amount: 25000 },
      { name: "Mobile Money Wallets", amount: 18500 },
      { name: "Loans Receivable", amount: 150000 },
      { name: "Fixed Assets", amount: 35000 }
    ],
    liabilities: [
      { name: "Customer Savings", amount: 85000 },
      { name: "Loans Payable", amount: 50000 }
    ],
    equity: [
      { name: "Capital", amount: 75000 },
      { name: "Retained Earnings", amount: 18500 }
    ]
  };
  
  // Dummy data for income statement
  const incomeStatementData = {
    income: [
      { name: "Interest Income", amount: 25000 },
      { name: "Penalty Income", amount: 3500 },
      { name: "Fee Income", amount: 4800 }
    ],
    expenses: [
      { name: "Salary Expense", amount: 12000 },
      { name: "Rent Expense", amount: 2500 },
      { name: "Utilities", amount: 1200 },
      { name: "Loan Loss Provision", amount: 3500 }
    ]
  };
  
  // Calculate totals
  const totalAssets = balanceSheetData.assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = balanceSheetData.liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  
  const totalIncome = incomeStatementData.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = incomeStatementData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  
  // Render the selected report
  const renderReport = () => {
    switch (selectedReport) {
      case "balance_sheet":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>As of {new Date().toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Assets</h3>
                    <Table>
                      <TableBody>
                        {balanceSheetData.assets.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">₵{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total Assets</TableCell>
                          <TableCell className="text-right">₵{totalAssets.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
                    <Table>
                      <TableBody>
                        {balanceSheetData.liabilities.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">₵{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total Liabilities</TableCell>
                          <TableCell className="text-right">₵{totalLiabilities.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Equity</h3>
                    <Table>
                      <TableBody>
                        {balanceSheetData.equity.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">₵{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total Equity</TableCell>
                          <TableCell className="text-right">₵{totalEquity.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell>Total Liabilities and Equity</TableCell>
                          <TableCell className="text-right">₵{totalLiabilitiesAndEquity.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
        
      case "income_statement":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>For the period ending {new Date().toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Income</h3>
                    <Table>
                      <TableBody>
                        {incomeStatementData.income.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">₵{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total Income</TableCell>
                          <TableCell className="text-right">₵{totalIncome.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Expenses</h3>
                    <Table>
                      <TableBody>
                        {incomeStatementData.expenses.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">₵{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total Expenses</TableCell>
                          <TableCell className="text-right">₵{totalExpenses.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell>Net Income</TableCell>
                          <TableCell className="text-right">₵{netIncome.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
        
      case "cash_flow":
        return (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">Cash Flow Statement</h3>
              <p className="mt-2 text-gray-500">Select a date range to generate the cash flow statement.</p>
            </div>
          </div>
        );
        
      case "trial_balance":
        return (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">Trial Balance</h3>
              <p className="mt-2 text-gray-500">Select a date to generate the trial balance.</p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center justify-center p-12">
            <p className="text-gray-500">Please select a report to view.</p>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600">Generate and view financial statements and reports</p>
      </div>
      
      <div className="mb-6">
        <Tabs value={reportTab} onValueChange={setReportTab}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="financial">Financial Statements</TabsTrigger>
            <TabsTrigger value="regulatory">Regulatory Reports</TabsTrigger>
            <TabsTrigger value="tax">Tax Reports</TabsTrigger>
            <TabsTrigger value="audit">Audit Reports</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                <SelectItem value="income_statement">Income Statement</SelectItem>
                <SelectItem value="cash_flow">Cash Flow Statement</SelectItem>
                <SelectItem value="trial_balance">Trial Balance</SelectItem>
              </SelectContent>
            </Select>
            
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange}
              className="w-full"
              placeholder="Select date range"
              align="start"
            />
            
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="main">Main Branch</SelectItem>
                <SelectItem value="east">East Branch</SelectItem>
                <SelectItem value="west">West Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button>Generate Report</Button>
          </div>
        </div>
      </Card>
      
      {renderReport()}
    </AppLayout>
  );
};

const AccountingReports = () => {
  return (
    <AuthGuard>
      <AccountingReportsPage />
    </AuthGuard>
  );
};

export default AccountingReports;
