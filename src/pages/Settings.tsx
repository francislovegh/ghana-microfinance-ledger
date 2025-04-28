
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, DatabaseBackup, Download, Users, UserPlus, Key } from "lucide-react";
import RoleManagement from "@/components/settings/RoleManagement";
import DataSync from "@/components/settings/DataSync";
import BackupSettings from "@/components/settings/BackupSettings";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure system settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 md:w-auto w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">General Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  defaultValue="Dinpa Microfinance"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter business address"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter business phone"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter business email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input
                  id="currency"
                  defaultValue="GHS (₵)"
                  disabled
                />
                <p className="text-sm text-gray-500">Contact support to change default currency</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="receipts" />
                <Label htmlFor="receipts">Automatically print receipts for transactions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="notifications" defaultChecked />
                <Label htmlFor="notifications">Enable system notifications</Label>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Reports Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report_header">Report Header</Label>
                <Input
                  id="report_header"
                  placeholder="Enter report header text"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report_footer">Report Footer</Label>
                <Input
                  id="report_footer"
                  placeholder="Enter report footer text"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="show_logo" defaultChecked />
                <Label htmlFor="show_logo">Show company logo on reports</Label>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        {/* Roles Management */}
        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>
        
        {/* Data Sync */}
        <TabsContent value="sync">
          <DataSync />
        </TabsContent>
        
        {/* Backup Settings */}
        <TabsContent value="backup">
          <BackupSettings />
        </TabsContent>
        
        {/* About */}
        <TabsContent value="about">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-700">Dinpa Microfinance</h2>
              <p className="text-gray-600 mt-1">Version 1.0.0</p>
            </div>
            
            <div className="text-center mb-8">
              <p>Microfinance Management System</p>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium mb-2">Features:</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Customer Management</li>
                <li>Savings Accounts</li>
                <li>Loan Processing</li>
                <li>Transaction Management</li>
                <li>Reporting</li>
                <li>User Roles & Permissions</li>
                <li>Data Backup & Sync</li>
              </ul>
            </div>
            
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="text-center">
                <p>Powered by Neolifeporium | Lovable</p>
                <p className="mt-1">Made with ❤ by George Asiedu Annan</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const Settings = () => {
  return (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  );
};

export default Settings;
