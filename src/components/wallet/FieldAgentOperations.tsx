
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface FieldAgent {
  id: string;
  full_name: string;
  phone_number: string;
}

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  account_number?: string;
}

interface CollectionTransaction {
  id: string;
  transaction_number: string;
  amount: number;
  agent_name: string;
  customer_name: string;
  created_at: string;
  status: string;
}

const FieldAgentOperations = () => {
  const [agents, setAgents] = useState<FieldAgent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [collections, setCollections] = useState<CollectionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
    fetchCustomers();
    fetchCollections();
  }, []);

  const fetchAgents = async () => {
    try {
      setAgentsLoading(true);
      // In a real app, we would filter profiles by role to get only field agents
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('role', 'field_agent')
        .order('full_name');
        
      if (error) throw error;
      
      // If no field agents exist, use staff members for demo purposes
      if (data && data.length === 0) {
        const { data: staffData, error: staffError } = await supabase
          .from('profiles')
          .select('id, full_name, phone_number')
          .neq('role', 'customer')  // Any non-customer will do
          .order('full_name')
          .limit(5);
          
        if (staffError) throw staffError;
        setAgents(staffData as FieldAgent[] || []);
      } else {
        setAgents(data as FieldAgent[] || []);
      }
    } catch (error) {
      console.error('Error fetching field agents:', error);
      toast({
        title: "Error",
        description: "Failed to load field agents",
        variant: "destructive",
      });
    } finally {
      setAgentsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          phone_number,
          savings_accounts(account_number)
        `)
        .eq('role', 'customer')
        .order('full_name');
        
      if (error) throw error;
      
      const processedCustomers = data.map(customer => ({
        id: customer.id,
        full_name: customer.full_name,
        phone_number: customer.phone_number,
        account_number: customer.savings_accounts?.[0]?.account_number
      }));
      
      setCustomers(processedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          amount,
          created_at,
          status,
          metadata,
          performed_by_profile:profiles!transactions_performed_by_fkey(full_name)
        `)
        .eq('transaction_type', 'deposit')
        .eq('payment_method', 'cash')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error in query:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned');
        throw new Error('No data returned from query');
      }
      
      const processedCollections = data.map(transaction => {
        return {
          id: transaction.id,
          transaction_number: transaction.transaction_number,
          amount: transaction.amount,
          agent_name: transaction.performed_by_profile?.full_name || 'Unknown',
          customer_name: 'Customer', // Using a placeholder since we don't have customer info
          created_at: transaction.created_at,
          status: transaction.status || 'completed'
        };
      });
      
      setCollections(processedCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error",
        description: "Failed to load collection history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleSubmitCollection = async () => {
    if (!selectedAgent || !selectedCustomer || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      
      const agent = agents.find(a => a.id === selectedAgent);
      const customer = customers.find(c => c.id === selectedCustomer);
      
      if (!agent || !customer) {
        throw new Error("Invalid agent or customer selection");
      }
      
      // Generate transaction number
      const { data: transactionNumber, error: numberError } = await supabase
        .rpc('generate_transaction_number');
      
      if (numberError) throw numberError;
      
      // Create deposit transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: customer.id,
          amount: amount,
          transaction_type: 'deposit',
          payment_method: 'cash',
          transaction_number: transactionNumber,
          reference_number: reference || undefined,
          description: description || `Field collection from ${customer.full_name} by ${agent.full_name}`,
          performed_by: agent.id,
          status: "completed"
        });
        
      if (transactionError) throw transactionError;
      
      // If customer has a savings account, update its balance
      if (customer.account_number) {
        const { data: account, error: accountError } = await supabase
          .from('savings_accounts')
          .select('id, balance')
          .eq('user_id', customer.id)
          .single();
          
        if (!accountError && account) {
          await supabase
            .from('savings_accounts')
            .update({ balance: account.balance + amount })
            .eq('id', account.id);
        }
      }

      toast({
        title: "Collection Recorded",
        description: `Collection of ₵${amount} from ${customer.full_name} has been recorded successfully`,
      });
      
      setIsDialogOpen(false);
      resetForm();
      fetchCollections();
      
    } catch (error) {
      console.error('Error recording collection:', error);
      toast({
        title: "Transaction Failed",
        description: "An error occurred while recording the collection",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedAgent("");
    setSelectedCustomer("");
    setAmount(0);
    setReference("");
    setLocation("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Field Agent Cash Collections</h2>
          
          <div>
            <Button onClick={handleOpenDialog}>
              Record Field Collection
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction No</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : collections.length > 0 ? (
                collections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">
                      {collection.transaction_number.slice(-6)}
                    </TableCell>
                    <TableCell>{collection.agent_name}</TableCell>
                    <TableCell>{collection.customer_name}</TableCell>
                    <TableCell>₵{collection.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">
                        {collection.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(collection.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No field collections recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Field Collection</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agent">Field Agent</Label>
              <Select
                value={selectedAgent}
                onValueChange={setSelectedAgent}
              >
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Select field agent" />
                </SelectTrigger>
                <SelectContent>
                  {agentsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading agents...
                    </SelectItem>
                  ) : agents.length > 0 ? (
                    agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.phone_number})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No field agents available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name} ({customer.phone_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount Collected (₵)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="Collection location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reference">Receipt Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="Receipt or reference number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Notes (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional notes about this collection"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitCollection} disabled={processing}>
              {processing ? "Processing..." : "Record Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldAgentOperations;
