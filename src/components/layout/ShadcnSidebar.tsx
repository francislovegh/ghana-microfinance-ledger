
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  Users,
  PiggyBank,
  CreditCard,
  FileText,
  Settings,
  BarChart2,
  LogOut,
  CloudUpload,
  DatabaseBackup,
  BookOpen,
  Landmark,
  ChevronRight,
  Calculator,
  ReceiptText,
  Banknote
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const ShadcnSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState({
    accounting: false,
    settings: false
  });

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

  const mainMenuItems = [
    {
      name: "Dashboard",
      icon: Home,
      href: "/",
      roles: ["admin", "teller", "loan_officer", "field_agent"],
      isActive: location.pathname === "/"
    },
    {
      name: "Customers",
      icon: Users,
      href: "/customers",
      roles: ["admin", "teller", "loan_officer", "field_agent"],
      isActive: location.pathname === "/customers"
    },
    {
      name: "Savings",
      icon: PiggyBank,
      href: "/savings",
      roles: ["admin", "teller"],
      isActive: location.pathname === "/savings"
    },
    {
      name: "Loans",
      icon: CreditCard,
      href: "/loans",
      roles: ["admin", "loan_officer"],
      isActive: location.pathname === "/loans"
    },
    {
      name: "Transactions",
      icon: FileText,
      href: "/transactions",
      roles: ["admin", "teller"],
      isActive: location.pathname === "/transactions"
    },
    {
      name: "Reports",
      icon: BarChart2,
      href: "/reports",
      roles: ["admin"],
      isActive: location.pathname === "/reports"
    },
  ];

  const accountingMenuItems = [
    {
      name: "General Ledger",
      href: "/accounting/ledger",
      isActive: location.pathname === "/accounting/ledger"
    },
    {
      name: "Chart of Accounts",
      href: "/accounting/chart-of-accounts",
      isActive: location.pathname === "/accounting/chart-of-accounts"
    },
    {
      name: "Journal Entries",
      href: "/accounting/journal-entries",
      isActive: location.pathname === "/accounting/journal-entries"
    },
    {
      name: "Financial Reports",
      href: "/accounting/reports",
      isActive: location.pathname === "/accounting/reports"
    },
    {
      name: "Integrations",
      href: "/accounting/integrations",
      isActive: location.pathname === "/accounting/integrations"
    },
  ];

  const settingsMenuItems = [
    {
      name: "General Settings",
      href: "/settings",
      isActive: location.pathname === "/settings"
    },
    {
      name: "User Roles",
      href: "/settings/roles",
      isActive: location.pathname === "/settings/roles"
    },
    {
      name: "Data Sync",
      href: "/settings/sync",
      isActive: location.pathname === "/settings/sync"
    },
    {
      name: "Backup",
      href: "/settings/backup",
      isActive: location.pathname === "/settings/backup"
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = mainMenuItems.filter(
    item => !userRole || item.roles.includes(userRole)
  );

  // Check if the location starts with a specific path
  const isInPath = (basePath: string) => {
    return location.pathname.startsWith(basePath);
  };

  // Accounting should be visible to admins
  const showAccounting = userRole === "admin";

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="flex flex-col items-center justify-center py-6">
          <h1 className="text-xl font-bold text-blue-700">Dinpa Microfinance</h1>
          <p className="text-xs text-gray-500">Advanced Financial Management</p>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenuItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={item.isActive}
                      tooltip={item.name}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {/* Accounting Module - Only for admin */}
                {showAccounting && (
                  <SidebarMenuItem key="accounting">
                    <SidebarMenuButton 
                      asChild
                      isActive={isInPath("/accounting")}
                      tooltip="Accounting"
                      onClick={() => setIsSubMenuOpen(prev => ({ ...prev, accounting: !prev.accounting }))}
                    >
                      <div className="flex w-full justify-between">
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5" />
                          <span>Accounting</span>
                        </div>
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 transition-transform", 
                            isSubMenuOpen.accounting && "rotate-90"
                          )} 
                        />
                      </div>
                    </SidebarMenuButton>
                    
                    {isSubMenuOpen.accounting && (
                      <SidebarMenuSub>
                        {accountingMenuItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.name}>
                            <SidebarMenuSubButton 
                              asChild 
                              isActive={subItem.isActive}
                            >
                              <Link to={subItem.href}>{subItem.name}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )}

                {/* Settings with submenu */}
                <SidebarMenuItem key="settings">
                  <SidebarMenuButton 
                    asChild
                    isActive={isInPath("/settings")}
                    tooltip="Settings"
                    onClick={() => setIsSubMenuOpen(prev => ({ ...prev, settings: !prev.settings }))}
                  >
                    <div className="flex w-full justify-between">
                      <div className="flex items-center">
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </div>
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 transition-transform", 
                          isSubMenuOpen.settings && "rotate-90"
                        )} 
                      />
                    </div>
                  </SidebarMenuButton>
                  
                  {isSubMenuOpen.settings && (
                    <SidebarMenuSub>
                      {settingsMenuItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.name}>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={subItem.isActive}
                          >
                            <Link to={subItem.href}>{subItem.name}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>

          <div className="px-3 py-2 text-xs text-gray-500">
            <div>Powered by Neolifeporium | Lovable</div>
            <div>Made with ❤ by George Asiedu Annan</div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default ShadcnSidebar;
