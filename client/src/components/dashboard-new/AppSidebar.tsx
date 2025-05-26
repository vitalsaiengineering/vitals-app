import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart,
  DollarSign,
  Settings,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active = false,
  collapsed = false,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}) => {
  const buttonContent = (
    <Link href={href}>
      <a className="block">
        <Button
          variant="ghost"
          className={cn(
            "w-full font-normal",
            collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
            active
              ? "bg-white/10 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10",
          )}
        >
          <Icon size={20} />
          {!collapsed && <span>{label}</span>}
        </Button>
      </a>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
};

export const AppSidebar = () => {
  const [location] = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/me");
        if (response.data) {
          // Transform the data to match the UserProfile interface with full name
          let fullName = "";

          // Try to get the full name from various possible fields
          if (response.data.name) {
            fullName = response.data.name;
          } else if (response.data.first_name && response.data.last_name) {
            fullName = `${response.data.first_name} ${response.data.last_name}`;
          } else if (response.data.firstName && response.data.lastName) {
            fullName = `${response.data.firstName} ${response.data.lastName}`;
          } else if (response.data.firstName && !response.data.last_name) {
            fullName = `${response.data.firstName}`;
          } else if (response.data.display_name) {
            fullName = response.data.display_name;
          } else {
            // If no name fields are available, use the username or email prefix
            fullName =
              response.data.username || response.data.email.split("@")[0];
          }

          const userData: UserProfile = {
            id: response.data.id,
            username:
              response.data.username || response.data.email.split("@")[0],
            name: fullName,
            email: response.data.email,
            role: response.data.role || "user",
          };
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatRole = (role: string): string => {
    // Format role names to be more user-friendly
    switch (role.toLowerCase()) {
      case "admin":
        return "Administrator";
      case "firm_admin":
        return "Firm Administrator";
      case "advisor":
        return "Financial Advisor";
      case "user":
        return "Standard User";
      default:
        // Convert snake_case or kebab-case to Title Case
        return role
          .replace(/[-_]/g, " ")
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
    }
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "h-screen bg-vitals-blue flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo and Collapse Button */}
        <div className={cn("p-6 relative", collapsed && "p-4")}>
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-2.5"
          )}>
            <div className="h-8 w-auto">
              <img 
                src="/images/vitals.png" 
                alt="Vitals AI" 
                className="h-full w-auto object-contain brightness-0 invert"
              />
            </div>
            {!collapsed && <span className="text-white font-semibold text-lg">Vitals AI</span>}
          </div>
          
          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "absolute text-white/70 hover:text-white hover:bg-white/10 p-1 h-6 w-6",
              collapsed ? "top-4 right-4" : "top-6 right-6"
            )}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Main navigation */}
        <div className="flex-1 px-3 py-2 space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/"
            active={location === "/"}
            collapsed={collapsed}
          />
          <SidebarItem
            icon={BarChart}
            label="Reporting"
            href="/reporting"
            active={location === "/reporting"}
            collapsed={collapsed}
          />
          {/* <SidebarItem
            icon={DollarSign}
            label="Valuation"
            href="/valuation"
            active={location === "/valuation"}
            collapsed={collapsed}
          /> */}
          <SidebarItem
            icon={Settings}
            label="Settings"
            href="/settings"
            active={location.startsWith("/settings")}
            collapsed={collapsed}
          />
          <SidebarItem
            icon={Users}
            label="Clients"
            href="/clients"
            active={location === "/clients"}
            collapsed={collapsed}
          />
          <SidebarItem
            icon={User}
            label="Profile"
            href="/profile"
            active={location === "/profile"}
            collapsed={collapsed}
          />
        </div>

        {/* Administration section */}
        {user && (user.role === "admin" || user.role === "firm_admin") && (
          <div className={cn("px-6 py-3", collapsed && "px-3")}>
            {!collapsed && (
              <div className="text-white/50 text-xs font-medium mb-2">
                ADMINISTRATION
              </div>
            )}
            <div className="px-3 space-y-1">
              <SidebarItem
                icon={Settings}
                label="User Management"
                href="/admin/users"
                active={location === "/admin/users"}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={Settings}
                label="Organizations"
                href="/admin/organizations"
                active={location === "/admin/organizations"}
                collapsed={collapsed}
              />
            </div>
          </div>
        )}

        {/* User profile */}
        <div className={cn("p-4 border-t border-white/10", collapsed && "p-2")}>
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}>
            <div className="h-9 w-9 rounded-full bg-vitals-lightBlue flex items-center justify-center text-white font-medium">
              {loading ? "..." : user ? getInitials(user.name) : "GU"}
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">
                  {loading ? "Loading..." : user ? user.name : "Guest User"}
                </span>
                <span className="text-white/50 text-xs">
                  {loading ? "..." : user ? formatRole(user.role) : "Not logged in"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
