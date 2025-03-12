import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Card, CardContent } from "@/components/ui/card";
import { User, Organization } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

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
  
  // Fetch firms (only for home_office users)
  const { data: firms = [] } = useQuery<Firm[]>({
    queryKey: ['/api/organizations/firms'],
    enabled: user?.role === 'home_office',
  });
  
  // Fetch advisors based on selected firm or user's organization
  const { data: advisors = [], refetch: refetchAdvisors } = useQuery<Advisor[]>({
    queryKey: ['/api/users/advisors', selectedFirm],
    enabled: user?.role === 'home_office' || user?.role === 'firm_admin',
  });
  
  // Update advisors list when firm selection changes
  useEffect(() => {
    if (selectedFirm) {
      refetchAdvisors();
    }
  }, [selectedFirm, refetchAdvisors]);
  
  // Notify parent component when filters change
  useEffect(() => {
    onFilterChange({
      firmId: selectedFirm,
      advisorId: selectedAdvisor
    });
  }, [selectedFirm, selectedAdvisor, onFilterChange]);
  
  // Don't show filter bar for financial advisors
  if (user?.role === 'financial_advisor') {
    return null;
  }
  
  // Reset advisor selection when firm changes
  const handleFirmChange = (firmId: string) => {
    const id = firmId ? parseInt(firmId) : null;
    setSelectedFirm(id);
    setSelectedAdvisor(null);
  };
  
  const handleAdvisorChange = (advisorId: string) => {
    setSelectedAdvisor(advisorId ? parseInt(advisorId) : null);
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {user?.role === 'home_office' && (
            <div className="w-full md:w-1/3">
              <Label htmlFor="firm-filter" className="mb-2 block">
                Firm
              </Label>
              <Select onValueChange={handleFirmChange} value={selectedFirm?.toString() || ''}>
                <SelectTrigger id="firm-filter">
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
          )}
          
          <div className="w-full md:w-1/3">
            <Label htmlFor="advisor-filter" className="mb-2 block">
              Financial Advisor
            </Label>
            <Select 
              onValueChange={handleAdvisorChange} 
              value={selectedAdvisor?.toString() || ''}
              disabled={user?.role === 'home_office' && !selectedFirm}
            >
              <SelectTrigger id="advisor-filter">
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
        </div>
      </CardContent>
    </Card>
  );
}