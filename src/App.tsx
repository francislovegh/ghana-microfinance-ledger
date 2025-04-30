import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Customers from "./pages/Customers";
import Savings from "./pages/Savings";
import Loans from "./pages/Loans";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/auth/AuthGuard";
// Accounting module pages
import AccountingLedger from "./pages/accounting/Ledger";
import ChartOfAccounts from "./pages/accounting/ChartOfAccounts";
import JournalEntries from "./pages/accounting/JournalEntries";
import AccountingReports from "./pages/accounting/Reports";
import AccountingIntegrations from "./pages/accounting/Integrations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <AuthGuard>
                <Index />
              </AuthGuard>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <AuthGuard>
                <Customers />
              </AuthGuard>
            } 
          />
          <Route 
            path="/savings" 
            element={
              <AuthGuard>
                <Savings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/loans" 
            element={
              <AuthGuard>
                <Loans />
              </AuthGuard>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <AuthGuard>
                <Transactions />
              </AuthGuard>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <AuthGuard>
                <Reports />
              </AuthGuard>
            } 
          />
          
          {/* Settings Routes */}
          <Route 
            path="/settings" 
            element={
              <AuthGuard>
                <Settings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/roles" 
            element={
              <AuthGuard>
                <Settings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/sync" 
            element={
              <AuthGuard>
                <Settings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/backup" 
            element={
              <AuthGuard>
                <Settings />
              </AuthGuard>
            } 
          />
          
          {/* Accounting Module Routes */}
          <Route 
            path="/accounting/ledger" 
            element={
              <AuthGuard>
                <AccountingLedger />
              </AuthGuard>
            } 
          />
          <Route 
            path="/accounting/chart-of-accounts" 
            element={
              <AuthGuard>
                <ChartOfAccounts />
              </AuthGuard>
            } 
          />
          <Route 
            path="/accounting/journal-entries" 
            element={
              <AuthGuard>
                <JournalEntries />
              </AuthGuard>
            } 
          />
          <Route 
            path="/accounting/reports" 
            element={
              <AuthGuard>
                <AccountingReports />
              </AuthGuard>
            } 
          />
          <Route 
            path="/accounting/integrations" 
            element={
              <AuthGuard>
                <AccountingIntegrations />
              </AuthGuard>
            } 
          />
          
          {/* Other Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
