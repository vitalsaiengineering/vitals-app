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
  LogOut,
  ChevronDown,
  Plus,
  Star,
  GripVertical,
  Search,
  LineChart,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { ReportSearchDialog } from "./ReportSearchDialog";
import { CommandPalette } from "./CommandPalette";
import { FirmRegistrationModal } from "./FirmRegistrationModal";
import { logout } from "@/lib/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getFavoriteReports, addFavoriteReport, removeFavoriteReport, saveFavoriteReports, FavoriteReport } from "../../lib/favorites";

// Types
type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

type Workspace = {
  id: string;
  name: string;
  selected?: boolean;
};

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

// Initial data
const initialWorkspaces: Workspace[] = [
  {
    id: '1',
    name: 'Vitals Capital',
    selected: true
  }
];

// Navigation items
const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  }, 
  {
    name: 'Reporting',
    path: '/reporting',
    icon: BarChart
  }, 
  {
    name: 'Clients',
    path: '/clients',
    icon: Users
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: User
  }
];

// SidebarItem component for navigation items
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
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href}>
            <a className={cn("flex items-center justify-center rounded-md p-2 group", 
              active ? "bg-[#005EE1] text-white" : "text-white/80 hover:bg-white/10 hover:text-white")}>
              <Icon className={cn("h-5 w-5", active ? "text-white" : "text-white/80")} />
            </a>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href}>
      <a className={cn("flex items-center rounded-md px-3 py-2 group", 
        active ? "bg-[#005EE1] text-white" : "text-white/80 hover:bg-white/10 hover:text-white")}>
        <Icon className={cn("h-5 w-5", active ? "text-white" : "text-white/80")} />
        <span className="ml-3 text-base">{label}</span>
      </a>
    </Link>
  );
};

