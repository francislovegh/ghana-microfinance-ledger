
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
      <p className="text-center text-gray-600 mb-8 max-w-md">
        You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <div className="flex space-x-4">
        <Button variant="default" onClick={() => navigate("/")}>
          Go to Dashboard
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
