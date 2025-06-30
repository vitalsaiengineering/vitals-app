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
import { Users, Database, TrendingUp } from "lucide-react";
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
import { formatAUM, getPrettyClientName, getSegmentName } from "@/utils/client-analytics";
import { ReportSkeleton } from "@/components/ui/skeleton";

// Chart colors for segments
const SEGMENT_COLORS = {
  Platinum: "#6366f1", // indigo-500
  Gold: "#f59e0b",     // amber-500
  Silver: "#6b7280",   // gray-500
  "N/A": "#9ca3af",    // gray-400
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
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < inception.getDate())) {
    return Math.max(0, yearsDiff - 1);
  }
  
  return Math.max(0, yearsDiff);
};

const transformToSegmentClient = (client: StandardClient, advisors?: { id: string; name: string }[]): SegmentClient => {
  const advisorName = advisors?.find(a => a.id === client.primaryAdvisorId)?.name || client.advisor || 'Unknown Advisor';
  
  return {
    id: client.id,
    name: getPrettyClientName(client),
    age: client.age || null,
    yearsWithFirm: calculateYearsWithFirm(client.inceptionDate),
    assets: Number(client.aum) || 0,
    advisor: advisorName
  };
};

// Generate dashboard data from StandardClient array
const generateSegmentationDashboardFromClients = (
  clients: StandardClient[], 
  advisors?: { id: string; name: string }[]
): SegmentationDashboardData => {
  // Transform all clients
  const transformedClients = clients.map(client => transformToSegmentClient(client, advisors));
  
  // Calculate segment distribution using actual segment field
  const segmentCounts: { [key: string]: number } = {};
  const segmentAUM: { [key: string]: number } = {};
  
  transformedClients.forEach(client => {
    const originalClient = clients.find(c => c.id === client.id);
    const segment = originalClient?.segment ? getSegmentName(originalClient.segment) : 'N/A';
    
    segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
    segmentAUM[segment] = (segmentAUM[segment] || 0) + client.assets;
  });
  
  // Calculate totals
  const totalClients = transformedClients.length;
  const totalAUM = transformedClients.reduce((sum, client) => sum + client.assets, 0);
  const averageAUM = totalClients > 0 ? totalAUM / totalClients : 0;
  
  // Create donut chart data - include all segments that have clients
  const donutChartData: DonutSegmentData[] = Object.entries(segmentCounts)
    .map(([segment, count]) => ({
      name: segment,
      count,
      percentage: totalClients > 0 ? Math.round((count / totalClients) * 100) : 0,
      color: SEGMENT_COLORS[segment as keyof typeof SEGMENT_COLORS] || '#9ca3af',
      totalAUM: segmentAUM[segment] || 0
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
  
  return {
    kpis: {
      clientCount: {
        value: totalClients,
        label: 'Total Clients'
      },
      totalAUM: {
        value: formatAUM(totalAUM),
        label: 'Total AUM'
      },
      averageClientAUM: {
        value: formatAUM(averageAUM),
        label: 'Average Client AUM'
      },
      currentSegmentFocus: 'All' // Default to show all clients
    },
    donutChartData,
    allClients: transformedClients.sort((a, b) => b.assets - a.assets), // Sort by AUM descending
    originalClients: clients // Store original clients for segment filtering
  };
};

export default function SegmentationDashboard() {
  const { filters, filterOptions } = useReportFilters();
  const [dashboardData, setDashboardData] = useState<SegmentationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use centralized getClients function
        const apiParams = filtersToApiParams(filters);
        const clients = await getClients(apiParams);
        const transformedData = generateSegmentationDashboardFromClients(clients, filterOptions?.advisors);
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
    setSelectedSegment(segmentName);
  };

  // Dynamic table data based on selected segment
  const currentSegmentClients = useMemo(() => {
    if (!dashboardData?.allClients) {
      return [];
    }

    // Show all clients if "All" is selected
    if (selectedSegment === "All") {
      return dashboardData.allClients.sort((a, b) => b.assets - a.assets);
    }

    // Filter clients by the selected segment using actual segment field
    const filtered = dashboardData.allClients.filter((client: SegmentClient) => {
      const originalClient = dashboardData.originalClients.find((c: StandardClient) => c.id === client.id);
      const clientSegment = originalClient?.segment ? getSegmentName(originalClient.segment) : 'N/A';
      return clientSegment === selectedSegment;
    });

    return filtered.sort((a, b) => b.assets - a.assets);
  }, [dashboardData, selectedSegment]);

  // Dynamic KPIs based on selected segment
  const currentKPIs = useMemo(() => {
    if (!dashboardData || selectedSegment === "All") {
      return dashboardData?.kpis;
    }

    const segmentClients = currentSegmentClients;
    const totalClients = segmentClients.length;
    const totalAUM = segmentClients.reduce((sum, client) => sum + client.assets, 0);
    const averageAUM = totalClients > 0 ? totalAUM / totalClients : 0;

    return {
      clientCount: {
        value: totalClients,
        label: `${selectedSegment} Clients`
      },
      totalAUM: {
        value: formatAUM(totalAUM),
        label: `${selectedSegment} Total AUM`
      },
      averageClientAUM: {
        value: formatAUM(averageAUM),
        label: `${selectedSegment} Average AUM`
      },
      currentSegmentFocus: selectedSegment
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>

              <CardTitle className="text-2xl">
                {(() => {
                  const selectedAdvisor = filterOptions?.advisors?.find(
                    (advisor) => advisor.id === filters.advisorIds[0]
                  );
                  return selectedAdvisor?.name ? `${selectedAdvisor.name}'s` : "";
                })()} Segmentation Dashboard
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                View and analyze your client base by segment and advisor assignment
                {(() => {
                  const hasSpecificAdvisor = filters.advisorIds.length === 1 && 
                    filters.advisorIds[0] !== "All Advisors";
                  const selectedAdvisor = filterOptions?.advisors?.find(
                    (advisor) => advisor.id === filters.advisorIds[0]
                  );
                  return hasSpecificAdvisor && selectedAdvisor?.name 
                    ? ` for ${selectedAdvisor.name}` 
                    : "";
                })()}.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {currentKPIs?.clientCount.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentKPIs?.clientCount.label}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {currentKPIs?.totalAUM.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentKPIs?.totalAUM.label}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {currentKPIs?.averageClientAUM.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentKPIs?.averageClientAUM.label}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Segmentation Chart */}
        <Card className="flex flex-col h-[calc(100vh-50px)]">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Client Segmentation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="count"
                    onClick={(data) => handleSegmentClick(data.name)}
                    className="cursor-pointer"
                  >
                    {dashboardData.donutChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={
                          selectedSegment === entry.name ? "#1f2937" : "none"
                        }
                        strokeWidth={selectedSegment === entry.name ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Client Table */}
        <Card className="flex flex-col h-[calc(100vh-50px)]">
          <CardHeader className="flex-shrink-0">
            <CardTitle>
              {selectedSegment === "All" ? "All Clients" : `${selectedSegment} Clients`} ({currentSegmentClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-auto">
              {isLoading && (
                <div className="p-4 text-center text-muted-foreground">
                  Updating results...
                </div>
              )}
              {!isLoading && currentSegmentClients.length === 0 && (
                <div className="text-center text-muted-foreground py-10 px-6">
                  No clients found for this segment.
                </div>
              )}
              {!isLoading && currentSegmentClients.length > 0 && (
                <div className="rounded-md border m-6">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Years with Firm</TableHead>
                        <TableHead className="text-right">Assets</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {currentSegmentClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell className={getAgeRowStyle(client.age)}>
                          {client.age !== null ? `${client.age} years` : 'N/A'}
                        </TableCell>
                        <TableCell>{client.yearsWithFirm !== null ? `${client.yearsWithFirm} years` : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {formatAUM(client.assets)}
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="default" size="sm">
                            View Contact
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
