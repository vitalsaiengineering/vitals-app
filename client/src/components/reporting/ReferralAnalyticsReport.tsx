import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { getClients } from "@/lib/clientData";
import { filtersToApiParams } from "@/utils/filter-utils";
import { StandardClient } from "@/types/client";
import { formatAUM, getPrettyClientName, getSegmentName } from "@/utils/client-analytics";
import { ReportSkeleton } from "@/components/ui/skeleton";
import { getAdvisorReportTitle } from '@/lib/utils';
import { ViewContactButton } from "@/components/ui/view-contact-button";
import { ExternalLink } from "lucide-react";


// Define sort configuration type
type SortConfig = {
  key: keyof ReferralClient;
  direction: 'asc' | 'desc';
};

// Define types locally
interface ReferralClient {
  id: string;
  clientName: string;
  segment: string;
  primaryAdvisor: string;
  aum: number;
  referralDate: string;
  referredBy: string;
  wealthboxClientId?: string;
  orionClientId?: string;
}

interface ReferralSource {
  id: string;
  name: string;
  company?: string;
  totalReferrals: number;
  totalAUM: number;
  percentage: number;
  clients: ReferralClient[];
}

interface ReferralAnalyticsData {
  totalReferrals: number;
  totalAUM: number;
  referralSources: ReferralSource[];
  allReferrals: ReferralClient[];
  filterOptions: {
    referrers: Array<{ id: string; name: string; }>;
  };
}

// Colors for the pie chart
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

// Update the grade badge styling function
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, string> = {
    Platinum: 'bg-violet-100 text-violet-800',
    Gold: 'bg-amber-100 text-amber-800', 
    Silver: 'bg-gray-100 text-gray-800',
    'N/A': 'bg-gray-100 text-gray-800',
  };
  return GRADE_COLORS[grade] || 'bg-gray-100 text-gray-800';
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Transform StandardClient to ReferralClient
const transformToReferralClient = (client: StandardClient, advisors?: { id: string; name: string }[]): ReferralClient => ({
  id: client.id,
  clientName: getPrettyClientName(client),
  segment: getSegmentName(client.segment),
  primaryAdvisor: getAdvisorDisplayName(client.primaryAdvisorId || '', advisors),
  aum: Number(client.aum) || 0,
  referralDate: client.inceptionDate || new Date().toISOString(),
  referredBy: getAdvisorDisplayName(client.referredBy || 'direct', advisors),
  wealthboxClientId: client.wealthboxClientId,
  orionClientId: client.orionClientId
});

// Helper function to convert advisor ID to advisor name
const getAdvisorDisplayName = (advisorId: string, advisors?: { id: string; name: string }[]): string => {
  if (!advisorId || advisorId === '' || advisorId === 'direct') {
    return 'N/A';
  }

  if (!advisors) {
    return advisorId;
  }

  // Find advisor by ID
  const advisor = advisors.find(a => Number(a.id) === Number(advisorId));
  if (advisor) {
    return advisor.name;
  }

  // If no advisor found, return a user-friendly message
  return `Unknown Advisor (${advisorId})`;
};

// Generate ReferralAnalyticsData from StandardClient array
const generateReferralAnalyticsFromClients = (clients: StandardClient[], advisors?: { id: string; name: string }[]): ReferralAnalyticsData => {
  // Filter only clients that have referral information
  const referredClients = clients.filter(client => Boolean(client.referredBy));
  
  // Create referral source mapping with proper names
  const referralSourceMap = new Map<string, { displayName: string; clients: ReferralClient[] }>();
  
  referredClients.forEach(client => {
    const referralId = client.referredBy || 'direct';
    const displayName = getAdvisorDisplayName(referralId, advisors);
    const transformedClient = transformToReferralClient(client, advisors);
    
    if (!referralSourceMap.has(referralId)) {
      referralSourceMap.set(referralId, {
        displayName,
        clients: []
      });
    }
    referralSourceMap.get(referralId)!.clients.push(transformedClient);
  });
  
  // Transform to ReferralClient format for allReferrals
  const allReferrals = Array.from(referralSourceMap.values()).flatMap(source => source.clients);
  
  // Calculate totals
  const totalReferrals = allReferrals.length;
  const totalAUM = allReferrals.reduce((sum, client) => sum + client.aum, 0);
  
  // Create referral sources data
  const referralSources: ReferralSource[] = Array.from(referralSourceMap.entries())
    .map(([referralId, sourceData]) => {
      const sourceAUM = sourceData.clients.reduce((sum, client) => sum + client.aum, 0);
      const percentage = totalReferrals > 0 ? Math.round((sourceData.clients.length / totalReferrals) * 100) : 0;
      
      return {
        id: sourceData.displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: sourceData.displayName,
        company: '', // Could be extracted from source name if needed
        totalReferrals: sourceData.clients.length,
        totalAUM: sourceAUM,
        percentage,
        clients: sourceData.clients.sort((a, b) => b.aum - a.aum) // Sort by AUM descending
      };
    })
    .sort((a, b) => b.totalReferrals - a.totalReferrals); // Sort by referral count descending
  
  // Create filter options
  const filterOptions = {
    referrers: [
      { id: 'all', name: 'All Referrers' },
      ...referralSources.map(source => ({ id: source.id, name: source.name }))
    ]
  };
  
  return {
    totalReferrals,
    totalAUM,
    referralSources,
    allReferrals: allReferrals.sort((a, b) => new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime()),
    filterOptions
  };
};

