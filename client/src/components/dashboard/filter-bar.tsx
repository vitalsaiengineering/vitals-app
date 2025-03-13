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
  id: string;
  name: string;
  email: string;
  account?: string;
  excluded_from_assignments?: boolean;
}

export function FilterBar({ user, onFilterChange }: FilterBarProps) {
  const [selectedFirm, setSelectedFirm] = useState<number | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<number | null>(null);
  const [selectedWealthboxUser, setSelectedWealthboxUser] = useState<string | null>(null);
  
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
    enabled: !!user && (user.role === 'client_admin' || user.role === 'firm_admin' || user.role === 'home_office' || user.role === 'global_admin'),
  });
  
  // Fetch Wealthbox users if the user has a Wealthbox token
  const { data: wealthboxStatus } = useQuery<{ connected: boolean; tokenExpiry: string | null; authorized: boolean }>({
    queryKey: ['/api/wealthbox/status'],
    enabled: !!user,
  });
  
  const { data: wealthboxUsersResponse } = useQuery<{ success: boolean; data: { users: WealthboxUser[] } }>({
    queryKey: ['/api/wealthbox/users'],
    queryFn: async () => {
      if (!wealthboxStatus?.connected || !wealthboxStatus?.tokenExpiry) {
        return { success: false, data: { users: [] } };
      }
      
      // Use the token from wealthbox status
      const accessToken = "a362b9c57ca349e5af99a6d8d4af6b3a"; // Example token for development
      return getWealthboxUsers(accessToken);
    },
    enabled: !!(wealthboxStatus?.connected && wealthboxStatus?.tokenExpiry),
  });
  
  // Extract the users from the response
  const wealthboxUsers = wealthboxUsersResponse?.success ? wealthboxUsersResponse.data.users : [];
  
  // Reset advisor selection when firm changes
  useEffect(() => {
    setSelectedAdvisor(null);
  }, [selectedFirm]);
  
  // Apply filters when selections change
  useEffect(() => {
    onFilterChange({
      firmId: selectedFirm,
      advisorId: selectedAdvisor
    });
    
    // If we have wealthbox integration, we could pass this to a parent component as well
    // Currently just logging it
    if (selectedWealthboxUser) {
      console.log('Selected Wealthbox User:', selectedWealthboxUser);
    }
  }, [selectedFirm, selectedAdvisor, selectedWealthboxUser, onFilterChange]);
  
  // Reset all filters
  const handleReset = () => {
    setSelectedFirm(null);
    setSelectedAdvisor(null);
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
  
  // Render Wealthbox users filter
  const renderWealthboxUsersFilter = () => {
    if (!wealthboxStatus?.connected || !wealthboxUsers?.length) {
      return null;
    }
    
    return (
      <div className="filter-item">
        <span className="text-xs font-medium text-neutral-500 mb-1 block">Wealthbox User</span>
        <Select
          value={selectedWealthboxUser || "all"}
          onValueChange={(value) => setSelectedWealthboxUser(value && value !== "all" ? value : null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Wealthbox Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wealthbox Users</SelectItem>
            {wealthboxUsers.map((wbUser) => (
              <SelectItem key={wbUser.id} value={wbUser.id}>
                {wbUser.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  const renderAdvisorFilter = () => {
    if (!user || user.role === 'financial_advisor') {
      return null;
    }
    
    return (
      <div className="filter-item">
        <span className="text-xs font-medium text-neutral-500 mb-1 block">Advisor</span>
        <Select
          value={selectedAdvisor ? selectedAdvisor.toString() : "all"}
          onValueChange={(value) => setSelectedAdvisor(value && value !== "all" ? parseInt(value) : null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Advisors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Advisors</SelectItem>
            {advisors.map((advisor) => (
              <SelectItem key={advisor.id} value={advisor.id.toString()}>
                {advisor.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  // Show active filters
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (selectedFirm) {
      const firm = firms.find(f => f.id === selectedFirm);
      if (firm) {
        activeFilters.push(`Firm: ${firm.name}`);
      }
    }
    
    if (selectedAdvisor) {
      const advisor = advisors.find(a => a.id === selectedAdvisor);
      if (advisor) {
        activeFilters.push(`Advisor: ${advisor.fullName}`);
      }
    }
    
    if (selectedWealthboxUser) {
      const wbUser = wealthboxUsers.find(u => u.id === selectedWealthboxUser);
      if (wbUser) {
        activeFilters.push(`Wealthbox: ${wbUser.name}`);
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
        {renderAdvisorFilter()}
        {renderWealthboxUsersFilter()}
      </div>
      {renderActiveFilters()}
    </div>
  );
}