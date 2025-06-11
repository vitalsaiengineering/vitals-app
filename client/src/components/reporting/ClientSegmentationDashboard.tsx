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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Database, TrendingUp, ExternalLink } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  getClientSegmentationDashboardData,
  type ClientSegmentationDashboardData,
  type DonutSegmentData,
  type SegmentClient,
  type GetClientSegmentationDashboardParams,
} from "@/lib/clientData";

// Import mock data
import mockData from "@/data/mockData.js";

// Helper function for age color coding
const getAgeRowStyle = (age: number): string => {
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
      </div>
    );
  }
  return null;
};

export default function ClientSegmentationDashboard() {
  const [dashboardData, setDashboardData] =
    useState<ClientSegmentationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedAdvisor, setSelectedAdvisor] = useState("firm_overview");
  const [selectedSegment, setSelectedSegment] = useState("Platinum");

  // Check if we should use mock data
  const useMock = import.meta.env.VITE_USE_MOCK_DATA !== "false";

  const fetchDashboardData = async (
    params?: GetClientSegmentationDashboardParams
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        // Use mock data
        const mockDashboardData =
          mockData.ClientSegmentationDashboard as ClientSegmentationDashboardData;
        setDashboardData(mockDashboardData);
      } else {
        // Try to fetch from API, fallback to mock data on error
        try {
          const data = await getClientSegmentationDashboardData(params);
          setDashboardData(data);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockDashboardData =
            mockData.ClientSegmentationDashboard as ClientSegmentationDashboardData;
          setDashboardData(mockDashboardData);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(); // Initial fetch
  }, [useMock]);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetClientSegmentationDashboardParams = {};
    if (selectedAdvisor !== "firm_overview") params.advisorId = selectedAdvisor;
    if (selectedSegment !== "Platinum") params.segment = selectedSegment;

    fetchDashboardData(params);
  }, [selectedAdvisor, selectedSegment]);

  const handleSegmentClick = (segmentName: string) => {
    setSelectedSegment(segmentName);
  };

  // Dynamic table data based on selected segment
  const currentSegmentClients = useMemo(() => {
    if (!dashboardData || !dashboardData.tableData?.clients) {
      return [];
    }

    // API returns clients for the current segment directly
    return dashboardData.tableData.clients;
  }, [dashboardData]);

  if (isLoading && !dashboardData) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
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
                Client Segmentation Dashboard
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                View and analyze your client base by segment and advisor
                assignment.
              </p>
            </div>
            <div className="w-64">
              <Select
                value={selectedAdvisor}
                onValueChange={setSelectedAdvisor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  {dashboardData.advisorOptions.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {dashboardData.kpis.clientCount.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboardData.kpis.clientCount.label}
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
                  {dashboardData.kpis.totalAUM.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboardData.kpis.totalAUM.label}
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
                  {dashboardData.kpis.averageClientAUM.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboardData.kpis.averageClientAUM.label}
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
        <Card>
          <CardHeader>
            <CardTitle>Client Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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
        <Card>
          <CardHeader>
            <CardTitle>
              {dashboardData?.tableData?.segmentName || selectedSegment} Clients ({currentSegmentClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="p-4 text-center text-muted-foreground">
                Updating results...
              </div>
            )}
            {!isLoading && currentSegmentClients.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No clients found for this segment.
              </div>
            )}
            {!isLoading && currentSegmentClients.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
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
                          {client.age} years
                        </TableCell>
                        <TableCell>{client.yearsWithFirm} years</TableCell>
                        <TableCell className="text-right">
                          {client.assets.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => {
                              /* Navigate to client detail */
                            }}
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            View Contact
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
