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

  // RoleId 1 is typically admin
  const isAdmin = user.roleId === 4;
  const isGlobalAdmin = user.roleId === 1;

  return (
    <nav
      className={cn(
        "bg-[#002B5B] text-white h-screen flex-shrink-0 overflow-y-auto transition-all duration-200 ease-in-out flex flex-col",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo and brand */}
      <div className="flex justify-between items-center border-b border-[#003B7B]">
        {!isCollapsed && (
          <div className="flex items-center justify-center w-full py-4 px-2">
            <img
              src="/images/d62e5228-3d79-4ebf-9803-0cdadb75b3ac.png"
              alt="Vitals AI - Advisor Intelligence"
              className="w-auto h-16 max-w-full"
            />
          </div>
        )}

        {/* {isCollapsed && (
          <div className="flex items-center justify-center w-full py-4">
            <img
              src="/lovable-uploads/d62e5228-3d79-4ebf-9803-0cdadb75b3ac.png"
              alt="Vitals AI Icon"
              className="w-10 h-10"
            />
          </div>
        )}
 */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-center rounded-full bg-[#003B7B] p-2 hover:bg-[#004C9E] transition-colors",
            isCollapsed ? "mx-auto my-3" : "ml-auto mr-4 my-4",
          )}
        >
          {isCollapsed ? (
            <svg
              className="w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
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
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            href="/reporting"
            isActive={location.startsWith("/reporting")}
            isCollapsed={isCollapsed}
            icon={
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          >
            Reporting
          </NavLink>

          <NavLink
            href="/valuation"
            isActive={location.startsWith("/valuation")}
            isCollapsed={isCollapsed}
            icon={
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          >
            Valuation
          </NavLink>

          <NavLink
            href="/settings"
            isActive={location.startsWith("/settings")}
            isCollapsed={isCollapsed}
            icon={
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          >
            Settings
          </NavLink>

          <NavLink
            href="/clients"
            isActive={location.startsWith("/clients")}
            isCollapsed={isCollapsed}
            icon={
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          >
            Clients
          </NavLink>

          <NavLink
            href="/profile"
            isActive={location.startsWith("/profile")}
            isCollapsed={isCollapsed}
            icon={
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          >
            Profile
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
                  <svg
                    className="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
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
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
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
      <div className="flex-shrink-0 flex flex-col justify-end mt-auto">
        <Link href="/profile">
          <div className="p-4 m-3 border-t border-[#003B7B] rounded-md bg-[#003B7B] bg-opacity-30 shadow-inner hover:bg-[#004C9E] hover:bg-opacity-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E88E5] flex items-center justify-center text-white font-medium shadow-md">
                {user.firstName ? user.firstName.charAt(0) : ""}
                {user.lastName ? user.lastName.charAt(0) : ""}
              </div>

              {!isCollapsed && (
                <div>
                  <p className="font-medium text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-white/75">
                    {user.roleId === 1 ? "Administrator" : "Advisor"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>
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

function NavLink({
  href,
  isActive,
  isCollapsed,
  icon,
  children,
}: NavLinkProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
          isActive
            ? "bg-[#003B7B] text-white"
            : "text-gray-300 hover:bg-[#003B7B]/70 hover:text-white",
        )}
      >
        <div className="flex-shrink-0 mr-3 h-6 w-6">{icon}</div>
        {!isCollapsed && <span>{children}</span>}
      </div>
    </Link>
  );
}
