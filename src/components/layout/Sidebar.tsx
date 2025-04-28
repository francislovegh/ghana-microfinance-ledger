
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  PiggyBank,
  CreditCard,
  FileText,
  Settings,
  BarChart2,
  Menu,
  LogOut,
  CloudUpload,
  DatabaseBackup
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user role:", error);
          } else if (data) {
            setUserRole(data.role);
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };
    
    checkUserRole();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        variant: "default",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Failed to sign out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const sidebarItems = [
    {
      name: "Dashboard",
      icon: Home,
      href: "/",
      roles: ["admin", "teller", "loan_officer", "field_agent"],
    },
    {
      name: "Customers",
      icon: Users,
      href: "/customers",
      roles: ["admin", "teller", "loan_officer", "field_agent"],
    },
    {
      name: "Savings",
      icon: PiggyBank,
      href: "/savings",
      roles: ["admin", "teller"],
    },
    {
      name: "Loans",
      icon: CreditCard,
      href: "/loans",
      roles: ["admin", "loan_officer"],
    },
    {
      name: "Transactions",
      icon: FileText,
      href: "/transactions",
      roles: ["admin", "teller"],
    },
    {
      name: "Reports",
      icon: BarChart2,
      href: "/reports",
      roles: ["admin"],
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      roles: ["admin"],
    },
  ];

  const navItems = sidebarItems.filter(
    item => !userRole || item.roles.includes(userRole)
  );

  return (
    <>
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu size={20} />
        </button>
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 transform",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-700">Dinpa Microfinance</h1>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="flex flex-col space-y-1">
              <Link
                to="/settings/sync"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => isMobile && setIsOpen(false)}
              >
                <CloudUpload className="h-5 w-5 mr-3" />
                Sync Data
              </Link>
              <Link
                to="/settings/backup"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => isMobile && setIsOpen(false)}
              >
                <DatabaseBackup className="h-5 w-5 mr-3" />
                Backup Data
              </Link>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
            <div>Powered by Neolifeporium | Lovable</div>
            <div>Made with ❤ by George Asiedu Annan</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
