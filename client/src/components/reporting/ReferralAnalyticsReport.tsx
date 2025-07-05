import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronUp, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { getClients } from "@/lib/clientData";
import { filtersToApiParams } from "@/utils/filter-utils";
import { StandardClient } from "@/types/client";
import {
  formatAUM,
  getPrettyClientName,
  getSegmentName,
} from "@/utils/client-analytics";
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
    referrers: Array<{ id: string; name: string }>;
  };
}

// Colors for the pie chart
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#ef4444", // red-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
];

// Update the grade badge styling function
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, string> = {
    Platinum: "bg-blue-50 text-blue-800 border-blue-200",
    Gold: "bg-yellow-50 text-yellow-800 border-yellow-200",
    Silver: "bg-gray-50 text-gray-800 border-gray-200",
    "N/A": "bg-gray-50 text-gray-800 border-gray-200",
  };
  return GRADE_COLORS[grade] || "bg-gray-50 text-gray-800 border-gray-200";
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Transform StandardClient to ReferralClient
const transformToReferralClient = (
  client: StandardClient,
  advisors?: { id: string; name: string }[]
): ReferralClient => ({
  id: client.id,
  clientName: getPrettyClientName(client),
  segment: getSegmentName(client.segment),
  primaryAdvisor: getAdvisorDisplayName(
    client.primaryAdvisorId || "",
    advisors
  ),
  aum: Number(client.aum) || 0,
  referralDate: client.inceptionDate || new Date().toISOString(),
  referredBy: getAdvisorDisplayName(client.referredBy || "direct", advisors),
  wealthboxClientId: client.wealthboxClientId,
  orionClientId: client.orionClientId,
});

// Helper function to convert advisor ID to advisor name
const getAdvisorDisplayName = (
  advisorId: string,
  advisors?: { id: string; name: string }[]
): string => {
  if (!advisorId || advisorId === "" || advisorId === "direct") {
    return "N/A";
  }

  if (!advisors) {
    return advisorId;
  }

  // Find advisor by ID
  const advisor = advisors.find((a) => Number(a.id) === Number(advisorId));
  if (advisor) {
    return advisor.name;
  }

  // If no advisor found, return a user-friendly message
  return `Unknown Advisor (${advisorId})`;
};

// Generate ReferralAnalyticsData from StandardClient array
const generateReferralAnalyticsFromClients = (
  clients: StandardClient[],
  advisors?: { id: string; name: string }[]
): ReferralAnalyticsData => {
  // Filter only clients that have referral information
  const referredClients = clients.filter((client) =>
    Boolean(client.referredBy)
  );

  // Create referral source mapping with proper names
  const referralSourceMap = new Map<
    string,
    { displayName: string; clients: ReferralClient[] }
  >();

  referredClients.forEach((client) => {
    const referralId = client.referredBy || "direct";
    const displayName = getAdvisorDisplayName(referralId, advisors);
    const transformedClient = transformToReferralClient(client, advisors);

    if (!referralSourceMap.has(referralId)) {
      referralSourceMap.set(referralId, {
        displayName,
        clients: [],
      });
    }
    referralSourceMap.get(referralId)!.clients.push(transformedClient);
  });

  // Transform to ReferralClient format for allReferrals
  const allReferrals = Array.from(referralSourceMap.values()).flatMap(
    (source) => source.clients
  );

  // Calculate totals
  const totalReferrals = allReferrals.length;
  const totalAUM = allReferrals.reduce((sum, client) => sum + client.aum, 0);

  // Create referral sources data
  const referralSources: ReferralSource[] = Array.from(
    referralSourceMap.entries()
  )
    .map(([referralId, sourceData]) => {
      const sourceAUM = sourceData.clients.reduce(
        (sum, client) => sum + client.aum,
        0
      );
      const percentage =
        totalReferrals > 0
          ? Math.round((sourceData.clients.length / totalReferrals) * 100)
          : 0;

      return {
        id: sourceData.displayName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        name: sourceData.displayName,
        company: "", // Could be extracted from source name if needed
        totalReferrals: sourceData.clients.length,
        totalAUM: sourceAUM,
        percentage,
        clients: sourceData.clients.sort((a, b) => b.aum - a.aum), // Sort by AUM descending
      };
    })
    .sort((a, b) => b.totalReferrals - a.totalReferrals); // Sort by referral count descending

  // Create filter options
  const filterOptions = {
    referrers: [
      { id: "all", name: "All Referrers" },
      ...referralSources.map((source) => ({
        id: source.id,
        name: source.name,
      })),
    ],
  };

  return {
    totalReferrals,
    totalAUM,
    referralSources,
    allReferrals: allReferrals.sort(
      (a, b) =>
        new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime()
    ),
    filterOptions,
  };
};

