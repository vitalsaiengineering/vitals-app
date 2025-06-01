import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Calendar, BarChart3, TrendingUp, FileText, Star } from 'lucide-react';

interface FiltersState {
  dateRange: string;
  advisor: string;
  clientSegment: string;
}

interface FiltersSidebarProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  onApplyFilters: () => void;
}

const recentReports = [
  { id: '1', name: 'Client Demographics', icon: BarChart3 },
  { id: '2', name: 'AUM & Revenue', icon: TrendingUp },
  { id: '3', name: 'Client Growth', icon: TrendingUp },
];

const favoriteReports = [
  { id: '1', name: 'Q2 2024 Business Review', icon: FileText },
  { id: '2', name: 'Annual Client Demograp...', icon: BarChart3 },
  { id: '3', name: 'Revenue Growth 2023-2...', icon: TrendingUp },
];

export default function FiltersSidebar({ filters, onFiltersChange, onApplyFilters }: FiltersSidebarProps) {
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="w-64 bg-background border-r border-border h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Filters Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date Range
              </label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                  <SelectItem value="year-to-date">Year to Date</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advisor Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Advisor
              </label>
              <Select
                value={filters.advisor}
                onValueChange={(value) => handleFilterChange('advisor', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select advisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-advisors">All Advisors</SelectItem>
                  <SelectItem value="john-smith">John Smith</SelectItem>
                  <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="michael-chen">Michael Chen</SelectItem>
                  <SelectItem value="emily-davis">Emily Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Segment Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Client Segment
              </label>
              <Select
                value={filters.clientSegment}
                onValueChange={(value) => handleFilterChange('clientSegment', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-segments">All Segments</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Filters Button */}
            <Button 
              onClick={onApplyFilters}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Recent Reports Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Reports</h3>
          <div className="space-y-1">
            {recentReports.map((report) => (
              <Button
                key={report.id}
                variant="ghost"
                className="w-full justify-start h-auto p-2 text-sm"
              >
                <report.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-left truncate">{report.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Favorite Reports Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Favorite Reports</h3>
          <div className="space-y-1">
            {favoriteReports.map((report) => (
              <Button
                key={report.id}
                variant="ghost"
                className="w-full justify-start h-auto p-2 text-sm"
              >
                <report.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-left truncate">{report.name}</span>
                <Star className="h-3 w-3 ml-auto text-yellow-500 fill-current" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}