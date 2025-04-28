
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RoleManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Function to fetch users from the database
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Update the toggleUserStatus function to return a Promise
  const toggleUserStatus = async (userId: string): Promise<void> => {
    // Implement the function body, ensuring it returns a Promise
    try {
      const { data: user, error: fetchError } = await supabase
        .from("profiles")
        .select("is_verified")
        .eq("id", userId)
        .single();
        
      if (fetchError) {
        toast({
          title: "Error",
          description: "Failed to fetch user status",
          variant: "destructive",
        });
        return;
      }
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_verified: !user.is_verified })
        .eq("id", userId);
        
      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to update user status",
          variant: "destructive",
        });
        return;
      }
      
      // Refresh the users list
      fetchUsers();
      
      toast({
        title: "Success",
        description: `User ${user.is_verified ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">User & Role Management</h2>
        <p className="text-gray-600">Manage user accounts and role assignments</p>
      </div>
      
      <div className="mb-6">
        <Input 
          placeholder="Search users by name, email or phone..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">User Name</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                    {searchQuery ? "No users matching your search" : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{user.full_name || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div>{user.email || "N/A"}</div>
                      <div className="text-gray-500 text-xs">{user.phone_number || "No phone"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role || "Customer"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.is_verified ? "success" : "destructive"}>
                        {user.is_verified ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.is_verified ? "Deactivate" : "Activate"}
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
  );
};

export default RoleManagement;
