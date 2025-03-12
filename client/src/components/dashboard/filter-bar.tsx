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

export function FilterBar({ user, onFilterChange }: FilterBarProps) {
  const [selectedFirm, setSelectedFirm] = useState<number | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<number | null>(null);
  
  // Fetch firms based on user role
  const { data: firms = [] } = useQuery<Firm[]>({
    queryKey: [user.role === 'home_office' ? '/api/organizations/firms' : '/api/organizations'],
    enabled: !!user && (user.role === 'home_office' || user.role === 'global_admin'),
  });
  
  // Fetch advisors based on selected firm or user role
  const { data: advisors = [] } = useQuery<Advisor[]>({
    queryKey: [
      selectedFirm 
        ? `/api/organizations/${selectedFirm}/advisors` 
        : user.role === 'firm_admin' 
          ? `/api/organizations/${user.organizationId}/advisors`
          : `/api/advisors`
    ],
    enabled: !!user && (selectedFirm !== null || user.role === 'firm_admin' || user.role === 'home_office' || user.role === 'global_admin'),
  });
  
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
  }, [selectedFirm, selectedAdvisor, onFilterChange]);
  
  // Reset all filters
  const handleReset = () => {
    setSelectedFirm(null);
    setSelectedAdvisor(null);
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
          value={selectedFirm ? selectedFirm.toString() : ""}
          onValueChange={(value) => setSelectedFirm(value ? parseInt(value) : null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Firms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Firms</SelectItem>
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
  
  const renderAdvisorFilter = () => {
    if (!user || user.role === 'financial_advisor') {
      return null;
    }
    
    return (
      <div className="filter-item">
        <span className="text-xs font-medium text-neutral-500 mb-1 block">Advisor</span>
        <Select
          value={selectedAdvisor ? selectedAdvisor.toString() : ""}
          onValueChange={(value) => setSelectedAdvisor(value ? parseInt(value) : null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Advisors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Advisors</SelectItem>
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
      </div>
      {renderActiveFilters()}
    </div>
  );
}