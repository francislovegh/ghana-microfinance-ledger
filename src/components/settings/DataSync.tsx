
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import {
  CloudUpload,
  CloudOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";

// Define the tables that should be synced with offline storage
const SYNC_TABLES = [
  { name: "profiles", label: "Customer Data", size: "1.2 MB", records: 128 },
  { name: "savings_accounts", label: "Savings Accounts", size: "0.8 MB", records: 95 },
  { name: "transactions", label: "Transactions", size: "3.5 MB", records: 412 },
  { name: "loans", label: "Loans", size: "0.6 MB", records: 47 },
];

interface SyncStatus {
  table: string;
  label: string;
  lastSynced: string | null;
  status: 'success' | 'error' | 'pending' | 'offline';
  message?: string;
  size: string;
  records: number;
}

const DataSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [syncFrequency, setSyncFrequency] = useState<string>("hourly");
  const [syncAll, setSyncAll] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [lastFullSync, setLastFullSync] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    // Set up online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize sync statuses with local storage data if available
    initializeSyncStatuses();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const initializeSyncStatuses = () => {
    const storedSyncData = localStorage.getItem("syncStatuses");
    let initialStatuses: SyncStatus[] = [];
    
    if (storedSyncData) {
      try {
        initialStatuses = JSON.parse(storedSyncData);
      } catch (error) {
        console.error("Error parsing stored sync data:", error);
      }
    }
    
    // If no stored data or invalid stored data, initialize with default values
    if (!initialStatuses.length) {
      initialStatuses = SYNC_TABLES.map(table => ({
        table: table.name,
        label: table.label,
        lastSynced: null,
        status: 'pending',
        size: table.size,
        records: table.records,
      }));
    }
    
    setSyncStatuses(initialStatuses);
    
    // Check if we have a record of last full sync
    const storedLastSync = localStorage.getItem("lastFullSync");
    if (storedLastSync) {
      setLastFullSync(storedLastSync);
    }
  };
  
  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked);
    // Save preference to localStorage
    localStorage.setItem("autoSync", JSON.stringify(checked));
    
    toast({
      title: checked ? "Auto Sync Enabled" : "Auto Sync Disabled",
      description: checked 
        ? "Your data will automatically sync when online" 
        : "Automatic syncing has been turned off",
    });
  };
  
  const handleSyncAll = async () => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Cannot sync data while offline. Please check your connection.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncing(true);
    
    // Update all statuses to pending
    setSyncStatuses(prev => 
      prev.map(status => ({
        ...status,
        status: 'pending',
      }))
    );
    
    // Simulate sync process for each table with slight delay between them
    for (let i = 0; i < syncStatuses.length; i++) {
      const status = syncStatuses[i];
      
      try {
        // Update current table status to simulate progress
        setSyncStatuses(prev => 
          prev.map((s, idx) => 
            idx === i ? { ...s, status: 'pending', message: "Syncing..." } : s
          )
        );
        
        // Simulate network operation with random success/failure
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Randomly succeed or fail for demo purposes, with 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
          // Update status to success
          setSyncStatuses(prev => 
            prev.map((s, idx) => 
              idx === i ? { 
                ...s, 
                status: 'success', 
                lastSynced: new Date().toISOString(),
                message: `Successfully synced ${s.records} records`
              } : s
            )
          );
        } else {
          // Update status to error
          setSyncStatuses(prev => 
            prev.map((s, idx) => 
              idx === i ? { 
                ...s, 
                status: 'error', 
                message: "Error syncing data. Will retry later." 
              } : s
            )
          );
        }
      } catch (error) {
        // Handle real errors
        setSyncStatuses(prev => 
          prev.map((s, idx) => 
            idx === i ? { 
              ...s, 
              status: 'error', 
              message: "Unexpected error occurred" 
            } : s
          )
        );
      }
    }
    
    const now = new Date().toISOString();
    setLastFullSync(now);
    localStorage.setItem("lastFullSync", now);
    
    // Save updated sync statuses to localStorage
    localStorage.setItem("syncStatuses", JSON.stringify(syncStatuses));
    
    setIsSyncing(false);
    
    toast({
      title: "Sync Complete",
      description: "All data has been synchronized with the cloud",
    });
  };
  
  const handleSyncTable = async (tableIndex: number) => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Cannot sync data while offline. Please check your connection.",
        variant: "destructive",
      });
      return;
    }
    
    const tableStatus = syncStatuses[tableIndex];
    
    // Update status to pending
    setSyncStatuses(prev => 
      prev.map((s, idx) => 
        idx === tableIndex ? { ...s, status: 'pending', message: "Syncing..." } : s
      )
    );
    
    try {
      // Simulate network operation
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // For demo, always succeed on manual single table sync
      setSyncStatuses(prev => 
        prev.map((s, idx) => 
          idx === tableIndex ? { 
            ...s, 
            status: 'success', 
            lastSynced: new Date().toISOString(),
            message: `Successfully synced ${s.records} records`
          } : s
        )
      );
      
      // Save updated sync statuses to localStorage
      localStorage.setItem("syncStatuses", JSON.stringify(syncStatuses));
      
      toast({
        title: "Table Synced",
        description: `${tableStatus.label} has been synchronized with the cloud`,
      });
    } catch (error) {
      // Handle real errors
      setSyncStatuses(prev => 
        prev.map((s, idx) => 
          idx === tableIndex ? { 
            ...s, 
            status: 'error', 
            message: "Unexpected error occurred" 
          } : s
        )
      );
      
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${tableStatus.label}. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  const getStatusIcon = (status: 'success' | 'error' | 'pending' | 'offline') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'offline':
        return <CloudOff className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };
  
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    
    return `${Math.floor(seconds)} seconds ago`;
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium">Data Synchronization</h2>
          <p className="text-gray-600 mt-1">Manage offline and online data synchronization</p>
        </div>
        
        <div className="flex items-center">
          {isOnline ? (
            <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </Badge>
          ) : (
            <Badge className="flex items-center gap-1 bg-red-100 text-red-800 border-red-200">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
        </div>
      </div>
      
      <div className="border rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={handleAutoSyncToggle}
            />
            <Label htmlFor="auto-sync">Enable Automatic Syncing</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              className="px-2 py-1 border rounded text-sm"
              value={syncFrequency}
              onChange={(e) => setSyncFrequency(e.target.value)}
              disabled={!autoSync}
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <Label htmlFor="sync-frequency" className="text-sm">Sync Frequency</Label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="sync-all"
            checked={syncAll}
            onCheckedChange={setSyncAll}
            disabled={!autoSync}
          />
          <Label htmlFor="sync-all">Sync all data (uncheck to select specific tables)</Label>
        </div>
      </div>
      
      <div className="border rounded-md mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-medium">Data Tables</h3>
          <div className="text-sm text-gray-500">
            {lastFullSync ? (
              <>Last full sync: {formatTimeAgo(lastFullSync)}</>
            ) : (
              <>No sync history</>
            )}
          </div>
        </div>
        
        <div className="divide-y">
          {syncStatuses.map((status, index) => (
            <div key={status.table} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  {getStatusIcon(status.status)}
                </div>
                <div>
                  <div className="font-medium">{status.label}</div>
                  <div className="text-xs text-gray-500">
                    {status.lastSynced ? (
                      <>Last synced: {formatTimeAgo(status.lastSynced)}</>
                    ) : (
                      <>Never synced</>
                    )}
                  </div>
                  {status.message && (
                    <div className="text-xs mt-1">
                      {status.message}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="text-gray-500 text-right">
                  <div>{status.size}</div>
                  <div>{status.records} records</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600"
                  onClick={() => handleSyncTable(index)}
                  disabled={isSyncing || !isOnline}
                >
                  <RefreshCw className={`h-4 w-4 ${status.status === 'pending' ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
          onClick={handleSyncAll}
          disabled={isSyncing || !isOnline}
        >
          {isSyncing ? (
            <>
              <LoadingSpinner className="mr-2" />
              Syncing...
            </>
          ) : (
            <>
              <CloudUpload className="mr-2 h-5 w-5" />
              Sync All Data Now
            </>
          )}
        </Button>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        {isOnline ? (
          <>
            Your data will be securely synchronized with the cloud server.<br />
            Any changes made while offline will be uploaded when you connect.
          </>
        ) : (
          <>
            You are currently offline. Your data is safely stored on this device.<br />
            Changes will be synchronized once you're back online.
          </>
        )}
      </div>
    </Card>
  );
};

export default DataSync;
