import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import { Search, PlusCircle, FileDown, Calendar, Eye, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import AuthGuard from "@/components/auth/AuthGuard";
import { ChartOfAccountItem } from "@/types/app";

const dummyJournalEntries = [
  {
    id: "1",
    entry_number: "JE-0001",
    description: "Loan disbursement to John Doe",
    entry_date: new Date().toISOString(),
    is_posted: true,
    is_recurring: false,
    created_by: "Admin User",
    total_debit: 5000,
    total_credit: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    posted_at: new Date().toISOString()
  },
  {
    id: "2",
    entry_number: "JE-0002",
    description: "Interest income from loans",
    entry_date: new Date().toISOString(),
    is_posted: true,
    is_recurring: false,
    created_by: "Admin User",
    total_debit: 750,
    total_credit: 750,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    posted_at: new Date().toISOString()
  },
  {
    id: "3",
    entry_number: "JE-0003",
    description: "Monthly office rent payment",
    entry_date: new Date().toISOString(),
    is_posted: false,
    is_recurring: true,
    created_by: "Admin User",
    total_debit: 1200,
    total_credit: 1200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    posted_at: null
  }
];

const dummyAccounts: ChartOfAccountItem[] = [
  {
    id: "1",
    code: "1000",
    name: "Cash on Hand",
    category: "asset",
    description: "Physical cash stored in office",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    code: "1010",
    name: "Mobile Money Wallets",
    category: "asset",
    description: "Funds in MTN, Vodafone, and AirtelTigo wallets",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    code: "1100",
    name: "Loans Receivable",
    category: "asset",
    description: "Outstanding loan balances owed by customers",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "4",
    code: "2000",
    name: "Customer Savings",
    category: "liability",
    description: "Savings deposits from customers",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "6",
    code: "4000",
    name: "Interest Income",
    category: "income",
    description: "Revenue from loan interest",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "8",
    code: "5000",
    name: "Salary Expense",
    category: "expense",
    description: "Employee salaries and wages",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "9",
    code: "5100",
    name: "Rent Expense",
    category: "expense",
    description: "Office rent payments",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const JournalEntriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [entryLines, setEntryLines] = useState([
    { id: "1", account_id: "", debit_amount: null, credit_amount: null, description: "" }
  ]);
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
  
  const addEntryLine = () => {
    setEntryLines([
      ...entryLines,
      { 
        id: Date.now().toString(), 
        account_id: "", 
        debit_amount: null, 
        credit_amount: null, 
        description: "" 
      }
    ]);
  };
  
  const removeEntryLine = (id: string) => {
    if (entryLines.length > 1) {
      setEntryLines(entryLines.filter(line => line.id !== id));
    }
  };
  
  const updateEntryLine = (id: string, field: string, value: any) => {
    setEntryLines(entryLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };
  
  // Calculate totals for the entry form
  const totalDebit = entryLines.reduce((sum, line) => 
    sum + (line.debit_amount ? parseFloat(line.debit_amount.toString()) : 0), 0);
    
  const totalCredit = entryLines.reduce((sum, line) => 
    sum + (line.credit_amount ? parseFloat(line.credit_amount.toString()) : 0), 0);
  
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  
  const filteredEntries = dummyJournalEntries.filter(entry => {
    const matchesSearch = 
      entry.entry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      activeTab === "all" || 
      (activeTab === "posted" && entry.is_posted) ||
      (activeTab === "draft" && !entry.is_posted) ||
      (activeTab === "recurring" && entry.is_recurring);
    
    // Date range filter logic would go here
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Journal Entries</h1>
        <p className="text-gray-600">Manage accounting journal entries</p>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search entries..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-grow md:justify-end">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Entries
              </Button>
              <Dialog open={isNewEntryModalOpen} onOpenChange={setIsNewEntryModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Journal Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Create Journal Entry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entry-date">Entry Date</Label>
                        <DatePicker 
                          date={entryDate} 
                          onSelect={setEntryDate} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reference">Reference Number (Optional)</Label>
                        <Input id="reference" placeholder="e.g., INV-12345" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Enter description..." />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Entry Lines</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Debit (₵)</TableHead>
                              <TableHead className="text-right">Credit (₵)</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entryLines.map((line) => (
                              <TableRow key={line.id}>
                                <TableCell>
                                  <Select 
                                    value={line.account_id} 
                                    onValueChange={(value) => updateEntryLine(line.id, "account_id", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {dummyAccounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>
                                          {account.code} - {account.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    placeholder="Line description" 
                                    value={line.description || ""}
                                    onChange={(e) => updateEntryLine(line.id, "description", e.target.value)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="text-right"
                                    value={line.debit_amount || ""}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseFloat(e.target.value) : null;
                                      updateEntryLine(line.id, "debit_amount", value);
                                      if (value) {
                                        updateEntryLine(line.id, "credit_amount", null);
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="text-right"
                                    value={line.credit_amount || ""}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseFloat(e.target.value) : null;
                                      updateEntryLine(line.id, "credit_amount", value);
                                      if (value) {
                                        updateEntryLine(line.id, "debit_amount", null);
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeEntryLine(line.id)}
                                    disabled={entryLines.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <tfoot>
                            <tr>
                              <td colSpan={2} className="py-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={addEntryLine}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add Line
                                </Button>
                              </td>
                              <td className="py-2 text-right font-bold">
                                Total: ₵{totalDebit.toFixed(2)}
                              </td>
                              <td className="py-2 text-right font-bold">
                                Total: ₵{totalCredit.toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                            <tr>
                              <td colSpan={5} className="pt-2">
                                {!isBalanced && (
                                  <p className="text-red-500 text-sm">
                                    Entry is not balanced. Debit and credit totals must be equal.
                                  </p>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsNewEntryModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setIsNewEntryModalOpen(false)} 
                      disabled={!isBalanced}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      onClick={() => setIsNewEntryModalOpen(false)} 
                      disabled={!isBalanced}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Post Entry
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange}
              className="w-full"
              placeholder="Filter by date range"
              align="start"
            />
            
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
          <TabsTrigger value="posted">Posted</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit Total (₵)</TableHead>
                    <TableHead className="text-right">Credit Total (₵)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.entry_number}</TableCell>
                      <TableCell>{format(new Date(entry.entry_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell className="text-right">{entry.total_debit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{entry.total_credit.toLocaleString()}</TableCell>
                      <TableCell>
                        {entry.is_posted ? (
                          <Badge className="bg-green-500">Posted</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                        {entry.is_recurring && (
                          <Badge className="ml-2 bg-blue-500">Recurring</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No journal entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const JournalEntries = () => {
  return (
    <AuthGuard>
      <JournalEntriesPage />
    </AuthGuard>
  );
};

export default JournalEntries;
