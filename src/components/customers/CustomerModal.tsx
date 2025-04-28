import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type IdType = "ghana_card" | "voter_id" | "passport" | "none";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  id_type: IdType | null;
  id_number: string | null;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customer: Customer | null;
}

interface FormValues {
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  id_type: IdType;
  id_number: string;
}

const CustomerModal = ({ isOpen, onClose, onSave, customer }: CustomerModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const defaultValues: FormValues = {
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
    id_type: "none",
    id_number: "",
  };

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (customer) {
      setValue("full_name", customer.full_name);
      setValue("phone_number", customer.phone_number);
      setValue("email", customer.email || "");
      setValue("address", customer.address || "");
      setValue("id_type", (customer.id_type as IdType) || "none");
      setValue("id_number", customer.id_number || "");
    } else {
      reset(defaultValues);
    }
  }, [customer, reset, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Handle empty strings for optional fields
      const customerData = {
        ...data,
        role: "customer" as const,
        email: data.email || null,
        address: data.address || null,
        id_type: data.id_type === "none" ? null : data.id_type,
        id_number: data.id_number || null,
      };

      let error;
      
      if (customer) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from("profiles")
          .update(customerData)
          .eq("id", customer.id);
        
        error = updateError;
      } else {
        // Create new customer (requires auth user to be created first)
        // Create a random password for the new user
        const password = Math.random().toString(36).slice(-8);
        const email = data.email || `temp-${Date.now()}@dinpa.finance`;
        
        // Create auth user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) {
          error = signUpError;
        } else if (authData.user) {
          // Create customer profile
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              ...customerData,
              id: authData.user.id,
            });
          
          error = insertError;
        }
      }

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: customer 
            ? "Customer updated successfully" 
            : "Customer created successfully",
        });
        onSave();
      }
    } catch (error) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                {...register("full_name", { required: "Full name is required" })}
                placeholder="Enter full name"
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs">{errors.full_name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                {...register("phone_number", { required: "Phone number is required" })}
                placeholder="Enter phone number"
                className={errors.phone_number ? "border-red-500" : ""}
              />
              {errors.phone_number && (
                <p className="text-red-500 text-xs">{errors.phone_number.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter email (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Enter address (optional)"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_type">ID Type</Label>
                <Select 
                  onValueChange={(value: IdType) => setValue("id_type", value)}
                  value={(customer?.id_type as IdType) || "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ghana_card">Ghana Card</SelectItem>
                    <SelectItem value="voter_id">Voter ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  {...register("id_number")}
                  placeholder="Enter ID number"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <LoadingSpinner /> : customer ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerModal;
