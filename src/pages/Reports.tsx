
import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, FileText, Printer, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import AuthGuard from "@/components/auth/AuthGuard";
import SavingsReports from "@/components/reports/SavingsReports";
import LoanReports from "@/components/reports/LoanReports";
import TransactionReports from "@/components/reports/TransactionReports";
import CustomerReports from "@/components/reports/CustomerReports";
import { useToast } from "@/hooks/use-toast";

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("savings");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Download",
      description: "PDF download functionality would be implemented here",
    });
  };

  const handleDownloadCSV = () => {
    toast({
      title: "CSV Download",
      description: "CSV download functionality would be implemented here",
    });
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and view financial reports</p>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full md:w-auto"
              align="start"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV}>
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full border-b">
            <TabsTrigger value="savings" className="flex-1">Savings Accounts</TabsTrigger>
            <TabsTrigger value="loans" className="flex-1">Loans</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
            <TabsTrigger value="customers" className="flex-1">Customers</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="savings">
              <SavingsReports dateRange={dateRange} />
            </TabsContent>
            
            <TabsContent value="loans">
              <LoanReports dateRange={dateRange} />
            </TabsContent>
            
            <TabsContent value="transactions">
              <TransactionReports dateRange={dateRange} />
            </TabsContent>
            
            <TabsContent value="customers">
              <CustomerReports dateRange={dateRange} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </AppLayout>
  );
};

const Reports = () => {
  return (
    <AuthGuard>
      <ReportsPage />
    </AuthGuard>
  );
};

export default Reports;
