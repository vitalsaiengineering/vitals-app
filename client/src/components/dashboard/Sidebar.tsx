import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LucideIcon,
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calculator,
  FileLineChart,
  ChevronUp,
  ChevronDown,
  User,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar as SidebarContainer,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface NavItemProps {
  icon: LucideIcon;
  title: string;
  href: string;
  isActive?: boolean;
  hasSubmenu?: boolean;
  submenuItems?: { title: string; href: string }[];
  isSubmenuOpen?: boolean;
  toggleSubmenu?: () => void;
}

const NavItem = ({
  icon: Icon,
  title,
  href,
  isActive,
  hasSubmenu = false,
  submenuItems = [],
  isSubmenuOpen = false,
  toggleSubmenu,
}: NavItemProps) => {
  const { state } = useSidebar();
  const showTooltip = state === "collapsed";

  // Adjust icon size to be slightly larger
  const iconSize = 24; // Increased from 20

  return (
    <SidebarMenuItem>
      {hasSubmenu ? (
        <>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={showTooltip ? title : undefined}
            onClick={toggleSubmenu}
            className="font-medium"
          >
            <Icon size={iconSize} />
            <span>{title}</span>
            <div className="ml-auto">
              {isSubmenuOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
          </SidebarMenuButton>

          {isSubmenuOpen && (
            <SidebarMenuSub>
              {submenuItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={window.location.pathname === subItem.href}
                  >
                    <Link to={subItem.href}>{subItem.title}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </>
      ) : (
        <SidebarMenuButton
          isActive={isActive}
          tooltip={showTooltip ? title : undefined}
          className="font-medium transition-colors duration-200 text-base" // Increased font-size
        >
          {showTooltip ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link
                  to={href}
                  className="flex items-center justify-center w-full"
                >
                  <Icon
                    size={iconSize}
                    className={isActive ? "text-white" : "text-white/70"}
                  />
                </Link>
              </HoverCardTrigger>
              <HoverCardContent side="right" className="py-1 px-3">
                <span className="text-sm">{title}</span>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Link to={href} className="flex items-center gap-3 w-full">
              <Icon
                size={iconSize}
                className={isActive ? "text-white" : "text-white/70"}
              />
              <span>{title}</span>
            </Link>
          )}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

export const Sidebar = () => {
  const { pathname } = useLocation();
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const { state, toggleSidebar } = useSidebar();

  const toggleSubmenu = () => {
    setSubmenuOpen(!submenuOpen);
  };

  const navItems: NavItemProps[] = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      href: "/dashboard",
      hasSubmenu: false,
    },
    {
      icon: FileLineChart,
      title: "Reporting",
      href: "/reporting",
      hasSubmenu: false,
    },
    {
      icon: Calculator,
      title: "Valuation",
      href: "/valuation",
      hasSubmenu: false,
    },
    {
      icon: Users,
      title: "Clients",
      href: "/clients",
      hasSubmenu: false,
    },
    {
      icon: Settings,
      title: "Settings",
      href: "/settings",
      hasSubmenu: false,
    },
  ];

  return (
    <SidebarContainer variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex justify-between items-center">
          {state !== "collapsed" && (
            <div className="flex items-center justify-center w-full py-4 px-2">
              <img
                src="/public/images/d62e5228-3d79-4ebf-9803-0cdadb75b3ac.png"
                alt="Vitals AI - Advisor Intelligence"
                className="w-auto h-20 max-w-full"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              "flex items-center justify-center rounded-full bg-sidebar-accent p-2 hover:bg-sidebar-accent-foreground/10 transition-colors",
              state === "collapsed" ? "ml-auto" : "ml-2 mr-4",
            )}
          >
            {state === "collapsed" ? (
              <ChevronRight size={20} className="text-white" />
            ) : (
              <ChevronLeft size={20} className="text-white" />
            )}
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarMenu className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              title={item.title}
              href={item.href}
              isActive={pathname === item.href}
              hasSubmenu={item.hasSubmenu}
              submenuItems={item.submenuItems}
              isSubmenuOpen={item.title === "Scorecard" && submenuOpen}
              toggleSubmenu={
                item.title === "Scorecard" ? toggleSubmenu : undefined
              }
            />
          ))}

          {/* Add Profile NavItem */}
          <NavItem
            icon={User}
            title="Profile"
            href="/profile"
            isActive={pathname === "/profile"}
            hasSubmenu={false}
          />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Make the entire profile card clickable */}
        <Link to="/profile" className="block">
          <div className="p-4 m-3 border-t border-sidebar-border rounded-md bg-sidebar-accent bg-opacity-30 shadow-inner hover:bg-sidebar-accent hover:bg-opacity-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sidebar-background font-bold shadow-md">
                JS
              </div>
              <div>
                <p className="font-medium text-white">John Smith</p>
                <p className="text-xs text-white/75">Financial Advisor</p>
              </div>
            </div>
          </div>
        </Link>
      </SidebarFooter>
    </SidebarContainer>
  );
};
