import React, { useState, useEffect, useMemo } from "react";
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
import { Users, Database, TrendingUp, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

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
import { ViewContactButton } from "@/components/ui/view-contact-button";

// Define type for sort configuration
type SortConfig = {
  key: keyof SegmentClient;
  direction: 'asc' | 'desc';
};

// Chart colors for segments
const SEGMENT_COLORS = {
  Platinum: "#1e40af", // blue-800 (darkest blue)
  Gold: "#3b82f6", // blue-500 (medium blue)
  Silver: "#93c5fd", // blue-300 (light blue)
  "N/A": "#e5e7eb", // gray-200
};

// Helper function for age color coding
const getAgeRowStyle = (age: number | null): string => {
  if (age === null) return "text-gray-500 font-medium";
  if (age >= 65) return "text-red-600 font-medium";
  if (age >= 40 && age < 65) return "text-yellow-600 font-medium";
  return "text-green-600 font-medium";
};

// Custom tooltip for donut chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm">Count: {data.count}</p>
        <p className="text-sm">{data.percentage}%</p>
        <p className="text-sm">Total AUM: {formatAUM(data.totalAUM)}</p>
      </div>
    );
  }
  return null;
};

// Types for transformation
interface SegmentClient {
  id: string;
  name: string;
  age: number | null;
  yearsWithFirm: number | null;
  assets: number;
  advisor: string;
  wealthboxClientId: string;
  orionClientId: string;
}

interface DonutSegmentData {
  name: string;
  count: number;
  percentage: number;
  color: string;
  totalAUM: number;
}

interface SegmentationDashboardData {
  kpis: {
    clientCount: { value: number; label: string };
    totalAUM: { value: string; label: string };
    averageClientAUM: { value: string; label: string };
    currentSegmentFocus: string;
  };
  donutChartData: DonutSegmentData[];
  allClients: SegmentClient[];
  originalClients: StandardClient[]; // Store original clients for segment filtering
}

// Calculate years with firm from inception date
const calculateYearsWithFirm = (inceptionDate: string): number | null => {
  if (!inceptionDate) return null;
  const inception = new Date(inceptionDate);
  const now = new Date();
  const yearsDiff = now.getFullYear() - inception.getFullYear();
  const monthDiff = now.getMonth() - inception.getMonth();

  // Adjust if current month/day is before the inception month/day
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < inception.getDate())
  ) {
    return Math.max(0, yearsDiff - 1);
  }

  return Math.max(0, yearsDiff);
};

const transformToSegmentClient = (
  client: StandardClient,
  advisors?: { id: string; name: string }[]
): SegmentClient => {
  const advisorName =
    advisors?.find((a) => a.id === client.primaryAdvisorId)?.name ||
    client.advisor ||
    "Unknown Advisor";

  return {
    id: client.id,
    name: getPrettyClientName(client),
    age: client.age || null,
    yearsWithFirm: calculateYearsWithFirm(client.inceptionDate),
    assets: Number(client.aum) || 0,
    advisor: advisorName,
    wealthboxClientId: client.wealthboxClientId || '',
    orionClientId: client.orionClientId || ''
  };
};

