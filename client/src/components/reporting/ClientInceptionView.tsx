import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/dateFormatter";
import { getPrettyClientName, getSegmentName } from "@/utils/client-analytics";
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
import { TrendingUp, TrendingDown, Users, Search, ExternalLink } from "lucide-react";
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
import { StandardClient } from "@/types/client";
import { getClients } from "@/lib/clientData";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { filtersToApiParams } from "@/utils/filter-utils";

import { useAdvisor } from "@/contexts/AdvisorContext";
import { TableSkeleton } from "@/components/ui/skeleton";
import { getAdvisorReportTitle } from '@/lib/utils';
import { ViewContactButton } from "@/components/ui/view-contact-button";

// Import mock data
import mockData from "@/data/mockData.js";

// Define transformed interfaces for compatibility
interface InceptionReportData {
  ytdNewClients: number;
  percentageChangeVsPreviousYear: number;
  availableYears: number[];
  chartData: Array<{
    year: number;
    Platinum: number;
    Gold: number;
    Silver: number;
    "N/A": number;
  }>;
  chartLegend: Array<{
    segment: string;
    count: number;
  }>;
  totalTableRecords: number;
}

interface InceptionClient {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  segment: string;
  inceptionDate: string;
  advisor: string;
  wealthboxClientId?: string;
  orionClientId?: string;
}

// Segment colors including N/A
const SEGMENT_COLORS: Record<string, string> = {
  Platinum: "hsl(222, 47%, 44%)",
  Gold: "hsl(216, 65%, 58%)",
  Silver: "hsl(210, 55%, 78%)",
  "N/A": "hsl(220, 14%, 60%)", // Gray for N/A
};

// Data transformation utilities
const transformToInceptionClient = (
  client: StandardClient
): InceptionClient => ({
  id: client.id,
  name: getPrettyClientName(client),
  firstName: client.firstName,
  lastName: client.lastName,
  email: client.email || "N/A",
  segment: getSegmentName(client.segment),
  inceptionDate: client.inceptionDate || '', // Empty string for N/A dates
  advisor: client.advisor || 'N/A',
  wealthboxClientId: client.wealthboxClientId,
  orionClientId: client.orionClientId
});

