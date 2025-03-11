import { useState, useEffect } from "react";
import { Redirect } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { TopNav } from "@/components/ui/topnav";
import { getCurrentUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AppLayout({ children, requireAuth = true }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  
  // Set sidebar collapsed state based on screen size
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ['/api/me'],
    retry: false
  });
  
  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && isError) {
    return <Redirect to="/login" />;
  }
  
  // If still loading, show minimal loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="space-y-2 text-center">
          <div className="animate-spin text-primary-600">
            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        user={user} 
        isCollapsed={sidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav user={user} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
