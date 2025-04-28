
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

// Later in the component where the type error occurs, cast the id_type to IdType
setSelectedCustomer({
  ...customer,
  id_type: customer.id_type as IdType
});