const generateInceptionReportFromClients = (
  clients: StandardClient[]
): InceptionReportData => {
  const currentYear = new Date().getFullYear();

  // Get years where clients actually exist
  const clientYears = Array.from(
    new Set(
      clients
        .filter((client) => client.inceptionDate) // Only include clients with valid inception dates
        .map((client) => new Date(client.inceptionDate).getFullYear())
    )
  );

  // Create a complete year range from earliest client to current year
  let startYear = currentYear;
  let endYear = currentYear;

  if (clientYears.length > 0) {
    startYear = Math.min(...clientYears);
    endYear = Math.max(currentYear, Math.max(...clientYears));

    // Reasonable bounds: don't go back more than 20 years or show more than 5 years in future
    const earliestReasonableYear = currentYear - 20;
    const latestReasonableYear = currentYear + 5;

    startYear = Math.max(startYear, earliestReasonableYear);
    endYear = Math.min(endYear, latestReasonableYear);
  }

  // Generate all years in the range (including empty years)
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  // Generate chart data by year and segment (including empty years)
  const chartData = years.map((year) => {
    const yearClients = clients.filter((client) => {
      return (
        client.inceptionDate &&
        new Date(client.inceptionDate).getFullYear() === year
      );
    });

    const segmentCounts = yearClients.reduce((acc, client) => {
      const segment = getSegmentName(client.segment);
      acc[segment] = (acc[segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const yearData = {
      year,
      Platinum: segmentCounts.Platinum || 0,
      Gold: segmentCounts.Gold || 0,
      Silver: segmentCounts.Silver || 0,
      "N/A": segmentCounts["N/A"] || 0,
    };

    return yearData;
  });

  // Generate legend data for current year (this will be updated dynamically in the component)
  const currentYearData = chartData.find(
    (data) => data.year === currentYear
  ) || {
    year: currentYear,
    Platinum: 0,
    Gold: 0,
    Silver: 0,
    "N/A": 0,
  };

  const chartLegend = [
    { segment: "Platinum", count: currentYearData.Platinum },
    { segment: "Gold", count: currentYearData.Gold },
    { segment: "Silver", count: currentYearData.Silver },
    { segment: "N/A", count: currentYearData["N/A"] },
    {
      segment: "Total",
      count:
        currentYearData.Platinum +
        currentYearData.Gold +
        currentYearData.Silver +
        currentYearData["N/A"],
    },
  ];

  // Calculate YTD metrics
  const ytdNewClients =
    chartLegend.find((item) => item.segment === "Total")?.count || 0;

  // Calculate percentage change vs previous year
  const previousYearData = chartData.find(
    (data) => data.year === currentYear - 1
  );
  const previousYearTotal = previousYearData
    ? previousYearData.Platinum +
      previousYearData.Gold +
      previousYearData.Silver +
      previousYearData["N/A"]
    : 0;

  const percentageChangeVsPreviousYear =
    previousYearTotal > 0
      ? Math.round(
          ((ytdNewClients - previousYearTotal) / previousYearTotal) * 100
        )
      : 0;

  return {
    ytdNewClients,
    percentageChangeVsPreviousYear,
    availableYears: years,
    chartData,
    chartLegend,
    totalTableRecords: clients.length,
  };
};

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

export default function ClientInceptionView({
  globalSearch,
  setGlobalSearch,
}: ClientInceptionViewProps) {
  const [allInceptionData, setAllInceptionData] =
    useState<InceptionReportData | null>(null); // Store all data
  const [filteredTableClients, setFilteredTableClients] = useState<
    InceptionClient[]
  >([]); // Store filtered table data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSegmentFilter, setSelectedSegmentFilter] =
    useState("All Segments");

  // Get contexts
  const { selectedAdvisor } = useAdvisor();

  const { filters, filterOptions } = useReportFilters();

  // Fetch data using centralized approach
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build API parameters with filters from context
        const params = filtersToApiParams(filters, selectedAdvisor);

        // Use the centralized getClients function
        const clients = await getClients(params);

        // Transform clients data into inception report format
        const inceptionReportData = generateInceptionReportFromClients(clients);
        setAllInceptionData(inceptionReportData);

        // Transform clients for table display
        const inceptionClients = clients.map(transformToInceptionClient);
        setFilteredTableClients(inceptionClients);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load inception data";
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters, selectedAdvisor]);

  // Client-side filtering function (now for display filters only since server handles main filtering)
  const applyDisplayFilters = () => {
    if (!allInceptionData) {
      return;
    }

    // Start with all clients (already filtered by server-side filtering)
    let displayClients = filteredTableClients;

    // Apply local search filter
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      displayClients = displayClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.segment.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.advisor?.toLowerCase().includes(searchLower)
      );
    }

    // Apply segment filter
    if (selectedSegmentFilter !== "All Segments") {
      displayClients = displayClients.filter(
        (client) => client.segment === selectedSegmentFilter
      );
    }

    // Apply year filter (filter by inception year)
    displayClients = displayClients.filter((client) => {
      // If client has no inception date, show them regardless of year (they don't belong to any specific year)
      if (!client.inceptionDate) return true;
      // If client has inception date, filter by year
      const inceptionYear = new Date(client.inceptionDate).getFullYear();
      return inceptionYear === selectedYear;
    });

    return displayClients;
  };

  // Get filtered clients for display
  const displayClients = applyDisplayFilters() || [];

  // Get legend data for the selected year
  const getSelectedYearLegend = () => {
    if (!allInceptionData?.chartData) return [];

    const selectedYearData = allInceptionData.chartData.find(
      (data) => data.year === selectedYear
    ) || {
      year: selectedYear,
      Platinum: 0,
      Gold: 0,
      Silver: 0,
      "N/A": 0,
    };

    // Calculate total from individual segments to ensure accuracy
    const totalCount =
      selectedYearData.Platinum +
      selectedYearData.Gold +
      selectedYearData.Silver +
      selectedYearData["N/A"];

    return [
      { segment: "Platinum", count: selectedYearData.Platinum },
      { segment: "Gold", count: selectedYearData.Gold },
      { segment: "Silver", count: selectedYearData.Silver },
      { segment: "N/A", count: selectedYearData["N/A"] },
      { segment: "Total", count: totalCount },
    ];
  };

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

    return allInceptionData.chartData.map((item) => ({
      ...item,
      [selectedSegmentFilter]:
        item[selectedSegmentFilter as keyof typeof item] || 0,
      ...(selectedSegmentFilter !== "Platinum" && { Platinum: 0 }),
      ...(selectedSegmentFilter !== "Gold" && { Gold: 0 }),
      ...(selectedSegmentFilter !== "Silver" && { Silver: 0 }),
      ...(selectedSegmentFilter !== "N/A" && { "N/A": 0 }),
    }));
  };

  // Get percentage change for the selected year
  const getSelectedYearPercentageChange = () => {
    if (!allInceptionData?.chartData) return 0;

    const selectedYearData = allInceptionData.chartData.find(
      (data) => data.year === selectedYear
    );
    const previousYearData = allInceptionData.chartData.find(
      (data) => data.year === selectedYear - 1
    );

    const selectedYearTotal = selectedYearData
      ? selectedYearData.Platinum +
        selectedYearData.Gold +
        selectedYearData.Silver +
        selectedYearData["N/A"]
      : 0;
    const previousYearTotal = previousYearData
      ? previousYearData.Platinum +
        previousYearData.Gold +
        previousYearData.Silver +
        previousYearData["N/A"]
      : 0;

    return previousYearTotal > 0
      ? Math.round(
          ((selectedYearTotal - previousYearTotal) / previousYearTotal) * 100
        )
      : 0;
  };

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  const segmentButtons = ["All Segments", "Platinum", "Gold", "Silver", "N/A"];
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
                  {filters.advisorIds.length === 1 &&
                  filters.advisorIds[0] !== "All Advisors"
                    ? getAdvisorReportTitle(
                        "Clients by Inception Date",
                        filters,
                        filterOptions || undefined
                      )
                    : "Clients by Inception Date by Segmentation"}
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-foreground">
                  {(() => {
                    const legendData = getSelectedYearLegend();
                    const totalItem = legendData.find(
                      (item) => item.segment === "Total"
                    );
                    return totalItem?.count || 0;
                  })()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedYear} New Clients
                </p>
                <div className="flex items-center space-x-1">
                  {getSelectedYearPercentageChange() >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      getSelectedYearPercentageChange() >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {getSelectedYearPercentageChange() >= 0 ? "+" : ""}
                    {getSelectedYearPercentageChange()}% vs previous year
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
                    style={{ cursor: "pointer" }}
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
                      style={{ cursor: "pointer" }}
                    />
                    <Bar
                      dataKey="Gold"
                      stackId="a"
                      fill="hsl(216, 65%, 58%)"
                      onClick={handleBarClick}
                      style={{ cursor: "pointer" }}
                    />
                    <Bar
                      dataKey="Silver"
                      stackId="a"
                      fill="hsl(210, 55%, 78%)"
                      onClick={handleBarClick}
                      style={{ cursor: "pointer" }}
                    />
                    <Bar
                      dataKey="N/A"
                      stackId="a"
                      fill="hsl(220, 14%, 60%)"
                      onClick={handleBarClick}
                      style={{ cursor: "pointer" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend - 1/4 width - exact match to reference */}
            <div className="lg:col-span-1">
              <div className="bg-white border rounded-lg p-4 h-full">
                <h4 className="text-sm font-medium mb-4">
                  New Clients by Segment ({selectedYear})
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Segment</span>
                    <span className="text-sm font-medium">Clients</span>
                  </div>

                  {getSelectedYearLegend()
                    .filter(
                      (item) =>
                        (selectedSegmentFilter === "All Segments" ||
                          item.segment === selectedSegmentFilter) &&
                        item.segment !== "Total"
                    )
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
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
                                  : item.segment === "N/A"
                                  ? "hsl(220, 14%, 60%)"
                                  : "#6b7280",
                            }}
                          />
                          <span className="text-sm">{item.segment}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {item.count}
                        </span>
                      </div>
                    ))}

                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">
                      {(() => {
                        if (selectedSegmentFilter === "All Segments") {
                          // Use the pre-calculated total from legend data
                          return (
                            getSelectedYearLegend().find(
                              (item) => item.segment === "Total"
                            )?.count || 0
                          );
                        } else {
                          // For filtered segments, sum only the individual segments (exclude "Total")
                          return (
                            getSelectedYearLegend()
                              .filter(
                                (item) =>
                                  item.segment === selectedSegmentFilter &&
                                  item.segment !== "Total"
                              )
                              .reduce((sum, item) => sum + item.count, 0) || 0
                          );
                        }
                      })()}
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
              <span>{displayClients.length} records</span>
              <span>
                {selectedSegmentFilter} • {selectedYear}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="p-4">
              <TableSkeleton rows={8} />
            </div>
          )}
          {!isLoading && displayClients.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No clients match the current filters.
            </div>
          )}
          {!isLoading && displayClients.length > 0 && (
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
                  {displayClients.map((client) => {
                    const gradeClasses = getGradeBadgeClasses(client.segment);

                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-medium">{client.name}</span>
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
                          {client.inceptionDate
                            ? formatDate(client.inceptionDate)
                            : "N/A"}
                        </TableCell>
                        <TableCell>{client.advisor || "N/A"}</TableCell>
                        <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  );
}
