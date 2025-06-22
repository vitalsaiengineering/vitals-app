import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/dateFormatter";
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
  type InceptionClientDetail,
} from "@/lib/clientData";
import { useMockData } from "@/contexts/MockDataContext";
import { useAdvisor } from "@/contexts/AdvisorContext";

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

// Extended interfaces for advisor filtering
interface ExtendedInceptionClientDetail extends InceptionClientDetail {
  advisor?: string;
}

interface ExtendedGetClientInceptionParams extends GetClientInceptionParams {
  advisorId?: string;
}

export default function ClientInceptionView({
  globalSearch,
  setGlobalSearch,
}: ClientInceptionViewProps) {
  const [allInceptionData, setAllInceptionData] = useState<ClientInceptionData | null>(null); // Store all data
  const [filteredTableClients, setFilteredTableClients] = useState<InceptionClientDetail[]>([]); // Store filtered table data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedSegmentFilter, setSelectedSegmentFilter] =
    useState("All Segments");

  // Get the selected advisor from context
  const { selectedAdvisor } = useAdvisor();

  // Check if we should use mock data
  const { useMock } = useMockData();

  const fetchInceptionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        const mockInceptionData =
          mockData.ClientInceptionData as ClientInceptionData;
        
        // Store all data for client-side filtering
        setAllInceptionData(mockInceptionData);
      } else {
        try {
          const data = await getClientInceptionData();
          setAllInceptionData(data);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockInceptionData =
            mockData.ClientInceptionData as ClientInceptionData;
          setAllInceptionData(mockInceptionData);
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

  // Client-side filtering function
  const applyFilters = () => {
    if (!allInceptionData) {
      setFilteredTableClients([]);
      return;
    }

    let filtered = [...allInceptionData.tableClients];

    // Apply advisor filter (from header context)
    if (selectedAdvisor !== 'All Advisors') {
      filtered = filtered.filter((client) => {
        // Using any to bypass type checking for the mock data
        const clientAny = client as any;
        return clientAny.advisor === selectedAdvisor;
      });
    }

    // Apply global search filter
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.segment.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        (client as any).advisor?.toLowerCase().includes(searchLower)
      );
    }

    // Apply segment filter
    if (selectedSegmentFilter !== "All Segments") {
      filtered = filtered.filter(client => client.segment === selectedSegmentFilter);
    }

    // Apply year filter (filter by inception year)
    filtered = filtered.filter(client => {
      const inceptionYear = new Date(client.inceptionDate).getFullYear();
      return inceptionYear === selectedYear;
    });

    setFilteredTableClients(filtered);
  };

  useEffect(() => {
    fetchInceptionData();
  }, [useMock]);

  // Apply filters whenever filter criteria or data changes
  useEffect(() => {
    applyFilters();
  }, [
    allInceptionData,
    globalSearch,
    selectedYear,
    selectedSegmentFilter,
    selectedAdvisor,
  ]);

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
    if (!allInceptionData?.chartData) return [];
    
    if (selectedSegmentFilter === "All Segments") {
      return allInceptionData.chartData;
    }

    return allInceptionData.chartData.map(item => ({
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
                <h3 className="text-lg font-medium">
                  {selectedAdvisor !== "All Advisors" 
                    ? `${selectedAdvisor}'s Clients by Inception Date` 
                    : "Clients by Inception Date by Segmentation"}
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-foreground">
                  {allInceptionData?.kpi.ytdNewClients || 0}
                </p>
                <p className="text-sm text-muted-foreground">YTD New Clients</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    +{allInceptionData?.kpi.percentageChangeVsPreviousYear || 0}%
                    vs previous year
                  </span>
                </div>
              </div>
            </div>
            
            {/* Year selector */}
            <div className="w-32">
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allInceptionData?.availableYears.map((year: number) => (
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

      {/* Chart and Legend */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Client Inception by Year</CardTitle>
        </CardHeader>
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
                    <Legend />
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
                  
                  {allInceptionData?.chartLegend
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
                      {allInceptionData?.chartLegend
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
                {allInceptionData ? `${allInceptionData.totalTableRecords} records` : "0 records"}
              </span>
              <span>{selectedSegmentFilter} • {selectedYear}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Loading inception data...
            </div>
          )}
          {!isLoading && filteredTableClients.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No clients match the current filters.
            </div>
          )}
          {!isLoading && filteredTableClients.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Inception Date</TableHead>
                    <TableHead>Advisor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTableClients.map((client) => {
                    const gradeClasses = getGradeBadgeClasses(client.segment);

                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-medium">
                              {client.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.email}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${gradeClasses.badgeBg} ${gradeClasses.badgeText}`}
                          >
                            {client.segment}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDate(client.inceptionDate)}
                        </TableCell>
                        <TableCell>{(client as any).advisor || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                          >
                            View Client
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
