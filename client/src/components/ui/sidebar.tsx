import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";

interface SidebarProps {
  user: User | null;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ user, isCollapsed, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();

  if (!user) return null;

  const isAdmin = user.role === "global_admin" || user.role === "client_admin";
  const isGlobalAdmin = user.role === "global_admin";

  return (
    <div 
      className={cn(
        "bg-primary-900 text-white flex-shrink-0 flex flex-col z-30 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 md:relative h-full",
        isCollapsed ? "w-0 md:w-16 overflow-hidden" : "w-64 shadow-lg"
      )}
    >
      <div className="p-4 flex items-center border-b border-primary-800">
        {!isCollapsed && (
          <>
            <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-xl font-semibold">FinAdvisor Pro</span>
          </>
        )}
        {isCollapsed && (
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
        <button 
          className="md:hidden ml-auto text-primary-100" 
          onClick={toggleSidebar}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto">
        <div className="space-y-1">
          <SidebarLink 
            to="/" 
            icon="dashboard" 
            label="Dashboard" 
            isActive={location === "/"} 
            isCollapsed={isCollapsed} 
          />
          
          <SidebarLink 
            to="/clients" 
            icon="people" 
            label="Clients" 
            isActive={location.startsWith("/clients")} 
            isCollapsed={isCollapsed} 
          />
          
          <SidebarLink 
            to="/integrations" 
            icon="integration_instructions" 
            label="Integrations" 
            isActive={location.startsWith("/integrations")} 
            isCollapsed={isCollapsed} 
          />
          
          <SidebarLink 
            to="/mapping" 
            icon="tune" 
            label="Data Mapping" 
            isActive={location.startsWith("/mapping")} 
            isCollapsed={isCollapsed} 
          />
          
          <SidebarLink 
            to="/reports" 
            icon="analytics" 
            label="Reports" 
            isActive={location.startsWith("/reports")} 
            isCollapsed={isCollapsed} 
          />
        </div>

        {/* Admin Section (only visible to admins) */}
        {isAdmin && (
          <div className={cn("pt-4 mt-4 border-t border-primary-800", isCollapsed ? "px-2" : "")}>
            {!isCollapsed && (
              <p className="px-2 text-xs font-medium text-primary-400 uppercase tracking-wider">
                Administration
              </p>
            )}
            
            <div className="mt-1 space-y-1">
              <SidebarLink 
                to="/admin/users" 
                icon="admin_panel_settings" 
                label="User Management" 
                isActive={location.startsWith("/admin/users")} 
                isCollapsed={isCollapsed} 
              />
              
              {isGlobalAdmin && (
                <SidebarLink 
                  to="/admin/organizations" 
                  icon="business" 
                  label="Organizations" 
                  isActive={location.startsWith("/admin/organizations")} 
                  isCollapsed={isCollapsed} 
                />
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-primary-800">
        <div className="flex items-center">
          {!isCollapsed && (
            <>
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm mr-2">
                {user.fullName.split(' ').map(name => name[0]).join('')}
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium text-primary-100">{user.fullName}</div>
                <div className="text-xs text-primary-400">{user.role.replace('_', ' ')}</div>
              </div>
            </>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm mx-auto">
              {user.fullName.split(' ').map(name => name[0]).join('')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarLink({ to, icon, label, isActive, isCollapsed }: SidebarLinkProps) {
  return (
    <Link href={to}>
      <div className={cn(
        "flex items-center py-2 rounded-lg transition-colors cursor-pointer",
        isActive 
          ? "bg-primary-800 text-white" 
          : "text-primary-100 hover:bg-primary-800",
        isCollapsed ? "justify-center px-2" : "px-2"
      )}>
        <span className="material-icons text-lg mr-3">{icon}</span>
        {!isCollapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}
