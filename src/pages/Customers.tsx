
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash } from "lucide-react";
import CustomerModal from "@/components/customers/CustomerModal";
import DeleteConfirmationModal from "@/components/customers/DeleteConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { IdType } from "@/types/app";

// Update Customer type to use IdType
interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  id_type: IdType | null;
  id_number: string | null;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setCustomers(data as Customer[]);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer: Customer | null = null) => {
    // Later in the component where the type error occurs, cast the id_type to IdType
    if (customer) {
      setSelectedCustomer({
        ...customer,
        id_type: customer.id_type as IdType
      });
    } else {
      setSelectedCustomer(null);
    }
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleCreateOrUpdateCustomer = async (customerData: any) => {
    setIsModalOpen(false);
    
    try {
      if (selectedCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("profiles")
          .update(customerData)
          .eq("id", selectedCustomer.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        // Create new customer
        const { error } = await supabase
          .from("profiles")
          .insert({ ...customerData, role: "customer" });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
      }
      
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    setIsDeleteModalOpen(false);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedCustomer.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => 
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage customer accounts and information</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2"
        >
          <Plus size={18} /> Add Customer
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-2" size={20} />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-700 bg-gray-50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">ID Type</th>
                <th className="px-4 py-3">ID Number</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center">No customers found</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{customer.full_name}</td>
                    <td className="px-4 py-3">{customer.phone_number}</td>
                    <td className="px-4 py-3">{customer.email || "N/A"}</td>
                    <td className="px-4 py-3">{customer.address || "N/A"}</td>
                    <td className="px-4 py-3">{customer.id_type || "N/A"}</td>
                    <td className="px-4 py-3">{customer.id_number || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenModal(customer)}
                        >
                          <Edit size={16} className="text-blue-600" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDeleteModal(customer)}
                        >
                          <Trash size={16} className="text-red-600" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOrUpdateCustomer}
        customer={selectedCustomer}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCustomer}
        customerName={selectedCustomer?.full_name || ""}
      />
    </AppLayout>
  );
};

const Customers = () => {
  return (
    <AuthGuard>
      <CustomersPage />
    </AuthGuard>
  );
};

export default Customers;