export default function ReferralAnalyticsReport() {
  const { filters, filterOptions } = useReportFilters();
  const [analyticsData, setAnalyticsData] =
    useState<ReferralAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sources");
  const [selectedReferralSource, setSelectedReferralSource] =
    useState<ReferralSource | null>(null);
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
        const transformedData = generateReferralAnalyticsFromClients(
          clients,
          filterOptions?.advisors
        );
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
    const source = analyticsData?.referralSources.find(
      (s) => s.name === data.name
    );
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
      const source = analyticsData?.referralSources.find(
        (s) => s.name === data.name
      );
      const percentage =
        totalReferrals > 0
          ? ((data.value / totalReferrals) * 100).toFixed(0)
          : 0;
      // Use AUM from chart data if source lookup fails
      const aumValue = source?.totalAUM ?? data.totalAUM ?? 0;

      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-100 text-sm max-w-xs">
          <p className="font-bold text-gray-900 mb-2">{data.name}</p>
          {source?.company && (
            <p className="text-xs text-gray-500 mb-2">{source.company}</p>
          )}
          <div className="space-y-1">
            <p className="text-gray-700 font-medium">{data.value} referrals</p>
            <p className="text-blue-600 font-medium">{percentage}% of total</p>
            <p className="text-green-600 font-semibold">
              Total AUM: {formatAUM(aumValue)}
            </p>
          </div>
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

  const chartData =
    analyticsData?.referralSources.map((source) => ({
      name: source.name,
      value: source.totalReferrals,
      percentage: source.percentage,
      totalAUM: source.totalAUM, // Add AUM to chart data for tooltip
    })) || [];

  const sortedReferrals = getSortedReferrals();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header - enhanced styling */}
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">
          {getAdvisorReportTitle(
            "Referral Analytics",
            filters,
            filterOptions || undefined
          )}
        </h1>
        <p className="text-gray-600 mt-2">
          Track your top referral sources and measure their performance.
        </p>
      </div>

      {/* Tabs - enhanced styling */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex justify-left">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <TabsTrigger
              value="sources"
              className="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
            >
              Top Referral Sources
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
            >
              All Referrals
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Top Referral Sources Tab - enhanced styling */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Chart - enhanced styling */}
            <Card className="flex flex-col border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Top Referral Sources
                  </CardTitle>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-6">
                  {/* Donut Chart - enhanced styling */}
                  <div className="relative bg-gray-50/50 rounded-lg p-4">
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
                                className="cursor-pointer focus:outline-none hover:opacity-80 transition-opacity"
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={
                              <CustomTooltip
                                totalReferrals={
                                  analyticsData?.totalReferrals || 0
                                }
                              />
                            }
                            cursor={{ fill: "transparent" }}
                            wrapperStyle={{ zIndex: 10 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Center text - enhanced styling */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        Total Referred
                      </div>
                      <div className="text-4xl font-bold text-blue-600">
                        {analyticsData?.totalReferrals || 0}
                      </div>
                      {selectedReferralSource && (
                        <div className="text-xs text-blue-600 text-center mt-1 font-medium">
                          By {selectedReferralSource.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legend - enhanced styling */}
                  <div className="grid grid-cols-2 gap-2">
                    {analyticsData?.referralSources
                      .slice(0, 10)
                      .map((source, index) => (
                        <button
                          key={source.id}
                          onClick={() => setSelectedReferralSource(source)}
                          className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 border ${
                            selectedReferralSource?.id === source.id
                              ? "bg-blue-50 border-blue-200 shadow-sm"
                              : "border-gray-100 hover:bg-gray-50 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {source.name}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              {source.totalReferrals} referrals (
                              {source.percentage}%)
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Selected Referrer Details or All Clients - enhanced styling */}
            <Card className="flex flex-col border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">
                  {selectedReferralSource
                    ? `Clients Referred by ${selectedReferralSource.name}`
                    : "All Referred Clients"}
                </CardTitle>
                {selectedReferralSource && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span className="font-medium text-blue-700">
                        {selectedReferralSource.totalReferrals} clients
                      </span>
                    </div>
                    <div className="bg-green-50 px-2 py-1 rounded-full border border-green-200 text-green-700 font-semibold">
                      Total AUM: {formatAUM(selectedReferralSource.totalAUM)}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                {isLoading && (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                )}
                {!isLoading && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Table Headers - enhanced styling */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-3">
                      <div className="col-span-4">Name</div>
                      <div className="col-span-3">Segment</div>
                      <div className="col-span-3">Primary Advisor</div>
                      <div className="col-span-2 text-right">AUM</div>
                    </div>

                    {/* Client List - enhanced styling */}
                    <div className="space-y-0 flex-1 overflow-y-auto">
                      {selectedReferralSource
                        ? // Show clients for selected referral source
                          selectedReferralSource.clients
                            .slice(0, 10)
                            .map((client, index) => (
                              <div
                                key={client.id}
                                className="grid grid-cols-12 gap-4 items-center py-3 px-2 hover:bg-blue-50/50 rounded-lg transition-colors duration-200 group"
                              >
                                <div className="col-span-4">
                                  <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-900">
                                    {client.clientName}
                                  </div>
                                </div>
                                <div className="col-span-3">
                                  <Badge
                                    className={`text-xs px-2 py-1 rounded-full font-medium border ${getGradeBadgeClasses(
                                      client.segment
                                    )}`}
                                  >
                                    {client.segment}
                                  </Badge>
                                </div>
                                <div className="col-span-3">
                                  <div className="font-medium text-sm text-gray-700">
                                    {client.primaryAdvisor}
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <div className="font-bold text-green-600 text-sm">
                                    {formatAUM(client.aum)}
                                  </div>
                                </div>
                              </div>
                            ))
                        : // Show all clients when no specific source is selected
                          analyticsData?.allReferrals
                            .slice(0, 15)
                            .map((client, index) => (
                              <div
                                key={client.id}
                                className="grid grid-cols-12 gap-4 items-center py-3 px-2 hover:bg-blue-50/50 rounded-lg transition-colors duration-200 group"
                              >
                                <div className="col-span-4">
                                  <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-900">
                                    {client.clientName}
                                  </div>
                                </div>
                                <div className="col-span-3">
                                  <Badge
                                    className={`text-xs px-2 py-1 rounded-full font-medium border ${getGradeBadgeClasses(
                                      client.segment
                                    )}`}
                                  >
                                    {client.segment}
                                  </Badge>
                                </div>
                                <div className="col-span-3">
                                  <div className="font-medium text-sm text-gray-700">
                                    {client.primaryAdvisor}
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <div className="font-bold text-green-600 text-sm">
                                    {formatAUM(client.aum)}
                                  </div>
                                </div>
                              </div>
                            ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Referrals Tab - enhanced styling */}
        <TabsContent value="all" className="space-y-6">
          <Card className="border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">
                {getAdvisorReportTitle(
                  "All Referrals",
                  filters,
                  filterOptions || undefined
                )}
              </CardTitle>
              {analyticsData && (
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="font-medium text-blue-700">
                      {analyticsData.totalReferrals} total referrals
                    </span>
                  </div>
                  <div className="bg-green-50 px-2 py-1 rounded-full border border-green-200 text-green-700 font-semibold">
                    Total AUM: {formatAUM(analyticsData.totalAUM)}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Table - enhanced styling */}
              {analyticsData && analyticsData.allReferrals.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  No referrals found for the current filters.
                </div>
              )}
              {analyticsData && analyticsData.allReferrals.length > 0 && (
                <div className="rounded-lg border border-gray-100 overflow-hidden">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedReferrals.map((referral) => (
                        <TableRow
                          key={referral.id}
                          className="hover:bg-blue-50/50 transition-all duration-200 group"
                        >
                          <TableCell className="font-semibold text-gray-900 group-hover:text-blue-900">
                            {referral.clientName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs px-3 py-1 rounded-full font-medium border ${getGradeBadgeClasses(
                                referral.segment
                              )}`}
                            >
                              {referral.segment}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 font-medium">
                            {referral.referredBy}
                          </TableCell>
                          <TableCell className="text-gray-700 font-medium">
                            {referral.primaryAdvisor || "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {formatAUM(referral.aum)}
                          </TableCell>
                          <TableCell className="text-gray-700 font-medium">
                            {formatDate(referral.referralDate)}
                          </TableCell>
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
