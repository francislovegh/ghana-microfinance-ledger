
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import LoadingSpinner from "../ui/LoadingSpinner";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

const AuthGuard = ({ 
  children, 
  requireAuth = true,
  requiredRoles = [] 
}: AuthGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session:", error);
          setLoading(false);
          return;
        }
        
        setSession(data.session);
        
        // If we have a session, fetch the user role
        if (data.session) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching user role:", profileError);
          } else if (profileData) {
            setUserRole(profileData.role);
            console.log("User role:", profileData.role); // Debug log for role
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error:", error);
        setLoading(false);
      }
    };
    
    fetchSession();

    // Setup auth subscription
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(true);
      if (session) {
        fetchSession();
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle auth redirects
  if (requireAuth && !session) {
    return <Navigate to="/login" />;
  }

  if (!requireAuth && session) {
    return <Navigate to="/" />;
  }

  // Handle role-based access
  if (session && requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
    console.log(`Access denied: User role ${userRole} not in required roles [${requiredRoles.join(', ')}]`);
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export default AuthGuard;
