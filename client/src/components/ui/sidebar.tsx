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
    <nav 
      className={cn(
        "bg-slate-800 text-white h-screen flex-shrink-0 overflow-y-auto transition-all duration-200 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo and brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <span className="ml-3 font-bold text-lg">VitalsAI</span>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
        )}
        
        <button 
          onClick={toggleSidebar} 
          className="text-gray-400 hover:text-white md:flex hidden"
        >
          {isCollapsed ? (
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="py-4">
        <div className="space-y-1 px-3">
          <NavLink 
            href="/" 
            isActive={location === "/"} 
            isCollapsed={isCollapsed}
            icon={
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          >
            Dashboard
          </NavLink>
          
          <NavLink 
            href="/clients" 
            isActive={location.startsWith("/clients")} 
            isCollapsed={isCollapsed}
            icon={
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          >
            Clients
          </NavLink>
          
          <NavLink 
            href="/integrations" 
            isActive={location.startsWith("/integrations")} 
            isCollapsed={isCollapsed}
            icon={
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            }
          >
            Integrations
          </NavLink>
          
          <NavLink 
            href="/mapping" 
            isActive={location.startsWith("/mapping")} 
            isCollapsed={isCollapsed}
            icon={
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            }
          >
            Data Mapping
          </NavLink>
        </div>
        
        {isAdmin && (
          <div className="mt-10">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administration
              </h3>
            )}
            
            <div className="mt-2 space-y-1 px-3">
              <NavLink 
                href="/admin/users" 
                isActive={location.startsWith("/admin/users")} 
                isCollapsed={isCollapsed}
                icon={
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                }
              >
                User Management
              </NavLink>
              
              {isGlobalAdmin && (
                <NavLink 
                  href="/admin/organizations" 
                  isActive={location.startsWith("/admin/organizations")} 
                  isCollapsed={isCollapsed}
                  icon={
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                >
                  Organizations
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="mt-auto p-4 border-t border-slate-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center">
              <span className="text-white font-medium">
                {user.fullName.split(' ').map(name => name[0]).join('')}
              </span>
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.fullName}</p>
              <p className="text-xs text-gray-400">{user.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  isActive: boolean;
  isCollapsed: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ href, isActive, isCollapsed, icon, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
        isActive 
          ? "bg-slate-900 text-white" 
          : "text-gray-300 hover:bg-slate-700 hover:text-white"
      )}>
        <div className="flex-shrink-0 mr-3 h-6 w-6">
          {icon}
        </div>
        {!isCollapsed && (
          <span>{children}</span>
        )}
      </div>
    </Link>
  );
}
