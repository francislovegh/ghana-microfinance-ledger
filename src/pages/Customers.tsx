
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Edit, Trash2, Phone, MailIcon, UserCheck } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import CustomerModal from "@/components/customers/CustomerModal";
import DeleteConfirmationModal from "@/components/customers/DeleteConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { IdType } from "@/types/app";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  is_verified: boolean;
  id_type: IdType | null;
  id_number: string | null;
  date_of_birth: string | null;
  role: string;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("full_name");

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
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer({
      ...customer,
      id_type: customer.id_type as IdType // Cast to IdType
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleDeleteCustomer = async (): Promise<void> => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", customerToDelete.id);

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
    } finally {
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleCustomerSaved = () => {
    setIsModalOpen(false);
    fetchCustomers();
    toast({
      title: "Success",
      description: selectedCustomer ? "Customer updated successfully" : "Customer created successfully",
    });
  };

  const filteredCustomers = customers.filter((customer) => 
    customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone_number.includes(searchQuery) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.id_number && customer.id_number.includes(searchQuery))
  );

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Button 
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <UserPlus size={18} />
          Add New Customer
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, phone, email or ID number..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Identification</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array(5).fill(null).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="bg-white">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-32 mt-1" />
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? "No customers matching your search" : "No customers found"}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{customer.full_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          <span>{customer.phone_number}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MailIcon size={12} />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {customer.id_type ? (
                          <>
                            <div className="text-sm font-medium">
                              {customer.id_type.replace("_", " ").toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.id_number || "N/A"}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">No ID on file</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {customer.is_verified ? (
                          <Badge className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                            <UserCheck size={12} />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                            Unverified
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(customer)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(customer)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
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
      </Card>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleCustomerSaved}
        customer={selectedCustomer}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteCustomer}
        customerName={customerToDelete?.full_name || ""}
      />
    </AppLayout>
  );
};

const Customers = () => (
  <AuthGuard>
    <CustomersPage />
  </AuthGuard>
);

export default Customers;
