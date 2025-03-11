import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { User } from "@shared/schema";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TopNavProps {
  user: User | null;
  toggleSidebar: () => void;
}

export function TopNav({ user, toggleSidebar }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-neutral-200 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex md:hidden">
          <button
            type="button"
            className="text-neutral-500 hover:text-neutral-600"
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-between md:justify-end">
          {/* Search bar (hidden on mobile) */}
          <div className="relative hidden md:block max-w-md w-full mx-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-neutral-400">search</span>
            </div>
            <Input
              type="text"
              placeholder="Search clients, reports..."
              className="pl-10 pr-3 bg-neutral-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Notification and Profile dropdown */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-600">
              <span className="material-icons">notifications</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-600">
              <span className="material-icons">help_outline</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <span className="hidden md:block text-sm font-medium text-neutral-700">{user.fullName}</span>
                  <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm">
                    {user.fullName.split(' ').map(name => name[0]).join('')}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <div className="cursor-pointer">Profile</div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <div className="cursor-pointer">Settings</div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
