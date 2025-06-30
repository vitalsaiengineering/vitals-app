import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Users, Target, Filter, X } from 'lucide-react';
import { useReportFilters } from '@/contexts/ReportFiltersContext';
import { FilterSidebarSkeleton } from '@/components/ui/skeleton';

const FiltersSidebar: React.FC = () => {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    filterOptions, 
    isLoading, 
    applyFilters, 
    hasActiveFilters 
  } = useReportFilters();

  if (isLoading) {
    return (
      <div className="w-64 bg-background border-r border-border">
        <FilterSidebarSkeleton />
      </div>
    );
  }

  const handleDateRangeChange = (preset: string) => {
    setFilters({
      dateRange: { preset }
    });
  };

  const handleAdvisorChange = (advisorId: string) => {
    if (!advisorId || advisorId === '' || advisorId === 'all') {
      setFilters({ advisorIds: [] });
    } else {
      setFilters({ advisorIds: [advisorId] });
    }
  };

  const handleSegmentChange = (segment: string) => {
    if (!segment || segment === '' || segment === 'all') {
      setFilters({ segments: [] });
    } else {
      setFilters({ segments: [segment] });
    }
  };

  const getSelectedAdvisorLabel = () => {
    if (filters.advisorIds.length === 0) return 'All Advisors';
    if (filters.advisorIds.length === 1) {
      const advisor = filterOptions?.advisors.find(a => a.id === filters.advisorIds[0]);
      return advisor?.name || 'Unknown Advisor';
    }
    return `${filters.advisorIds.length} Advisors`;
  };

  const getSelectedSegmentLabel = () => {
    if (filters.segments.length === 0) return 'All Segments';
    if (filters.segments.length === 1) {
      return filters.segments[0].charAt(0).toUpperCase() + filters.segments[0].slice(1);
    }
    return `${filters.segments.length} Segments`;
  };

  const getDateRangeLabel = () => {
    switch (filters.dateRange.preset) {
      case 'last12months':
        return 'Last 12 Months';
      case 'ytd':
        return 'Year to Date';
      case 'last6months':
        return 'Last 6 Months';
      case 'last3months':
        return 'Last 3 Months';
      case 'lastmonth':
        return 'Last Month';
      default:
        return 'Last 12 Months';
    }
  };

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Date Range Filter */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Date Range</Label>
          </div>
          <Select 
            value={filters.dateRange.preset || 'last12months'} 
            onValueChange={handleDateRangeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="lastmonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Advisor Filter */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Advisor</Label>
          </div>
          <Select 
            value={filters.advisorIds.length === 1 ? filters.advisorIds[0] : 'all'} 
            onValueChange={handleAdvisorChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select advisor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Advisors</SelectItem>
              {filterOptions?.advisors.map((advisor) => (
                <SelectItem key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Client Segment Filter */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Client Segment</Label>
          </div>
          <Select 
            value={filters.segments.length === 1 ? filters.segments[0] : 'all'} 
            onValueChange={handleSegmentChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {filterOptions?.segments.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
        
        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-3 space-y-2 p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">Active Filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.dateRange.preset !== 'last12months' && (
                <Badge variant="secondary" className="text-xs">
                  {getDateRangeLabel()}
                </Badge>
              )}
              {filters.advisorIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getSelectedAdvisorLabel()}
                </Badge>
              )}
              {filters.segments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getSelectedSegmentLabel()}
                </Badge>
              )}
            </div>
          </div>
        )}
      {/* Apply Filters Button */}
      <div className="p-4 border-t border-border">
        <Button 
          onClick={applyFilters} 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          disabled={!hasActiveFilters}
        >
          Apply Filters
        </Button>

      </div>
    </div>
  );
};

export default FiltersSidebar;