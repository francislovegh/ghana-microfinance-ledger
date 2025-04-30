
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
import { Search, Plus, FileDown, FilePlus } from "lucide-react";
import { AccountCategory, ChartOfAccountItem } from "@/types/app";
import AuthGuard from "@/components/auth/AuthGuard";

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
    id: "5",
    code: "3000",
    name: "Retained Earnings",
    category: "equity",
    description: "Accumulated earnings retained in the business",
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
    id: "7",
    code: "4100",
    name: "Penalty Income",
    category: "income",
    description: "Revenue from late payment penalties",
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
  },
  {
    id: "10",
    code: "5200",
    name: "Loan Loss Provision",
    category: "expense",
    description: "Provisions for potential loan defaults",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const ChartOfAccountsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  
  const filteredAccounts = dummyAccounts.filter(account => {
    const matchesSearch = 
      account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || account.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: AccountCategory) => {
    switch (category) {
      case "asset":
        return <Badge className="bg-blue-500">Asset</Badge>;
      case "liability":
        return <Badge className="bg-orange-500">Liability</Badge>;
      case "equity":
        return <Badge className="bg-purple-500">Equity</Badge>;
      case "income":
        return <Badge className="bg-green-500">Income</Badge>;
      case "expense":
        return <Badge className="bg-red-500">Expense</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chart of Accounts</h1>
        <p className="text-gray-600">Manage your financial account structure</p>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search accounts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-grow md:justify-end">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Accounts
              </Button>
              <Dialog open={isNewAccountModalOpen} onOpenChange={setIsNewAccountModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account-code">Account Code</Label>
                        <Input id="account-code" placeholder="e.g., 1000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account-category">Category</Label>
                        <Select>
                          <SelectTrigger id="account-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asset">Asset</SelectItem>
                            <SelectItem value="liability">Liability</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="account-name">Account Name</Label>
                      <Input id="account-name" placeholder="e.g., Cash on Hand" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="account-description">Description</Label>
                      <Textarea id="account-description" placeholder="Enter account description..." />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parent-account">Parent Account (Optional)</Label>
                      <Select>
                        <SelectTrigger id="parent-account">
                          <SelectValue placeholder="Select parent account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {dummyAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsNewAccountModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsNewAccountModalOpen(false)}>
                      Create Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={categoryFilter === "all" ? "default" : "outline"} 
              onClick={() => setCategoryFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={categoryFilter === "asset" ? "default" : "outline"} 
              onClick={() => setCategoryFilter("asset")}
              size="sm"
              className="text-blue-700"
            >
              Assets
            </Button>
            <Button 
              variant={categoryFilter === "liability" ? "default" : "outline"} 
              onClick={() => setCategoryFilter("liability")}
              size="sm"
              className="text-orange-700"
            >
              Liabilities
            </Button>
            <Button 
              variant={categoryFilter === "equity" ? "default" : "outline"} 
              onClick={() => setCategoryFilter("equity")}
              size="sm"
              className="text-purple-700"
            >
              Equity
            </Button>
            <Button 
              variant={categoryFilter === "income" ? "default" : "outline"} 
              onClick={() => setCategoryFilter("income")}
              size="sm"
              className="text-green-700"
            >
              Income
            </Button>
            <Button 
              variant={categoryFilter === "expense" ? "default" : "outline"} 
              onClick={() => setCategoryFilter("expense")}
              size="sm"
              className="text-red-700"
            >
              Expenses
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{getCategoryBadge(account.category)}</TableCell>
                  <TableCell className="max-w-xs truncate">{account.description}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No accounts found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
};

const ChartOfAccounts = () => {
  return (
    <AuthGuard>
      <ChartOfAccountsPage />
    </AuthGuard>
  );
};

export default ChartOfAccounts;
