
import React, { useState, useEffect, useCallback } from "react";
import { Bell, Search, ChevronDown, Building, User, PieChart, FileText, Settings, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// Define advisor names
const ADVISORS = [
  { id: "firm", name: "Firm Overview" },
  { id: "advisor1", name: "Maria Reynolds" },
  { id: "advisor2", name: "Thomas Chen" },
  { id: "advisor3", name: "Aisha Patel" },
  { id: "advisor4", name: "Jackson Miller" }
];

// Define navigation links for search
const NAVIGATION_LINKS = [
  { name: "Dashboard", href: "/", icon: Building },
  { name: "Reporting", href: "/reporting", icon: FileText },
  { name: "Clients", href: "/clients", icon: User },
  { name: "Valuation", href: "/valuation", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
];

// Define all reports for search
const REPORTS = [
  { name: "Performance Summary", category: "Performance", href: "/reporting#performance" },
  { name: "Asset Allocation", category: "Portfolio", href: "/reporting#allocation" },
  { name: "Fee Analysis", category: "Revenue", href: "/reporting#fees" },
  { name: "Client Retention", category: "Clients", href: "/reporting#retention" },
  { name: "Revenue Forecast", category: "Revenue", href: "/reporting#forecast" },
  { name: "Advisor Productivity", category: "Performance", href: "/reporting#productivity" },
  { name: "New Accounts", category: "Growth", href: "/reporting#new-accounts" },
  { name: "Geographic Footprint", category: "Clients", href: "/reporting#geography" },
];

// Mock data for quick queries
const QUICK_QUERIES = [
  "Show me client growth over last quarter",
  "Identify top performing advisors",
  "Analyze client retention rates",
  "Generate annual performance summary",
  "Compare advisor metrics year over year"
];

interface HeaderProps {
  children?: React.ReactNode;
  title?: string;
  onToggleView?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ children, title, onToggleView }) => {
  const { pathname } = useLocation();
  const [selectedView, setSelectedView] = useState<string>("firm");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"search" | "ai">("search");
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Default title or use the provided title prop
  const pageTitle = title || getPageTitle(pathname);

  // Effect to initialize view based on localStorage
  useEffect(() => {
    const storedView = localStorage.getItem("selectedAdvisorView");
    if (storedView) {
      setSelectedView(storedView);
    }
  }, []);
  
  // Add keyboard shortcut handler for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K (for Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // Prevent default browser behavior
        setSearchOpen(true);
        setSearchMode("search");
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleViewChange = (value: string) => {
    setSelectedView(value);
    localStorage.setItem("selectedAdvisorView", value);
    
    if (onToggleView) {
      onToggleView(value);
    }
  };
  
  // Only show advisor selector on dashboard page
  const showSelector = pathname === '/';
  
  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div className="flex items-center">
          {children}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/048cb824-541a-4e81-bb8f-a6e495fa8272.png" 
              alt="Vitals AI - Advisor Intelligence" 
              className="h-10 mr-4"
            />
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showSelector && (
            <div className="hidden md:block min-w-[180px]">
              <Select value={selectedView} onValueChange={handleViewChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Advisor" />
                </SelectTrigger>
                <SelectContent>
                  {ADVISORS.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div 
            className="relative cursor-pointer"
            onClick={() => {
              setSearchOpen(true);
              setSearchMode("search");
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          >
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${searchFocused ? 'h-5 w-5' : 'h-4 w-4'}`} />
            <Input
              type="search"
              placeholder="Search... (Ctrl+K)"
              className={`pl-10 transition-all duration-300 ease-in-out ${searchFocused ? 'w-80 text-lg' : 'w-64 text-base'}`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              readOnly
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">New message</span>
                  <span className="text-xs text-muted-foreground">5 min ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Sales goal reached</span>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
        mode={searchMode}
      >
        <CommandInput 
          placeholder={searchMode === "search" ? "Search across the platform... (Ctrl+K)" : "Ask AI a question about your data..."}
          mode={searchMode}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {searchMode === "search" && (
            <>
              <CommandGroup heading="Navigation">
                {NAVIGATION_LINKS.map((link) => (
                  <CommandItem
                    key={link.href}
                    value={link.name}
                    onSelect={() => {
                      window.location.href = link.href;
                      setSearchOpen(false);
                    }}
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    <span>{link.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup heading="Reports">
                {REPORTS.map((report, index) => (
                  <CommandItem
                    key={index}
                    value={`${report.name} ${report.category}`}
                    onSelect={() => {
                      window.location.href = report.href;
                      setSearchOpen(false);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{report.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({report.category})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup heading="Ask AI">
                <CommandItem 
                  onSelect={() => {
                    setSearchMode("ai");
                  }}
                  className="py-3 px-2"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                  <span>Switch to AI Assistant</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          
          {searchMode === "ai" && (
            <>
              <CommandGroup heading="Popular Questions">
                {QUICK_QUERIES.map((query, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      // This would trigger the AI query in the future
                      console.log("AI Query:", query);
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                    <span>{query}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandSeparator />
              
              <div className="p-4 text-center text-xs text-muted-foreground">
                <p className="mb-2">
                  AI suggestions are based on your firm's data. Ask any question related to your clients, 
                  advisors, or business metrics.
                </p>
                <p>
                  Not finding what you need? Type your question in the search bar above.
                </p>
              </div>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

// Helper function to determine the page title based on the current route
function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/reporting':
      return 'Reporting';
    case '/clients':
      return 'Clients';
    case '/valuation':
      return 'Valuation';
    case '/calendar':
      return 'Calendar';
    case '/messages':
      return 'Messages';
    case '/profile':
      return 'Profile';
    case '/notifications':
      return 'Notifications';
    case '/settings':
      return 'Settings';
    default:
      return 'Dashboard';
  }
}
