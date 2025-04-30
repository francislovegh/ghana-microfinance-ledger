
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletOverview from "@/components/wallet/WalletOverview";
import DepositWithdrawal from "@/components/wallet/DepositWithdrawal";
import TransferFunds from "@/components/wallet/TransferFunds";
import MobileMoneyIntegration from "@/components/wallet/MobileMoneyIntegration";
import BankIntegration from "@/components/wallet/BankIntegration";
import FieldAgentOperations from "@/components/wallet/FieldAgentOperations";

const Wallet = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Wallet & Transactions</h1>
        <p className="text-gray-600">Manage deposits, withdrawals, transfers and integrations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposit-withdraw">Deposit/Withdraw</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="mobile-money">Mobile Money</TabsTrigger>
          <TabsTrigger value="bank">Bank Transfers</TabsTrigger>
          <TabsTrigger value="field-agent">Field Agents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <WalletOverview />
        </TabsContent>
        
        <TabsContent value="deposit-withdraw" className="space-y-4">
          <DepositWithdrawal />
        </TabsContent>
        
        <TabsContent value="transfer" className="space-y-4">
          <TransferFunds />
        </TabsContent>
        
        <TabsContent value="mobile-money" className="space-y-4">
          <MobileMoneyIntegration />
        </TabsContent>
        
        <TabsContent value="bank" className="space-y-4">
          <BankIntegration />
        </TabsContent>
        
        <TabsContent value="field-agent" className="space-y-4">
          <FieldAgentOperations />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Wallet;
