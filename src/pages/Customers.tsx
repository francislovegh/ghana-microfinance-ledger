
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerModal from "@/components/customers/CustomerModal";
import DeleteConfirmationModal from "@/components/customers/DeleteConfirmationModal";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  id_type: string | null;
  id_number: string | null;
  created_at: string | null;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("full_name");

      if (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Failed to fetch customers",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setCustomers(data || []);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedCustomer(null);
    setIsModalOpen(false);
  };

  const handleDeleteModalClose = () => {
    setSelectedCustomer(null);
    setIsDeleteModalOpen(false);
  };

  const handleCustomerSaved = () => {
    fetchCustomers();
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCustomerDeleted = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedCustomer.id);

      if (error) {
        toast({
          title: "Failed to delete customer",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
        fetchCustomers();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }

    setIsDeleteModalOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = searchQuery
    ? customers.filter(
        (customer) =>
          customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone_number.includes(searchQuery) ||
          (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : customers;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
        <p className="text-gray-600">Manage your customers and their details</p>
      </div>

      <Card className="mb-6">
        <div className="p-4 flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search customers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ID Type</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.full_name}</TableCell>
                    <TableCell>{customer.phone_number}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>
                      {customer.id_type ? customer.id_type.replace("_", " ").toUpperCase() : "-"}
                    </TableCell>
                    <TableCell>{customer.id_number || "-"}</TableCell>
                    <TableCell>
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(customer)}
                          className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchQuery
                      ? "No customers matching your search criteria"
                      : "No customers found. Add your first customer!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        onDelete={handleCustomerDeleted}
        title="Delete Customer"
        message={`Are you sure you want to delete ${selectedCustomer?.full_name}? This action cannot be undone.`}
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
