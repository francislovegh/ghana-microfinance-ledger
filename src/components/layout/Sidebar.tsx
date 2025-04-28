
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  PiggyBank, 
  CreditCard, 
  Receipt, 
  BarChart4, 
  Settings, 
  ChevronDown, 
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  children?: { to: string; label: string }[];
}

const NavItem = ({ to, icon, label, active, children }: NavItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = children && children.length > 0;

  return (
    <div>
      {hasChildren ? (
        <div className="mb-1">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors",
              active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <span className="mr-3">{icon}</span>
            <span className="flex-1">{label}</span>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isOpen && (
            <div className="ml-6 mt-1">
              {children.map((child, index) => (
                <Link 
                  key={index} 
                  to={child.to}
                  className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 mb-1"
                >
                  <span className="h-1 w-1 rounded-full bg-gray-400 mr-2"></span>
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link 
          to={to}
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-md transition-colors mb-1",
            active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <span className="mr-3">{icon}</span>
          <span>{label}</span>
        </Link>
      )}
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const isActiveParent = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-blue-700">GMFL</h2>
        <p className="text-xs text-gray-500">Ghana Microfinance Ledger</p>
      </div>
      
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-1">
          <NavItem 
            to="/"
            icon={<Home size={18} />}
            label="Dashboard"
            active={isActive("/")}
          />
          <NavItem 
            to="/customers"
            icon={<Users size={18} />}
            label="Customers"
            active={isActiveParent(["/customers"])}
            children={[
              { to: "/customers", label: "All Customers" },
              { to: "/customers/new", label: "New Customer" }
            ]}
          />
          <NavItem 
            to="/savings"
            icon={<PiggyBank size={18} />}
            label="Savings"
            active={isActiveParent(["/savings"])}
            children={[
              { to: "/savings/accounts", label: "Accounts" },
              { to: "/savings/new", label: "New Account" }
            ]}
          />
          <NavItem 
            to="/loans"
            icon={<CreditCard size={18} />}
            label="Loans"
            active={isActiveParent(["/loans"])}
            children={[
              { to: "/loans/active", label: "Active Loans" },
              { to: "/loans/new", label: "New Loan" },
              { to: "/loans/repayments", label: "Repayments" }
            ]}
          />
          <NavItem 
            to="/transactions"
            icon={<Receipt size={18} />}
            label="Transactions"
            active={isActiveParent(["/transactions"])}
            children={[
              { to: "/transactions/all", label: "All Transactions" },
              { to: "/transactions/new", label: "New Transaction" }
            ]}
          />
          <NavItem 
            to="/reports"
            icon={<BarChart4 size={18} />}
            label="Reports"
            active={isActiveParent(["/reports"])}
          />
          <NavItem 
            to="/settings"
            icon={<Settings size={18} />}
            label="Settings"
            active={isActiveParent(["/settings"])}
          />
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500">Powered by</p>
          <p className="text-sm font-medium">Lovable</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
