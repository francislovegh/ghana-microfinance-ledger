
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserPlus, Users, Edit, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "@/components/customers/DeleteConfirmationModal";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Admin",
      description: "Full system access",
      permissions: ["all"]
    },
    {
      id: "2",
      name: "Teller",
      description: "Handle transactions and customer accounts",
      permissions: ["transactions", "savings", "customers_view"]
    },
    {
      id: "3",
      name: "Loan Officer",
      description: "Process loan applications and repayments",
      permissions: ["loans", "customers_view"]
    },
    {
      id: "4",
      name: "Field Agent",
      description: "Customer acquisition and basic view access",
      permissions: ["customers_view"]
    }
  ]);
  
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: "all", name: "All Permissions", description: "Full system access" },
    { id: "customers_view", name: "View Customers", description: "Can view customer information" },
    { id: "customers_edit", name: "Edit Customers", description: "Can create and edit customer information" },
    { id: "savings", name: "Savings Management", description: "Can manage savings accounts and transactions" },
    { id: "loans", name: "Loans Management", description: "Can manage loan applications and repayments" },
    { id: "transactions", name: "Transactions", description: "Can process and view transactions" },
    { id: "reports", name: "Reports", description: "Can view and generate reports" },
    { id: "settings", name: "Settings", description: "Can modify system settings" },
    { id: "users", name: "User Management", description: "Can manage system users" }
  ]);
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editedRole, setEditedRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .not("role", "eq", "customer");
        
      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoleEdit = (role: Role) => {
    setSelectedRole(role);
    setEditedRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsRoleModalOpen(true);
  };
  
  const handleRoleAdd = () => {
    setSelectedRole(null);
    setEditedRole({
      name: "",
      description: "",
      permissions: []
    });
    setIsRoleModalOpen(true);
  };
  
  const handleRoleDelete = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };
  
  const saveRole = () => {
    if (!editedRole.name) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedRole) {
      // Update existing role
      const updatedRoles = roles.map(r => 
        r.id === selectedRole.id ? 
          { ...r, name: editedRole.name, description: editedRole.description, permissions: editedRole.permissions } : 
          r
      );
      setRoles(updatedRoles);
      
      toast({
        title: "Role Updated",
        description: `"${editedRole.name}" role has been updated`,
      });
    } else {
      // Create new role
      const newRole: Role = {
        id: Math.random().toString(36).substring(2, 9),
        name: editedRole.name,
        description: editedRole.description,
        permissions: editedRole.permissions
      };
      setRoles([...roles, newRole]);
      
      toast({
        title: "Role Created",
        description: `"${editedRole.name}" role has been created`,
      });
    }
    
    setIsRoleModalOpen(false);
  };
  
  const deleteRole = () => {
    if (selectedRole) {
      const updatedRoles = roles.filter(r => r.id !== selectedRole.id);
      setRoles(updatedRoles);
      
      toast({
        title: "Role Deleted",
        description: `"${selectedRole.name}" role has been deleted`,
      });
      
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
    }
  };
  
  const handlePermissionChange = (permissionId: string) => {
    if (editedRole.permissions.includes(permissionId)) {
      setEditedRole({
        ...editedRole,
        permissions: editedRole.permissions.filter(id => id !== permissionId)
      });
    } else {
      // If "all" is selected, add all permissions
      if (permissionId === "all") {
        setEditedRole({
          ...editedRole,
          permissions: ["all"]
        });
      } else {
        // If another permission is selected, remove "all" if it exists
        const newPermissions = editedRole.permissions.includes("all") ?
          [permissionId] :
          [...editedRole.permissions, permissionId];
        
        setEditedRole({
          ...editedRole,
          permissions: newPermissions
        });
      }
    }
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">System Roles</h2>
              <Button onClick={handleRoleAdd} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.name !== "Admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleRoleDelete(role)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
        
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Staff Users</h2>
            
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <div key={user.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge role={user.role} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">No staff users found</p>
              )}
              
              <Button className="w-full" variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff User
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Role Edit/Create Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={(open) => !open && setIsRoleModalOpen(false)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedRole ? `Edit ${selectedRole.name} Role` : "Create New Role"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role_name">Role Name</Label>
                <Input
                  id="role_name"
                  value={editedRole.name}
                  onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })}
                  placeholder="Enter role name"
                  disabled={selectedRole?.name === "Admin"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role_description">Description</Label>
                <Input
                  id="role_description"
                  value={editedRole.description}
                  onChange={(e) => setEditedRole({ ...editedRole, description: e.target.value })}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Permissions</Label>
              
              <div className="border rounded-md p-4 space-y-4 max-h-[300px] overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={editedRole.permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionChange(permission.id)}
                      disabled={selectedRole?.name === "Admin" && permission.id === "all"}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveRole}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={selectedRole?.name === "Admin"}
              >
                {selectedRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={deleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the "${selectedRole?.name}" role? This action cannot be undone.`}
      />
    </>
  );
};

// Badge component to display user roles with appropriate styling
const Badge = ({ role }: { role: string }) => {
  const getBadgeColor = () => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "teller":
        return "bg-green-100 text-green-800 border-green-200";
      case "loan_officer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "field_agent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getBadgeColor()}`}>
      {role.replace("_", " ")}
    </span>
  );
};

export default RoleManagement;