// Generate dashboard data from StandardClient array
const generateSegmentationDashboardFromClients = (
  clients: StandardClient[],
  advisors?: { id: string; name: string }[]
): SegmentationDashboardData => {
  // Transform all clients
  const transformedClients = clients.map((client) =>
    transformToSegmentClient(client, advisors)
  );

  // Calculate segment distribution using actual segment field
  const segmentCounts: { [key: string]: number } = {};
  const segmentAUM: { [key: string]: number } = {};

  transformedClients.forEach((client) => {
    const originalClient = clients.find((c) => c.id === client.id);
    const segment = originalClient?.segment
      ? getSegmentName(originalClient.segment)
      : "N/A";

    segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
    segmentAUM[segment] = (segmentAUM[segment] || 0) + client.assets;
  });

  // Calculate totals
  const totalClients = transformedClients.length;
  const totalAUM = transformedClients.reduce(
    (sum, client) => sum + client.assets,
    0
  );
  const averageAUM = totalClients > 0 ? totalAUM / totalClients : 0;

  // Create donut chart data - include all segments that have clients
  const donutChartData: DonutSegmentData[] = Object.entries(segmentCounts)
    .map(([segment, count]) => ({
      name: segment,
      count,
      percentage:
        totalClients > 0 ? Math.round((count / totalClients) * 100) : 0,
      color:
        SEGMENT_COLORS[segment as keyof typeof SEGMENT_COLORS] || "#9ca3af",
      totalAUM: segmentAUM[segment] || 0,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return {
    kpis: {
      clientCount: {
        value: totalClients,
        label: "Total Clients",
      },
      totalAUM: {
        value: formatAUM(totalAUM),
        label: "Total AUM",
      },
      averageClientAUM: {
        value: formatAUM(averageAUM),
        label: "Average Client AUM",
      },
      currentSegmentFocus: "All", // Default to show all clients
    },
    donutChartData,
    allClients: transformedClients.sort((a, b) => b.assets - a.assets), // Sort by AUM descending
    originalClients: clients, // Store original clients for segment filtering
  };
};

export default function SegmentationDashboard() {
  const { filters, filterOptions } = useReportFilters();
  const [dashboardData, setDashboardData] =
    useState<SegmentationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState("All");
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [hoveredClient, setHoveredClient] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'assets',
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
        const transformedData = generateSegmentationDashboardFromClients(
          clients,
          filterOptions?.advisors
        );
        setDashboardData(transformedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard data"
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters, filterOptions]);

  const handleSegmentClick = (segmentName: string) => {
    console.log("Segment clicked:", segmentName);
    // Toggle behavior: if clicking the same segment, unselect it and show all data
    if (selectedSegment === segmentName) {
      setSelectedSegment("All");
    } else {
      setSelectedSegment(segmentName);
    }
  };

  // Function to handle column sorting
  const requestSort = (key: keyof SegmentClient) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: keyof SegmentClient) => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" /> 
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Dynamic table data based on selected segment
  const currentSegmentClients = useMemo(() => {
    if (!dashboardData?.allClients) {
      return [];
    }

    // Show all clients if "All" is selected
    let filtered;
    if (selectedSegment === "All") {
      filtered = dashboardData.allClients;
    } else {
      // Filter clients by the selected segment using actual segment field
      filtered = dashboardData.allClients.filter((client: SegmentClient) => {
        const originalClient = dashboardData.originalClients.find((c: StandardClient) => c.id === client.id);
        const clientSegment = originalClient?.segment ? getSegmentName(originalClient.segment) : 'N/A';
        return clientSegment === selectedSegment;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const key = sortConfig.key;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle null values
        if (a[key] === null && b[key] === null) return 0;
        if (a[key] === null) return direction; // Nulls last when ascending
        if (b[key] === null) return -direction; // Nulls last when descending
        
        // Handle numeric fields
        if (key === 'age' || key === 'yearsWithFirm' || key === 'assets') {
          return ((a[key] as number) - (b[key] as number)) * direction;
        }
        
        // Handle string fields
        const valueA = String(a[key] || '').toLowerCase();
        const valueB = String(b[key] || '').toLowerCase();
        return valueA.localeCompare(valueB) * direction;
      });
    }

    return filtered;
  }, [dashboardData, selectedSegment, sortConfig]);

  // Dynamic KPIs based on selected segment
  const currentKPIs = useMemo(() => {
    if (!dashboardData || selectedSegment === "All") {
      return dashboardData?.kpis;
    }

    const segmentClients = currentSegmentClients;
    const totalClients = segmentClients.length;
    const totalAUM = segmentClients.reduce(
      (sum, client) => sum + client.assets,
      0
    );
    const averageAUM = totalClients > 0 ? totalAUM / totalClients : 0;

    return {
      clientCount: {
        value: totalClients,
        label: `${selectedSegment} Clients`,
      },
      totalAUM: {
        value: formatAUM(totalAUM),
        label: `${selectedSegment} Total AUM`,
      },
      averageClientAUM: {
        value: formatAUM(averageAUM),
        label: `${selectedSegment} Average AUM`,
      },
      currentSegmentFocus: selectedSegment,
    };
  }, [dashboardData, selectedSegment, currentSegmentClients]);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="p-6 text-center">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {(() => {
                  const selectedAdvisor = filterOptions?.advisors?.find(
                    (advisor) => advisor.id === filters.advisorIds[0]
                  );
                  return selectedAdvisor?.name
                    ? `${selectedAdvisor.name}'s`
                    : "";
                })()}{" "}
                Segmentation Dashboard
              </CardTitle>
              <p className="text-gray-600 mt-3 text-base">
                View and analyze your client base by segment and advisor
                assignment
                {(() => {
                  const hasSpecificAdvisor =
                    filters.advisorIds.length === 1 &&
                    filters.advisorIds[0] !== "All Advisors";
                  const selectedAdvisor = filterOptions?.advisors?.find(
                    (advisor) => advisor.id === filters.advisorIds[0]
                  );
                  return hasSpecificAdvisor && selectedAdvisor?.name
                    ? ` for ${selectedAdvisor.name}`
                    : "";
                })()}
                .
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-100 shadow-sm bg-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                Client Count
              </CardTitle>
              <Users className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              {currentKPIs?.clientCount.value}
            </div>
            <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">
              Total number of clients
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                Total AUM
              </CardTitle>
              <Database className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              {currentKPIs?.totalAUM.value}
            </div>
            <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">
              Total assets under management
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                Average Client AUM
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              {currentKPIs?.averageClientAUM.value}
            </div>
            <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">
              Portfolio average per client
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Segmentation Chart */}
        <Card className="flex flex-col h-[calc(100vh-50px)] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex-shrink-0 pb-4">
            <CardTitle className="text-xl font-semibold">
              Segmentation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <div className="h-72 w-full max-w-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={3}
                    dataKey="count"
                    onClick={(data) => handleSegmentClick(data.name)}
                    className="cursor-pointer"
                    onMouseEnter={(data, index) => {
                      // Enhanced hover effect - expand the hovered segment
                      const chart = document.querySelector(".recharts-pie");
                      if (chart) {
                        const cells = chart.querySelectorAll(
                          ".recharts-pie-sector"
                        );
                        cells[index]?.setAttribute(
                          "transform-origin",
                          "center"
                        );
                        cells[index]?.setAttribute(
                          "style",
                          "transform: scale(1.05); transition: all 0.2s ease;"
                        );
                      }
                    }}
                    onMouseLeave={(data, index) => {
                      // Reset hover effect
                      const chart = document.querySelector(".recharts-pie");
                      if (chart) {
                        const cells = chart.querySelectorAll(
                          ".recharts-pie-sector"
                        );
                        cells[index]?.setAttribute(
                          "style",
                          "transform: scale(1); transition: all 0.2s ease;"
                        );
                      }
                    }}
                  >
                    {dashboardData.donutChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={
                          selectedSegment === entry.name
                            ? "#1f2937"
                            : hoveredSegment === entry.name
                            ? "#374151"
                            : "transparent"
                        }
                        strokeWidth={
                          selectedSegment === entry.name
                            ? 3
                            : hoveredSegment === entry.name
                            ? 2
                            : 0
                        }
                        className="transition-all duration-300"
                        style={{
                          filter:
                            selectedSegment === entry.name
                              ? "brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                              : hoveredSegment === entry.name
                              ? "brightness(1.05) drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                              : "none",
                          opacity:
                            hoveredSegment && hoveredSegment !== entry.name
                              ? 0.7
                              : 1,
                        }}
                        onMouseEnter={() => setHoveredSegment(entry.name)}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {dashboardData.donutChartData.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:shadow-md hover:scale-105 group"
                  onClick={() => handleSegmentClick(entry.name)}
                  onMouseEnter={() => setHoveredSegment(entry.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{
                    backgroundColor:
                      selectedSegment === entry.name
                        ? "#eff6ff"
                        : hoveredSegment === entry.name
                        ? "#f0f9ff"
                        : "transparent",
                    border:
                      selectedSegment === entry.name
                        ? "2px solid #3b82f6"
                        : hoveredSegment === entry.name
                        ? "2px solid #93c5fd"
                        : "2px solid transparent",
                    opacity:
                      hoveredSegment && hoveredSegment !== entry.name ? 0.7 : 1,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full transition-all duration-200 group-hover:scale-125 group-hover:shadow-md"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                    {entry.name}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-200">
                    ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Table */}
        <Card className="flex flex-col h-[calc(100vh-50px)] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex-shrink-0 pb-4 border-b border-gray-100">
            <CardTitle className="text-xl font-semibold">
              {selectedSegment === "All"
                ? "All Clients"
                : `${selectedSegment} Clients`}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {currentSegmentClients.length} client
              {currentSegmentClients.length !== 1 ? "s" : ""} found
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-auto">
              {isLoading && (
                <div className="p-6 text-center text-gray-500">
                  Updating results...
                </div>
              )}
              {!isLoading && currentSegmentClients.length === 0 && (
                <div className="text-center text-gray-500 py-12 px-6">
                  No clients found for this segment.
                </div>
              )}
              {!isLoading && currentSegmentClients.length > 0 && (
                <div className="border-0">
                  <Table>
        <TableHeader className="sticky top-0 bg-white z-10 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent">
                      <TableHead 
                          className="font-semibold text-gray-700 py-4"
                          onClick={() => requestSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Name
                            {getSortDirectionIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 py-4"
                          onClick={() => requestSort('age')}
                        >
                          <div className="flex items-center gap-1">
                            Age
                            {getSortDirectionIcon('age')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 py-4"
                          onClick={() => requestSort('yearsWithFirm')}
                        >
                          <div className="flex items-center gap-1">
                            Years with Firm
                            {getSortDirectionIcon('yearsWithFirm')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 py-4"
                          onClick={() => requestSort('assets')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Assets
                            {getSortDirectionIcon('assets')}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSegmentClients.map((client) => {
                        const originalClient =
                          dashboardData?.originalClients.find(
                            (c: StandardClient) => c.id === client.id
                          );
                        const clientSegment = originalClient?.segment
                          ? getSegmentName(originalClient.segment)
                          : "N/A";

                        // Enhanced segment styling with proper colors and text contrast
                        const getSegmentStyle = (segment: string) => {
                          switch (segment) {
                            case "Platinum":
                              return {
                                backgroundColor: "#dbeafe", // blue-100
                                color: "#1e40af", // blue-800
                                borderColor: "#93c5fd", // blue-300
                              };
                            case "Gold":
                              return {
                                backgroundColor: "#fef3c7", // amber-100
                                color: "#d97706", // amber-600
                                borderColor: "#fcd34d", // amber-300
                              };
                            case "Silver":
                              return {
                                backgroundColor: "#f3f4f6", // gray-100
                                color: "#374151", // gray-700
                                borderColor: "#d1d5db", // gray-300
                              };
                            default:
                              return {
                                backgroundColor: "#f9fafb", // gray-50
                                color: "#6b7280", // gray-500
                                borderColor: "#e5e7eb", // gray-200
                              };
                          }
                        };

                        const segmentStyle = getSegmentStyle(clientSegment);

                        return (
                          <TableRow
                            key={client.id}
                            className="hover:bg-blue-50 border-b border-gray-100 transition-all duration-200 hover:shadow-sm group cursor-pointer"
                            onMouseEnter={() => setHoveredClient(client.id)}
                            onMouseLeave={() => setHoveredClient(null)}
                            style={{
                              backgroundColor:
                                hoveredClient === client.id
                                  ? "#eff6ff"
                                  : "transparent",
                              transform:
                                hoveredClient === client.id
                                  ? "translateX(4px)"
                                  : "translateX(0px)",
                            }}
                          >
                            <TableCell className="font-medium text-gray-900 py-4 group-hover:text-blue-700 transition-colors duration-200">
                              {client.name}
                            </TableCell>
                            <TableCell
                              className={`py-4 ${getAgeRowStyle(
                                client.age
                              )} transition-colors duration-200`}
                            >
                              {client.age !== null
                                ? `${client.age} years`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="py-4 text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                              {client.yearsWithFirm !== null
                                ? `${client.yearsWithFirm} years`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="py-4">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-105 group-hover:shadow-md border"
                                style={{
                                  backgroundColor: segmentStyle.backgroundColor,
                                  color: segmentStyle.color,
                                  borderColor: segmentStyle.borderColor,
                                }}
                              >
                                {clientSegment}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-gray-900 py-4 group-hover:text-blue-700 transition-colors duration-200">
                              {formatAUM(client.assets)}
                            </TableCell>
                            <TableCell className="text-right py-4">
                            <ViewContactButton 
                            clientId={client.id} 
                            wealthboxClientId={client.wealthboxClientId}
                            orionClientId={client.orionClientId}
                          />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