// Main AppSidebar component
export const AppSidebar = () => {
  const [location, navigate] = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(workspaces.find(w => w.selected === true) || workspaces[0]);
  const [favoriteItems, setFavoriteItems] = useState<NavItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [firmRegistrationOpen, setFirmRegistrationOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filter navigation items based on search query
  const filteredNavItems = navItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFavoriteItems = favoriteItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize favorites from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      const favorites = getFavoriteReports();
      const navItems: NavItem[] = favorites.map((fav: FavoriteReport) => ({
        name: fav.name,
        path: fav.path,
        icon: fav.icon || LineChart
      }));
      setFavoriteItems(navItems);
    };

    loadFavorites();

    // Listen for custom favorites changed events
    const handleFavoritesChanged = (event: CustomEvent) => {
      const favorites = event.detail as FavoriteReport[];
      const navItems: NavItem[] = favorites.map((fav: FavoriteReport) => ({
        name: fav.name,
        path: fav.path,
        icon: fav.icon || LineChart
      }));
      setFavoriteItems(navItems);
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    
    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    };
  }, []);

  // Fetch user data
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

  // Workspace handling
  const handleWorkspaceChange = (workspace: Workspace) => {
    setWorkspaces(currentWorkspaces => 
      currentWorkspaces.map(w => ({
        ...w,
        selected: w.id === workspace.id
      }))
    );
    setCurrentWorkspace(workspace);
  };

  // Firm registration handling
  const handleNewFirmClick = () => {
    setFirmRegistrationOpen(true);
  };
  
  const handleFirmRegistrationSubmit = (data: any) => {
    console.log('New firm registration data:', data);
    
    // Create a new workspace entry for the firm
    const newWorkspace: Workspace = {
      id: `new-${Date.now()}`,
      name: data.firmName,
      selected: true
    };
    
    // Update workspaces list: unselect all existing workspaces and add the new one
    // Then sort alphabetically
    setWorkspaces(currentWorkspaces => {
      const updatedWorkspaces = [
        ...currentWorkspaces.map(w => ({ ...w, selected: false })),
        newWorkspace
      ];
      
      return updatedWorkspaces.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
    });
    
    // Update current workspace to the newly created one
    setCurrentWorkspace(newWorkspace);
    
    // Close the registration modal
    setFirmRegistrationOpen(false);
  };

  // Favorites handling
  const handleAddFavorite = () => {
    setIsReportDialogOpen(true);
  };

  const addFavoriteReportFromDialog = (report: any) => {
    addFavoriteReport({
      id: report.id,
      name: report.name,
      path: report.path
    });
    setIsReportDialogOpen(false);
  };

  const handleRemoveFavorite = (itemToRemove: NavItem) => {
    // Find the report ID from the path
    const reportId = itemToRemove.path.split('/').pop() || '';
    removeFavoriteReport(reportId);
    window.dispatchEvent(new CustomEvent('reportFavoriteChanged', { 
      detail: { reportId: reportId, isFavorite: false } 
    }));
  };

  // Search handling
  const handleSearchFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Prevent the default focus behavior and open the command dialog instead
    e.target.blur();
    setCommandDialogOpen(true);
  };
  
  const handleSearchClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Prevent the default click behavior and open the command dialog instead
    e.currentTarget.blur();
    setCommandDialogOpen(true);
  };

  // Drag handling functions
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    setDropTarget(index);
  };
  
  const handleDrop = (index: number) => {
    if (draggedItem === null || draggedItem === index) return;
    
    // Reorder the items
    const updatedItems = [...favoriteItems];
    const draggedItemContent = updatedItems[draggedItem];
    
    // Remove the dragged item
    updatedItems.splice(draggedItem, 1);
    
    // Insert it at the new position
    updatedItems.splice(index, 0, draggedItemContent);
    
    // Convert back to FavoriteReport format and save to centralized system
    const reorderedFavorites: FavoriteReport[] = updatedItems.map(item => ({
      id: item.path.split('/').pop() || '',
      name: item.name,
      path: item.path,
      icon: item.icon
    }));
    
    saveFavoriteReports(reorderedFavorites);
    
    // Reset drag states
    setDropTarget(null);
    setDraggedItem(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  // Sign out handler
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      window.location.href = '/login';
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  // Format role names to be more user-friendly
  const formatRole = (role: string): string => {
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
    <TooltipProvider delayDuration={300}>
      <div className={cn("h-screen bg-[#001027] flex flex-col transition-all duration-300 text-white", 
        collapsed ? "w-[72px]" : "w-[280px]")}>
        
        {/* Workspace Dropdown */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full hover:bg-white/10 rounded-md p-2 transition-colors">
                <div className="rounded-md h-8 w-8 bg-white flex items-center justify-center">
                  <img 
                    src="/images/vitals.png" 
                    alt="Vitals Logo" 
                    className="h-6 w-6 object-contain bg-white rounded-md"
                  />
                  {/* <span className="text-[#001027] font-bold text-lg">{currentWorkspace.name.charAt(0)}</span> */}
                </div>
                {!collapsed && <div className="flex flex-1 items-center justify-between">
                    <span className="font-semibold text-sm">{currentWorkspace.name}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map(workspace => (
                <DropdownMenuItem 
                  key={workspace.id} 
                  className={cn(
                    "cursor-pointer", 
                    workspace.id === currentWorkspace.id && "bg-accent text-accent-foreground"
                  )} 
                  onClick={() => handleWorkspaceChange(workspace)}
                >
                  <div className="rounded-md h-6 w-6 bg-[#001027] flex items-center justify-center mr-2">
                    <img 
                      src="/images/vitals.png" 
                      alt="Vitals Logo" 
                      className="h-6 w-6 object-contain bg-white rounded-md"
                    />
                  </div>
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleNewFirmClick}>
                <div className="flex items-center justify-center rounded-md h-6 w-6 border border-dashed border-muted-foreground mr-2">
                  <span className="text-lg">+</span>
                </div>
                New Firm
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <Users className="h-4 w-4 mr-2" />
                Firm Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Invite Your Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut} disabled={logoutMutation.isPending}>
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search bar */}
        <div className={cn("mx-4 mb-2 relative", collapsed && "hidden")}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-white/50" />
          </div>
          <input 
            type="text" 
            placeholder="Search... /" 
            className="bg-white/10 w-full rounded-md py-1.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/30" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onClick={handleSearchClick}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map(item => {
              const isActive = location === item.path || 
                (item.path === '/dashboard' && location === '/') ||
                (item.path !== '/dashboard' && location.startsWith(item.path));
              
              return (
                <li key={item.name}>
                  <SidebarItem
                    icon={item.icon}
                    label={item.name}
                    href={item.path}
                    active={isActive}
                    collapsed={collapsed}
                  />
                </li>
              );
            })}
          </ul>
          
          {/* Divider and Favorites section */}
          <div className="mt-4 mb-2 px-3">
            <div className="h-px bg-white/10"></div>
          </div>
          
          {!collapsed && (
            <div className="px-4 mb-2 flex justify-between items-center">
              <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Favorites
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleAddFavorite} className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" aria-label="Add favorite">
                    <Plus className="h-4 w-4 text-white/50 hover:text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Add favorite
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          
          <ul className="space-y-1 px-2">
            {filteredFavoriteItems.map((item, index) => {
              const isActive = location === item.path;
              const ItemIcon = item.icon;
              const isDragging = draggedItem === index;
              const isDropTarget = dropTarget === index;
              const showDragPosition = isDropTarget && draggedItem !== null;
              
              return (
                <li 
                  key={item.name} 
                  className={cn(
                    "group relative",
                    isDragging && "opacity-50",
                    showDragPosition && "relative"
                  )}
                  draggable={!collapsed} 
                  onDragStart={() => handleDragStart(index)} 
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={() => handleDrop(index)}
                >
                  {/* Drop indicator line */}
                  {showDragPosition && (
                    <div className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10" 
                        style={{ 
                          top: draggedItem < index ? 'auto' : '0', 
                          bottom: draggedItem < index ? '0' : 'auto' 
                        }} 
                    />
                  )}
                  
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={item.path}>
                          <a className={cn("flex items-center justify-center rounded-md p-2 group", 
                            isActive ? "bg-[#005EE1] text-white" : "text-white/80 hover:bg-white/10 hover:text-white")}>
                            <ItemIcon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/80")} />
                          </a>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="relative flex items-center">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-white/50" />
                      </div>
                      <Link href={item.path}>
                        <a className={cn(
                          "flex items-center rounded-md px-3 py-2 pr-8 pl-6 w-full transition-colors",
                          isActive ? "bg-[#005EE1] text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                        )}>
                          <ItemIcon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/80")} />
                          <span className="ml-3 text-sm truncate">{item.name}</span>
                        </a>
                      </Link>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => handleRemoveFavorite(item)} className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/20" aria-label={`Remove ${item.name} from favorites`}>
                            <Star className="h-4 w-4 text-white/70 hover:text-white fill-white/70 hover:fill-white" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Remove favorite
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          
          {/* Administration section */}
          {user && (user.role === "admin" || user.role === "firm_admin") && (
            <div className={cn("mt-4", collapsed && "px-0")}>
              <div className="mt-4 mb-2 px-3">
                <div className="h-px bg-white/10"></div>
              </div>
              
              {!collapsed && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
              )}
              
              <ul className="space-y-1 px-2">
                <li>
                  <SidebarItem
                    icon={Settings}
                    label="User Management"
                    href="/admin/users"
                    active={location === "/admin/users"}
                    collapsed={collapsed}
                  />
                </li>
                <li>
                  <SidebarItem
                    icon={Settings}
                    label="Organizations"
                    href="/admin/organizations"
                    active={location === "/admin/organizations"}
                    collapsed={collapsed}
                  />
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Collapse toggle */}
        <div className="p-4 border-t border-white/10">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center w-full text-white/80 hover:text-white">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <div className="flex items-center justify-between w-full">
                <span className="text-sm">Collapse</span>
                <ChevronLeft className="h-5 w-5" />
              </div>}
          </button>
        </div>
      </div>
      
      {/* Report Search Dialog */}
      <ReportSearchDialog 
        open={isReportDialogOpen} 
        onOpenChange={setIsReportDialogOpen} 
        favoriteReports={favoriteItems} 
        onAddFavorite={addFavoriteReportFromDialog} 
      />
      
      {/* Command Palette */}
      <CommandPalette 
        open={commandDialogOpen} 
        onOpenChange={setCommandDialogOpen} 
      />
      
      {/* Firm Registration Modal */}
      <FirmRegistrationModal 
        open={firmRegistrationOpen} 
        onOpenChange={setFirmRegistrationOpen} 
        onSubmit={handleFirmRegistrationSubmit}
      />
    </TooltipProvider>
  );
};
