import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TrendingUp, Users, Search } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getClientInceptionData,
  type ClientInceptionData,
  type GetClientInceptionParams,
} from "@/lib/clientData";

// Import mock data
import mockData from "@/data/mockData.js";

// Grade badge colors
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
    Platinum: { badgeBg: "bg-blue-700", badgeText: "text-white" },
    Gold: { badgeBg: "bg-blue-600", badgeText: "text-white" },
    Silver: { badgeBg: "bg-blue-500", badgeText: "text-white" },
    Default: { badgeBg: "bg-gray-500", badgeText: "text-white" },
  };
  return GRADE_COLORS[grade] || GRADE_COLORS.Default;
};

/**
 * Custom tooltip component for bar chart
 * Displays year, total clients, and breakdown by segment with percentages
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + entry.value,
      0
    );
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{`Year: ${label}`}</p>
        <p className="text-sm">{`Total: ${total} clients`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value} (${Math.round(
              (entry.value / total) * 100
            )}%)`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Interface for ClientInceptionView component props
 */
interface ClientInceptionViewProps {
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

/**
 * ClientInceptionView Component
 * 
 * Displays client inception data with exact layout matching reference image
 * Features KPI card, chart with right-side legend, centered filter buttons,
 * search bar, and data table using original data sources
 */
export default function ClientInceptionView({
  globalSearch,
  setGlobalSearch,
}: ClientInceptionViewProps) {
  const [inceptionData, setInceptionData] =
    useState<ClientInceptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedSegmentFilter, setSelectedSegmentFilter] =
    useState("All Segments");

  // Check if we should use mock data
  const useMock = import.meta.env.VITE_USE_MOCK_DATA !== "false";

  /**
   * Fetches client inception data from API or mock data
   */
  const fetchInceptionData = async (params?: GetClientInceptionParams) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        const mockInceptionData =
          mockData.ClientInceptionData as ClientInceptionData;
        setInceptionData(mockInceptionData);
      } else {
        try {
          const data = await getClientInceptionData(params);
          setInceptionData(data);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockInceptionData =
            mockData.ClientInceptionData as ClientInceptionData;
          setInceptionData(mockInceptionData);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load inception data";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInceptionData();
  }, [useMock]);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetClientInceptionParams = {};
    if (globalSearch.trim()) params.search = globalSearch.trim();
    params.year = selectedYear;
    if (selectedSegmentFilter !== "All Segments")
      params.segmentFilter = selectedSegmentFilter;

    const timer = setTimeout(() => {
      fetchInceptionData(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearch, selectedYear, selectedSegmentFilter]);

  /**
   * Handles bar chart click events for year selection
   */
  const handleBarClick = (data: any) => {
    if (data && data.year) {
      setSelectedYear(data.year);
    }
  };

  /**
   * Filters chart data based on selected segment
   */
  const getFilteredChartData = () => {
    if (!inceptionData?.chartData) return [];
    
    if (selectedSegmentFilter === "All Segments") {
      return inceptionData.chartData;
    }

    return inceptionData.chartData.map(item => ({
      ...item,
      [selectedSegmentFilter]: item[selectedSegmentFilter as keyof typeof item] || 0,
      ...(selectedSegmentFilter !== "Platinum" && { Platinum: 0 }),
      ...(selectedSegmentFilter !== "Gold" && { Gold: 0 }),
      ...(selectedSegmentFilter !== "Silver" && { Silver: 0 }),
    }));
  };

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  const segmentButtons = ["All Segments", "Platinum", "Gold", "Silver"];
  const filteredChartData = getFilteredChartData();

  return (
    <div className="space-y-6">
      {/* KPI Card - exact match to reference */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-foreground">
                  Clients by Inception Date by Segmentation
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-foreground">
                  {inceptionData?.kpi.ytdNewClients || 0}
                </p>
                <p className="text-sm text-muted-foreground">YTD New Clients</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    +{inceptionData?.kpi.percentageChangeVsPreviousYear || 0}%
                    vs previous year
                  </span>
                </div>
              </div>
            </div>
            
            {/* Year selector */}
            <div className="w-32">
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inceptionData?.availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart and Legend Card - exact layout match */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chart - 3/4 width */}
            <div className="lg:col-span-3">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={filteredChartData} 
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="Platinum"
                      stackId="a"
                      fill="hsl(222, 47%, 44%)"
                      onClick={handleBarClick}
                      style={{ cursor: 'pointer' }}
                    />
                    <Bar 
                      dataKey="Gold" 
                      stackId="a" 
                      fill="hsl(216, 65%, 58%)"
                      onClick={handleBarClick}
                      style={{ cursor: 'pointer' }}
                    />
                    <Bar
                      dataKey="Silver"
                      stackId="a"
                      fill="hsl(210, 55%, 78%)"
                      onClick={handleBarClick}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend - 1/4 width - exact match to reference */}
            <div className="lg:col-span-1">
              <div className="bg-white border rounded-lg p-4 h-full">
                <h4 className="text-sm font-medium mb-4">New Clients by Segment ({selectedYear})</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Segment</span>
                    <span className="text-sm font-medium">Clients</span>
                  </div>
                  
                  {inceptionData?.chartLegend
                    .filter(item => 
                      (selectedSegmentFilter === "All Segments" || 
                      item.segment === selectedSegmentFilter) && item.segment !== "Total"
                    )
                    .map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              item.segment === "Platinum"
                                ? "hsl(222, 47%, 44%)"
                                : item.segment === "Gold"
                                ? "hsl(216, 65%, 58%)"
                                : item.segment === "Silver"
                                ? "hsl(210, 55%, 78%)"
                                : "#6b7280",
                          }}
                        />
                        <span className="text-sm">{item.segment}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">
                      {inceptionData?.chartLegend
                        .filter(item => 
                          selectedSegmentFilter === "All Segments" || 
                          item.segment === selectedSegmentFilter
                        )
                        .reduce((sum, item) => sum + item.count, 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segment filter buttons - centered below chart */}
          <div className="flex space-x-2 mt-6 justify-center">
            {segmentButtons.map((segment) => (
              <Button
                key={segment}
                variant={
                  selectedSegmentFilter === segment ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedSegmentFilter(segment)}
                className="px-4"
              >
                {segment}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search bar - positioned between chart and table */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Client Table - exact match to reference */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Client Inception Year</CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                {inceptionData ? `${inceptionData.totalTableRecords} records` : "0 records"}
              </span>
              <span>{selectedSegmentFilter} • {selectedYear}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Loading client data...
            </div>
          )}
          {!isLoading &&
            inceptionData &&
            inceptionData.tableClients.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No clients match the current filters.
              </div>
            )}
          {!isLoading &&
            inceptionData &&
            inceptionData.tableClients.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Inception Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inceptionData.tableClients.map((client) => {
                      const gradeClasses = getGradeBadgeClasses(client.segment);

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {client.email}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md ${gradeClasses.badgeBg} ${gradeClasses.badgeText}`}
                            >
                              {client.segment}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(client.inceptionDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              }
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="default">
                              View Contact
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
