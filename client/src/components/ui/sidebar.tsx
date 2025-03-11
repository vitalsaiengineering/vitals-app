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
        {/* Replace with SVG icons for better reliability */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon === "dashboard" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />}
          {icon === "people" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
          {icon === "integration_instructions" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
          {icon === "tune" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />}
          {icon === "analytics" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
          {icon === "admin_panel_settings" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
          {icon === "business" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
        </svg>
        {!isCollapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}
