import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { User, Organization } from "@shared/schema";
import { getWealthboxUsers } from "@/lib/api";

interface FilterBarProps {
  user: User;
  onFilterChange: (filters: { 
    firmId: number | null; 
    advisorId: number | null;
    wealthboxUserId: number | null;
  }) => void;
}

interface Firm extends Organization {
  id: number;
  name: string;
}

interface Advisor {
  id: number;
  fullName: string;
  organizationId: number;
}

interface WealthboxUser {
  id: number;  // Wealthbox API returns numeric IDs
  name: string;
  email: string;
  account?: number;
  excluded_from_assignments?: boolean;
}

export function FilterBar({ user, onFilterChange }: FilterBarProps) {
  const [selectedFirm, setSelectedFirm] = useState<number | null>(null);
  // Removed selectedAdvisor state since we're only using WealthBox users now
  const [selectedWealthboxUser, setSelectedWealthboxUser] = useState<number | null>(null);
  
  // Fetch firms based on user role
  const { data: firms = [] } = useQuery<Firm[]>({
    queryKey: [user.role === 'home_office' ? '/api/organizations/firms' : '/api/organizations'],
    enabled: !!user && (user.role === 'home_office' || user.role === 'global_admin'),
  });
  
  // Fetch advisors based on selected firm or user role
  const { data: advisors = [] } = useQuery<Advisor[]>({
    queryKey: ['/api/users/advisors', selectedFirm],
    queryFn: async () => {
      const url = new URL('/api/users/advisors', window.location.origin);
      if (selectedFirm) url.searchParams.append('firmId', selectedFirm.toString());
      
      const response = await fetch(url.toString(), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch advisors');
      return response.json();
    },
    enabled: !!user && (user.role === 'firm_admin' || user.role === 'firm_admin' || user.role === 'home_office' || user.role === 'global_admin'),
  });
  
  // Fetch Wealthbox users if the user has a Wealthbox token
  const { data: wealthboxStatus } = useQuery<{ connected: boolean; tokenExpiry: string | null; authorized: boolean }>({
    queryKey: ['/api/wealthbox/status'],
    enabled: !!user,
  });
  
  const { data: wealthboxUsersResponse } = useQuery<{ success: boolean; data: { users: WealthboxUser[] } }>({
    queryKey: ['/api/wealthbox/users'],
    queryFn: async () => {
      console.log("Fetching Wealthbox users with status:", wealthboxStatus);
      
      // Use the new token provided by the user
      const accessToken = "34b27e49093743a9ad58b9b793c12bc9"; // Updated API key
      try {
        const result = await getWealthboxUsers(accessToken);
        console.log("Wealthbox users response:", result);
        return result;
      } catch (error) {
        console.error("Error fetching Wealthbox users:", error);
        return { success: false, data: { users: [] } };
      }
    },
    enabled: true, // Always try to fetch users
  });
  
  // Extract the users from the response
  const wealthboxUsers = wealthboxUsersResponse?.success ? wealthboxUsersResponse.data.users : [];
  
  // Apply filters when selections change
  useEffect(() => {
    onFilterChange({
      firmId: selectedFirm,
      advisorId: null, // No longer using the advisorId filter
      wealthboxUserId: selectedWealthboxUser
    });
  }, [selectedFirm, selectedWealthboxUser, onFilterChange]);
  
  // Reset all filters
  const handleReset = () => {
    setSelectedFirm(null);
    setSelectedWealthboxUser(null);
  };
  
  // Render filter options based on user role
  const renderFirmFilter = () => {
    if (!user || (user.role !== 'home_office' && user.role !== 'global_admin')) {
      return null;
    }
    
    return (
      <div className="filter-item">
        <span className="text-xs font-medium text-neutral-500 mb-1 block">Firm</span>
        <Select
          value={selectedFirm ? selectedFirm.toString() : "all"}
          onValueChange={(value) => setSelectedFirm(value && value !== "all" ? parseInt(value) : null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Firms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Firms</SelectItem>
            {firms.map((firm) => (
              <SelectItem key={firm.id} value={firm.id.toString()}>
                {firm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  // Render Wealthbox users filter (now labeled simply as "Advisor")
  const renderWealthboxUsersFilter = () => {
    console.log("Rendering Wealthbox users filter, users:", wealthboxUsers);
    
    if (!wealthboxUsers?.length) {
      console.log("No Wealthbox users to display");
      return null;
    }
    
    return (
      <div className="filter-item">
        <span className="text-xs font-medium text-neutral-500 mb-1 block">Advisor</span>
        <Select
          value={selectedWealthboxUser ? selectedWealthboxUser.toString() : "all"}
          onValueChange={(value) => setSelectedWealthboxUser(value && value !== "all" ? parseInt(value) : null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Advisors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Advisors</SelectItem>
            {wealthboxUsers.map((wbUser) => (
              <SelectItem key={wbUser.id} value={wbUser.id.toString()}>
                {wbUser.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  // Removed the renderAdvisorFilter function as requested
  
  // Show active filters
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (selectedFirm) {
      const firm = firms.find(f => f.id === selectedFirm);
      if (firm) {
        activeFilters.push(`Firm: ${firm.name}`);
      }
    }
    
    // Removed selectedAdvisor code since we're only using WealthBox users now
    
    if (selectedWealthboxUser) {
      const wbUser = wealthboxUsers.find(u => u.id === selectedWealthboxUser);
      if (wbUser) {
        activeFilters.push(`Advisor: ${wbUser.name}`);
      }
    }
    
    if (activeFilters.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {activeFilters.map((filter, index) => (
          <Badge key={index} variant="outline" className="bg-primary-50 text-primary-800 border-primary-200">
            {filter}
          </Badge>
        ))}
        <Button 
          variant="link" 
          size="sm" 
          className="text-neutral-500 h-6 px-2"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    );
  };
  
  return (
    <div className="filter-bar mt-4 p-3 bg-white rounded-lg border border-neutral-200">
      <div className="flex flex-wrap gap-4">
        {renderFirmFilter()}
        {renderWealthboxUsersFilter()}
      </div>
      {renderActiveFilters()}
    </div>
  );
}