export default function ReferralAnalyticsReport() {
  const { filters, filterOptions } = useReportFilters();
  const [analyticsData, setAnalyticsData] = useState<ReferralAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sources');
  const [selectedReferralSource, setSelectedReferralSource] = useState<ReferralSource | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'referralDate',
    direction: 'desc'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use centralized getClients function
        const apiParams = filtersToApiParams(filters);
        const clients = await getClients(apiParams);
        const transformedData = generateReferralAnalyticsFromClients(clients, filterOptions?.advisors);
        setAnalyticsData(transformedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch report data"
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters, filterOptions]);

  // Function to handle column sorting
  const requestSort = (key: keyof ReferralClient) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: keyof ReferralClient) => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" /> 
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Apply sorting to referrals
  const getSortedReferrals = () => {
    if (!analyticsData) return [];
    
    return [...analyticsData.allReferrals].sort((a, b) => {
      const key = sortConfig.key;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      // Handle date fields
      if (key === 'referralDate') {
        return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * direction;
      }
      
      // Handle numeric fields
      if (key === 'aum') {
        return (a[key] - b[key]) * direction;
      }
      
      // Handle string fields
      const valueA = String(a[key] || '').toLowerCase();
      const valueB = String(b[key] || '').toLowerCase();
      return valueA.localeCompare(valueB) * direction;
    });
  };

  const handlePieClick = (data: any) => {
    const source = analyticsData?.referralSources.find(s => s.name === data.name);
    if (source) {
      setSelectedReferralSource(source);
    }
  };

  // Custom tooltip for pie chart
  const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: any[];
    totalReferrals: number;
  }> = ({ active, payload, totalReferrals }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Find the source by matching the name from chartData
      const source = analyticsData?.referralSources.find(s => s.name === data.name);
      const percentage = totalReferrals > 0 ? ((data.value / totalReferrals) * 100).toFixed(0) : 0;
      // Use AUM from chart data if source lookup fails
      const aumValue = source?.totalAUM ?? data.totalAUM ?? 0;
      
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200 text-sm">
          <p className="font-semibold text-gray-800">{data.name}</p>
          {source?.company && (
            <p className="text-xs text-gray-500">{source.company}</p>
          )}
          <p className="text-gray-600 mt-1">{data.value} referrals</p>
          <p className="text-gray-600">{percentage}% of total</p>
          <p className="text-green-600 font-medium">
            Total AUM: {formatAUM(aumValue)}
          </p>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  const chartData = analyticsData?.referralSources.map(source => ({
    name: source.name,
    value: source.totalReferrals,
    percentage: source.percentage,
    totalAUM: source.totalAUM // Add AUM to chart data for tooltip
  })) || [];

  const sortedReferrals = getSortedReferrals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {getAdvisorReportTitle("Referral Analytics", filters, filterOptions || undefined)}
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your top referral sources and measure their performance.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="sources">Top Referral Sources</TabsTrigger>
          <TabsTrigger value="all">All Referrals</TabsTrigger>
        </TabsList>

        {/* Top Referral Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Chart */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider text-blue-600 font-semibold">
                    Top Referral Sources
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-6">
                  {/* Donut Chart */}
                  <div className="relative">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            onClick={handlePieClick}
                            className="cursor-pointer"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                className="cursor-pointer focus:outline-none"
                                stroke="#fff"
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={<CustomTooltip totalReferrals={analyticsData?.totalReferrals || 0} />}
                            cursor={{ fill: "transparent" }}
                            wrapperStyle={{ zIndex: 10 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Total Referred</div>
                      <div className="text-4xl font-bold text-gray-900">{analyticsData?.totalReferrals || 0}</div>
                      {selectedReferralSource && (
                        <div className="text-xs text-blue-600 text-center mt-1">
                          By {selectedReferralSource.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-3">
                    {analyticsData?.referralSources.slice(0, 10).map((source, index) => (
                      <button
                        key={source.id}
                        onClick={() => setSelectedReferralSource(source)}
                        className={`flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                          selectedReferralSource?.id === source.id ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{source.name}</div>
                          <div className="text-sm text-gray-600">
                            {source.totalReferrals} ({source.percentage}%)
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Selected Referrer Details or All Clients */}
            <Card className="flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm uppercase tracking-wider text-blue-600 font-semibold">
                  {selectedReferralSource ? 
                    `Clients Referred by ${selectedReferralSource.name}` : 
                    'All Referred Clients'
                  }
                </CardTitle>
                {selectedReferralSource && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{selectedReferralSource.totalReferrals} clients</span>
                    </div>
                    <div className="text-green-600 font-semibold">
                      Total AUM: {formatAUM(selectedReferralSource.totalAUM)}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                {isLoading && <div className="p-4 text-center text-muted-foreground">Loading...</div>}
                {!isLoading && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Table Headers */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-3">
                      <div className="col-span-4">Name</div>
                      <div className="col-span-3">Segment</div>
                      <div className="col-span-3">Primary Advisor</div>
                      <div className="col-span-2 text-right">AUM</div>
                    </div>
                    
                    {/* Client List - with flex-1 to fill remaining space */}
                    <div className="space-y-0 flex-1 overflow-y-auto">
                      {selectedReferralSource ? (
                        // Show clients for selected referral source
                        selectedReferralSource.clients.slice(0, 10).map((client, index) => (
                          <div key={client.id} className="grid grid-cols-12 gap-4 items-center py-3 px-0">
                            <div className="col-span-4">
                              <div className="font-medium text-sm text-gray-900">{client.clientName}</div>
                            </div>
                            <div className="col-span-3">
                              <Badge 
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeBadgeClasses(client.segment)}`}
                              >
                                {client.segment}
                              </Badge>
                            </div>
                            <div className="col-span-3">
                              <div className="font-medium text-sm text-gray-900">{client.primaryAdvisor}</div>
                            </div>
                            <div className="col-span-2 text-right">
                              <div className="font-semibold text-green-600 text-sm">
                                {formatAUM(client.aum)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Show all clients when no specific source is selected
                        analyticsData?.allReferrals.slice(0, 15).map((client, index) => (
                          <div key={client.id} className="grid grid-cols-12 gap-4 items-center py-3 px-0">
                            <div className="col-span-4">
                              <div className="font-medium text-sm text-gray-900">{client.clientName}</div>
                            </div>
                            <div className="col-span-3">
                              <Badge 
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeBadgeClasses(client.segment)}`}
                              >
                                {client.segment}
                              </Badge>
                            </div>
                            <div className="col-span-3">
                              <div className="font-medium text-sm text-gray-900">{client.primaryAdvisor}</div>
                            </div>
                            <div className="col-span-2 text-right">
                              <div className="font-semibold text-green-600 text-sm">
                                {formatAUM(client.aum)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Referrals Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>
                  {getAdvisorReportTitle("All Referrals", filters, filterOptions || undefined)}
                </CardTitle>
              {analyticsData && (
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{analyticsData.totalReferrals} total referrals</span>
                  </div>
                  <div className="text-green-600 font-semibold">
                    Total AUM: {formatAUM(analyticsData.totalAUM)}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Table */}
              {analyticsData && analyticsData.allReferrals.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                  No referrals found for the current filters.
                </div>
              )}
              {analyticsData && analyticsData.allReferrals.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead 
                          className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100/50"
                          onClick={() => requestSort('clientName')}
                        >
                          Client Name {getSortDirectionIcon('clientName')}
                        </TableHead>
                        <TableHead 
                          className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100/50"
                          onClick={() => requestSort('segment')}
                        >
                          Segment {getSortDirectionIcon('segment')}
                        </TableHead>
                        <TableHead 
                          className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100/50"
                          onClick={() => requestSort('referredBy')}
                        >
                          Referred By {getSortDirectionIcon('referredBy')}
                        </TableHead>
                        <TableHead 
                          className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100/50"
                          onClick={() => requestSort('primaryAdvisor')}
                        >
                          Primary Advisor {getSortDirectionIcon('primaryAdvisor')}
                        </TableHead>
                        <TableHead 
                          className="text-right font-medium text-gray-700 cursor-pointer hover:bg-gray-100/50"
                          onClick={() => requestSort('aum')}
                        >
                          AUM {getSortDirectionIcon('aum')}
                        </TableHead>
                        <TableHead 
                          className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100/50"
                          onClick={() => requestSort('referralDate')}
                        >
                          Client Inception Date {getSortDirectionIcon('referralDate')}
                        </TableHead>
                        <TableHead className="text-right font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedReferrals.map((referral) => (
                        <TableRow key={referral.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">{referral.clientName}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeBadgeClasses(referral.segment)}`}
                            >
                              {referral.segment}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{referral.referredBy}</TableCell>
                          <TableCell className="text-gray-700">{referral.primaryAdvisor || 'N/A'}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatAUM(referral.aum)}
                          </TableCell>
                          <TableCell className="text-gray-700">{formatDate(referral.referralDate)}</TableCell>
                          <TableCell className="text-right">
                            <ViewContactButton 
                              clientId={referral.id} 
                              wealthboxClientId={referral.wealthboxClientId}
                              orionClientId={referral.orionClientId}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}