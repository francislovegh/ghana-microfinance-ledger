
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, FileDown, Eye, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthGuard from "@/components/auth/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction, TransactionProfile, PaymentMethod, TransactionType } from "@/types/app";

interface TransactionDetailsProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionDetails = ({ transaction, onClose }: TransactionDetailsProps) => {
  if (!transaction) return null;
  
  const getTransactionTypeName = (type: string) => {
    const types: Record<string, string> = {
      "deposit": "Deposit",
      "withdrawal": "Withdrawal",
      "loan_disbursement": "Loan Disbursement",
      "loan_repayment": "Loan Repayment",
      "interest_payment": "Interest Payment",
      "penalty_payment": "Penalty Payment"
    };
    
    return types[type] || type;
  };
  
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      "cash": "Cash",
      "bank_transfer": "Bank Transfer",
      "mtn_momo": "MTN Mobile Money",
      "vodafone_cash": "Vodafone Cash",
      "airteltigo_money": "AirtelTigo Money"
    };
    
    return methods[method] || method;
  };
  
  return (
    <Dialog open={!!transaction} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{getTransactionTypeName(transaction.transaction_type)}</h3>
              <Badge className="text-lg px-3 py-1">
                ₵ {transaction.amount.toLocaleString()}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction Number</p>
              <p className="font-medium">{transaction.transaction_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{format(new Date(transaction.created_at), "PPP p")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{transaction.profiles?.full_name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Processed By</p>
              <p className="font-medium">{transaction.performed_by || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">{getPaymentMethodName(transaction.payment_method)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-medium">{transaction.reference_number || "N/A"}</p>
            </div>
          </div>
          
          {transaction.description && (
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <div className="p-3 bg-gray-50 rounded-md mt-1">
                {transaction.description}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
              <FileDown className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const csvLinkRef = useRef<HTMLAnchorElement | null>(null);
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Failed to fetch transactions",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setTransactions(data ? data.map(item => ({
          ...item,
          profiles: item.profiles || { full_name: "Unknown" },
          transaction_type: item.transaction_type as TransactionType,
          payment_method: item.payment_method as PaymentMethod
        })) as Transaction[] : []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };
  
  const handleCloseDetails = () => {
    setSelectedTransaction(null);
  };
  
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-green-500">Deposit</Badge>;
      case "withdrawal":
        return <Badge className="bg-orange-500">Withdrawal</Badge>;
      case "loan_disbursement":
        return <Badge className="bg-purple-500">Loan Disbursement</Badge>;
      case "loan_repayment":
        return <Badge className="bg-blue-500">Loan Repayment</Badge>;
      case "interest_payment":
        return <Badge className="bg-cyan-500">Interest Payment</Badge>;
      case "penalty_payment":
        return <Badge className="bg-red-500">Penalty Payment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };
  
  const filteredTransactions = transactions.filter((transaction) => {
    // Apply search filter
    const searchMatches = !searchQuery || 
      transaction.transaction_number.includes(searchQuery) || 
      (transaction.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (transaction.reference_number?.includes(searchQuery));
      
    // Apply type filter - updated to use "all" instead of empty string
    const typeMatches = typeFilter === "all" || transaction.transaction_type === typeFilter;
    
    // Apply method filter - updated to use "all" instead of empty string
    const methodMatches = methodFilter === "all" || transaction.payment_method === methodFilter;
    
    // Apply date range filter
    const dateMatches = !dateRange?.from || !dateRange?.to || 
      (new Date(transaction.created_at) >= dateRange.from &&
       new Date(transaction.created_at) <= new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1));
    
    return searchMatches && typeMatches && methodMatches && dateMatches;
  });
  
  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Transaction Number", "Date", "Type", "Amount", "Customer", "Method", "Reference", "Description"];
    
    const csvContent = filteredTransactions.map(t => [
      t.transaction_number,
      format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss"),
      t.transaction_type.replace(/_/g, ' '),
      t.amount.toString(),
      t.profiles?.full_name || "Unknown",
      t.payment_method.replace(/_/g, ' '),
      t.reference_number || "",
      t.description || ""
    ]);
    
    // Convert to CSV string
    const csvString = [
      headers.join(","),
      ...csvContent.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    if (csvLinkRef.current) {
      csvLinkRef.current.setAttribute("href", url);
      csvLinkRef.current.setAttribute("download", `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
      csvLinkRef.current.click();
    }
  };
  
  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setMethodFilter("all");
    setDateRange(undefined);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <p className="text-gray-600">View and export transaction records</p>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-grow md:justify-end">
              <a ref={csvLinkRef} className="hidden"></a>
              <Button
                variant="outline"
                className="w-full md:w-auto"
                onClick={exportToCSV}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All transaction types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All transaction types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                  <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                  <SelectItem value="interest_payment">Interest Payment</SelectItem>
                  <SelectItem value="penalty_payment">Penalty Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All payment methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                  <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                  <SelectItem value="airteltigo_money">AirtelTigo Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <DateRangePicker 
                value={dateRange} 
                onChange={setDateRange}
                className="w-full"
                placeholder="Filter by date range"
                align="start"
              />
            </div>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount (₵)</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.transaction_number.slice(-6)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.created_at), "MMM d, yyyy")}
                      <div className="text-xs text-gray-500">
                        {format(new Date(transaction.created_at), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {getTransactionTypeBadge(transaction.transaction_type)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {transaction.payment_method.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchQuery || typeFilter || methodFilter || dateRange
                      ? "No transactions matching your search filters"
                      : "No transactions found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <TransactionDetails 
        transaction={selectedTransaction}
        onClose={handleCloseDetails}
      />
    </AppLayout>
  );
};

const Transactions = () => {
  return (
    <AuthGuard>
      <TransactionsPage />
    </AuthGuard>
  );
};

export default Transactions;
