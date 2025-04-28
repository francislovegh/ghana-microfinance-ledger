
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  DatabaseBackup,
  Download,
  Calendar,
  Folder,
  Lock,
  CloudUpload,
  Database
} from "lucide-react";

interface BackupHistory {
  id: string;
  date: string;
  size: string;
  status: "completed" | "failed";
  type: "auto" | "manual";
}

const BackupSettings = () => {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [cloudBackup, setCloudBackup] = useState(true);
  const [backupLocation, setBackupLocation] = useState("google_drive");
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  
  const { toast } = useToast();
  
  // Sample backup history
  const backupHistory: BackupHistory[] = [
    { 
      id: "backup-1", 
      date: "2025-04-25 09:15:22", 
      size: "4.2 MB", 
      status: "completed",
      type: "auto"
    },
    { 
      id: "backup-2", 
      date: "2025-04-23 15:30:45", 
      size: "4.1 MB", 
      status: "completed",
      type: "auto"
    },
    { 
      id: "backup-3", 
      date: "2025-04-21 10:12:33", 
      size: "4.0 MB", 
      status: "completed",
      type: "manual"
    },
    { 
      id: "backup-4", 
      date: "2025-04-18 14:22:10", 
      size: "3.9 MB", 
      status: "failed",
      type: "auto"
    },
  ];
  
  const handleBackupNow = () => {
    setBackupInProgress(true);
    
    // Simulate backup process
    setTimeout(() => {
      setBackupInProgress(false);
      
      toast({
        title: "Backup Completed",
        description: "Your data has been successfully backed up",
      });
    }, 3000);
  };
  
  const handleRestoreBackup = (backupId: string) => {
    setRestoreInProgress(true);
    
    // Find the backup to restore
    const backup = backupHistory.find(b => b.id === backupId);
    
    // Simulate restore process
    setTimeout(() => {
      setRestoreInProgress(false);
      
      toast({
        title: "Restore Completed",
        description: `Database has been restored to ${new Date(backup?.date || "").toLocaleDateString()}`,
      });
    }, 4000);
  };
  
  const getCloudProviderIcon = (provider: string) => {
    switch (provider) {
      case "google_drive":
        return "Google Drive";
      case "dropbox":
        return "Dropbox";
      case "onedrive":
        return "OneDrive";
      default:
        return "Cloud Storage";
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-medium mb-4">Backup Settings</h2>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-backup"
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
                <Label htmlFor="auto-backup">Enable Automatic Backup</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={backupFrequency}
                  onValueChange={setBackupFrequency}
                  disabled={!autoBackup}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm">Backup Frequency</Label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="cloud-backup"
                  checked={cloudBackup}
                  onCheckedChange={setCloudBackup}
                />
                <Label htmlFor="cloud-backup">Enable Cloud Backup</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={backupLocation}
                  onValueChange={setBackupLocation}
                  disabled={!cloudBackup}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="dropbox">Dropbox</SelectItem>
                    <SelectItem value="onedrive">OneDrive</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm">Cloud Provider</Label>
              </div>
            </div>
            
            {cloudBackup && (
              <div className="border rounded-md p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_email">Cloud Account</Label>
                    <Input
                      id="account_email"
                      value="user@example.com"
                      placeholder="Your cloud account email"
                      readOnly
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="folder_path">Backup Folder</Label>
                    <div className="flex">
                      <Input
                        id="folder_path"
                        value="/Dinpa Microfinance/Backups"
                        placeholder="Backup folder path"
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none border-l-0">
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 flex items-center">
                  <Lock className="h-4 w-4 mr-1" />
                  Backups are encrypted before being uploaded to the cloud
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="retention">Backup Retention</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Backups older than this period will be automatically deleted
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
              onClick={handleBackupNow}
              disabled={backupInProgress}
            >
              {backupInProgress ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Backup in progress...
                </>
              ) : (
                <>
                  <DatabaseBackup className="mr-2 h-5 w-5" />
                  Backup Now
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // Simulate download action
                toast({
                  title: "Preparing Download",
                  description: "Your backup file is being prepared for download",
                });
              }}
            >
              <Download className="mr-2 h-5 w-5" />
              Download Latest Backup
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-medium mb-4">Backup History</h2>
        
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-5 bg-gray-50 px-4 py-2 border-b font-medium text-sm">
            <div>Date</div>
            <div>Type</div>
            <div>Size</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          
          <div className="divide-y">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="grid grid-cols-5 px-4 py-3 items-center text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {new Date(backup.date).toLocaleString()}
                </div>
                
                <div>
                  {backup.type === "auto" ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                      Automatic
                    </span>
                  ) : (
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                      Manual
                    </span>
                  )}
                </div>
                
                <div>{backup.size}</div>
                
                <div>
                  {backup.status === "completed" ? (
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                      Completed
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                      Failed
                    </span>
                  )}
                </div>
                
                <div className="text-right space-x-2">
                  {backup.status === "completed" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={restoreInProgress}
                      >
                        {restoreInProgress ? <LoadingSpinner size="sm" /> : "Restore"}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Cloud Storage Status</h2>
          
          <div className="flex items-center text-sm">
            <CloudUpload className="h-4 w-4 mr-1 text-blue-600" />
            <span className="mr-2">Connected to:</span>
            <span className="font-medium">{getCloudProviderIcon(backupLocation)}</span>
          </div>
        </div>
        
        <div className="mt-4 border rounded-md p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Storage Usage</div>
            <div>15.8 MB used of 15 GB</div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "0.1%" }}></div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-3 bg-white">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Total Backups</span>
              </div>
              <div className="text-2xl font-semibold">12</div>
            </div>
            
            <div className="border rounded p-3 bg-white">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <span className="font-medium">Last Backup</span>
              </div>
              <div className="text-sm">April 25, 2025 (09:15)</div>
            </div>
            
            <div className="border rounded p-3 bg-white">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Next Backup</span>
              </div>
              <div className="text-sm">April 26, 2025 (09:00)</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Simple Clock icon component
const Clock = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
};

export default BackupSettings;
