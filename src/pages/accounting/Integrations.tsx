
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Download, FileSpreadsheet, RefreshCcw, UploadCloud, Clock, ExternalLink } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

const AccountingIntegrationsPage = () => {
  const [activeTab, setActiveTab] = useState("quickbooks");
  const [isConnected, setIsConnected] = useState({
    quickbooks: false,
    xero: false,
    excel: true
  });
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  const handleConnect = (provider: string) => {
    setIsConnected({
      ...isConnected,
      [provider]: true
    });
  };

  const handleDisconnect = (provider: string) => {
    setIsConnected({
      ...isConnected,
      [provider]: false
    });
  };

  const startSync = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setShowSyncDialog(true);

    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 800);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Accounting Integrations</h1>
        <p className="text-gray-600">Connect and sync with external accounting software</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="quickbooks">QuickBooks Online</TabsTrigger>
          <TabsTrigger value="xero">Xero</TabsTrigger>
          <TabsTrigger value="excel">Excel/CSV Export</TabsTrigger>
          <TabsTrigger value="api">Custom API</TabsTrigger>
        </TabsList>

        {/* QuickBooks Online Integration */}
        <TabsContent value="quickbooks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="4" fill="#2CA01C" />
                      <path d="M8 16.25C8 12.79 10.79 10 14.25 10H17.75C21.21 10 24 12.79 24 16.25C24 19.71 21.21 22.5 17.75 22.5H14.25C10.79 22.5 8 19.71 8 16.25Z" fill="white" />
                      <path d="M14 16.25C14 14.18 15.68 12.5 17.75 12.5C19.82 12.5 21.5 14.18 21.5 16.25C21.5 18.32 19.82 20 17.75 20C15.68 20 14 18.32 14 16.25Z" fill="#2CA01C" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>QuickBooks Online Integration</CardTitle>
                    <CardDescription>Sync transactions, journal entries, and accounts with QuickBooks</CardDescription>
                  </div>
                </div>
                <Badge className={isConnected.quickbooks ? "bg-green-500" : "bg-gray-300"}>
                  {isConnected.quickbooks ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Connection Settings</h3>
                  {isConnected.quickbooks ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Connected Account</p>
                          <p className="text-sm text-gray-500">Dinpa Microfinance Ltd.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => handleDisconnect('quickbooks')}
                        >
                          Disconnect
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Last Sync</p>
                          <p className="text-sm text-gray-500">Today, 10:23 AM</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Sync Frequency</p>
                          <p className="text-sm text-gray-500">Daily</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="auto-sync" checked />
                        <Label htmlFor="auto-sync">Enable automatic synchronization</Label>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="mb-4 text-gray-500">Connect your QuickBooks Online account to automatically sync transactions</p>
                      <Button onClick={() => handleConnect('quickbooks')}>
                        Connect to QuickBooks
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="border p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Sync Options</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="sync-journal" disabled={!isConnected.quickbooks} />
                      <Label htmlFor="sync-journal">Sync journal entries</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="sync-chart" checked disabled={!isConnected.quickbooks} />
                      <Label htmlFor="sync-chart">Sync chart of accounts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="sync-customers" checked disabled={!isConnected.quickbooks} />
                      <Label htmlFor="sync-customers">Sync customers and vendors</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Dialog open={showSyncDialog && activeTab === "quickbooks"} onOpenChange={setShowSyncDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Syncing with QuickBooks</DialogTitle>
                  </DialogHeader>
                  <div className="py-6">
                    <Progress value={syncProgress} className="mb-4" />
                    <p className="text-center text-gray-500">
                      {isSyncing ? 'Syncing data...' : 'Sync completed successfully!'}
                    </p>
                    {!isSyncing && syncProgress === 100 && (
                      <div className="flex items-center justify-center mt-4">
                        <Check className="text-green-500 mr-2" />
                        <span>All data has been synchronized</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowSyncDialog(false)} disabled={isSyncing}>
                      {isSyncing ? 'Please wait...' : 'Close'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline"
                onClick={startSync}
                disabled={!isConnected.quickbooks}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Sync Now
              </Button>
              <Button 
                onClick={() => window.open('#', '_blank')}
                disabled={!isConnected.quickbooks}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open QuickBooks
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Xero Integration */}
        <TabsContent value="xero">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="4" fill="#13B5EA" />
                      <path d="M16 8C11.58 8 8 11.58 8 16C8 20.42 11.58 24 16 24C20.42 24 24 20.42 24 16C24 11.58 20.42 8 16 8ZM16 22C12.69 22 10 19.31 10 16C10 12.69 12.69 10 16 10C19.31 10 22 12.69 22 16C22 19.31 19.31 22 16 22Z" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>Xero Integration</CardTitle>
                    <CardDescription>Connect your financial data with Xero accounting software</CardDescription>
                  </div>
                </div>
                <Badge className={isConnected.xero ? "bg-green-500" : "bg-gray-300"}>
                  {isConnected.xero ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Xero integration is currently under development. This feature will be available in the next update.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button disabled>
                Join Waiting List
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Excel/CSV Export */}
        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FileSpreadsheet size={32} className="text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Excel/CSV Export</CardTitle>
                    <CardDescription>Export accounting data to Excel or CSV format for external processing</CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500">Available</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">General Ledger</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">Export complete general ledger with all transactions</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Ledger
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Chart of Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">Export account structure and hierarchies</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Accounts
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Statements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">Export balance sheet, income statement and cash flow</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Statements
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tax Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">Export data formatted for tax filing and compliance</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Tax Data
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium mb-4">Upload Data</h3>
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-2">Drag & drop CSV or Excel files here</p>
                    <p className="text-xs text-gray-400 mb-4">Or click the button below</p>
                    <Button size="sm">Select File</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom API Integration */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>Connect to our API for custom integrations with your systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">API Keys</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex gap-2">
                      <Input id="api-key" value="••••••••••••••••••••••••••••••" readOnly className="font-mono" />
                      <Button variant="outline" size="sm">Show</Button>
                      <Button variant="outline" size="sm">Regenerate</Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="api-enable" checked />
                    <Label htmlFor="api-enable">API Access Enabled</Label>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Webhook Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input id="webhook-url" placeholder="https://your-system.com/webhook" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input id="webhook-secret" value="••••••••••••••••••••••••••••••" readOnly className="font-mono" />
                      <Button variant="outline" size="sm">Show</Button>
                      <Button variant="outline" size="sm">Regenerate</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Events to Send</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="event-transactions" checked />
                    <Label htmlFor="event-transactions">Transactions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="event-journals" checked />
                    <Label htmlFor="event-journals">Journal Entries</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="event-accounts" />
                    <Label htmlFor="event-accounts">Account Changes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="event-customers" />
                    <Label htmlFor="event-customers">Customer Changes</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const AccountingIntegrations = () => {
  return (
    <AuthGuard>
      <AccountingIntegrationsPage />
    </AuthGuard>
  );
};

export default AccountingIntegrations;
