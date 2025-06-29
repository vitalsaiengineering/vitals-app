import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dataService } from '@/lib/clientData';

// Filter interfaces
export interface ReportFilters {
  dateRange: {
    startDate?: string;
    endDate?: string;
    preset?: string; // 'last12months', 'ytd', etc.
  };
  advisorIds: string[];
  segments: string[];
  stateCode?: string;
  ageRange?: {
    min?: number;
    max?: number;
  };
  aumRange?: {
    min?: number;
    max?: number;
  };
  inceptionDateRange?: {
    startDate?: string;
    endDate?: string;
  };
  birthMonths: number[];
  anniversaryMonths: number[];
  inceptionYears: number[];
  referrerIds: string[];
  tenureYears: number[];
}

export interface FilterOptions {
  advisors: { id: string; name: string }[];
  segments: string[];
  states: { code: string; name: string }[];
  years: number[];
  referrers: { id: string; name: string }[];
}

interface ReportFiltersContextType {
  filters: ReportFilters;
  setFilters: (filters: Partial<ReportFilters>) => void;
  resetFilters: () => void;
  filterOptions: FilterOptions | null;
  isLoading: boolean;
  error: string | null;
  applyFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: ReportFilters = {
  dateRange: {
    preset: 'last12months'
  },
  advisorIds: [],
  segments: [],
  stateCode: '',
  ageRange: {},
  aumRange: {},
  inceptionDateRange: {},
  birthMonths: [],
  anniversaryMonths: [],
  inceptionYears: [],
  referrerIds: [],
  tenureYears: []
};

const ReportFiltersContext = createContext<ReportFiltersContextType | undefined>(undefined);

export const useReportFilters = () => {
  const context = useContext(ReportFiltersContext);
  if (context === undefined) {
    throw new Error('useReportFilters must be used within a ReportFiltersProvider');
  }
  return context;
};

interface ReportFiltersProviderProps {
  children: ReactNode;
}

export const ReportFiltersProvider: React.FC<ReportFiltersProviderProps> = ({ children }) => {
  const [filters, setFiltersState] = useState<ReportFilters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load filter options once on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await dataService.fetchData("clients/filters");
        setFilterOptions(response.data as FilterOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load filter options");
        console.error("Error loading filter options:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  const setFilters = (newFilters: Partial<ReportFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
  };

  const applyFilters = () => {
    // This function can be used to trigger any side effects when filters are applied
    // For now, it's mainly for UI feedback
    console.log('Applying filters:', filters);
  };

  // Check if any filters are active (not default values)
  const hasActiveFilters = React.useMemo(() => {
    return (
      filters.advisorIds.length > 0 ||
      filters.segments.length > 0 ||
      filters.stateCode !== '' ||
      (filters.ageRange?.min !== undefined || filters.ageRange?.max !== undefined) ||
      (filters.aumRange?.min !== undefined || filters.aumRange?.max !== undefined) ||
      filters.birthMonths.length > 0 ||
      filters.anniversaryMonths.length > 0 ||
      filters.inceptionYears.length > 0 ||
      filters.referrerIds.length > 0 ||
      filters.tenureYears.length > 0 ||
      filters.dateRange.preset !== 'last12months'
    );
  }, [filters]);

  const value: ReportFiltersContextType = {
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    isLoading,
    error,
    applyFilters,
    hasActiveFilters
  };

  return (
    <ReportFiltersContext.Provider value={value}>
      {children}
    </ReportFiltersContext.Provider>
  );
}; 