import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, Search, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  getBookDevelopmentReportData,
  type BookDevelopmentReportData,
  type BookDevelopmentClient,
  type BookDevelopmentSegmentData,
} from "@/lib/clientData";

// Import mock data
import mockData from "@/data/mockData.js";

type ChartView = "clientCount" | "assetsUnderManagement";
type SegmentName = "Platinum" | "Gold" | "Silver";
type SegmentSelection = SegmentName | "All Segments";

// Updated colors to match the design's blue theme more closely
const SEGMENT_COLORS = {
  Platinum: {
    base: "hsl(222, 47%, 44%)",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
  },
  Gold: {
    base: "hsl(216, 65%, 58%)",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-200",
  },
  Silver: {
    base: "hsl(210, 55%, 78%)",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-slate-200",
  },
};

const ITEMS_PER_PAGE = 10;

// Custom Tooltip Content Component - Redesigned to match Lovable code exactly
const CustomTooltipContent = ({
  active,
  payload,
  label,
  view,
  originalSeriesData,
}: TooltipProps<ValueType, NameType> & {
  view: ChartView;
  originalSeriesData: BookDevelopmentSegmentData[];
}) => {
  if (active && payload && payload.length && originalSeriesData && label) {
    const year = Number(label);
    let totalValue = 0;
    let totalPreviousYearValueForYoY = 0;
    let hasAnyPreviousValueForTotal = false;

    const items = payload
      .map((pld) => {
        const segmentName = pld.name as SegmentName;
        const currentValue = pld.value as number;
        totalValue += currentValue;

        const series = originalSeriesData.find((s) => s.name === segmentName);
        const seriesDataPoints = series
          ? view === "assetsUnderManagement"
            ? series.dataAUM
            : series.dataClientCount
          : [];
        const dataPointForSegment = seriesDataPoints.find(
          (dp) => dp.year === year
        );
        const previousValue = dataPointForSegment?.previousYearValue;

        let yoy: number | null | typeof Infinity = null;
        if (previousValue !== undefined && previousValue !== null) {
          if (previousValue !== 0) {
            yoy = ((currentValue - previousValue) / previousValue) * 100;
          } else if (currentValue > 0) {
            yoy = Infinity;
          } else {
            yoy = 0;
          }
          totalPreviousYearValueForYoY += previousValue;
          hasAnyPreviousValueForTotal = true;
        }

        return {
          name: segmentName,
          color: series?.color || pld.color,
          value: currentValue,
          yoy: yoy,
        };
      })
      .sort((a, b) => {
        const order: SegmentName[] = ["Platinum", "Gold", "Silver"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    let totalYoY: number | null | typeof Infinity = null;
    if (hasAnyPreviousValueForTotal) {
      if (totalPreviousYearValueForYoY !== 0) {
        totalYoY =
          ((totalValue - totalPreviousYearValueForYoY) /
            totalPreviousYearValueForYoY) *
          100;
      } else if (totalValue > 0) {
        totalYoY = Infinity;
      } else {
        totalYoY = 0;
      }
    }

    const formatDisplayValue = (val: number) =>
      view === "assetsUnderManagement"
        ? `$${(val / 1000000).toFixed(1)}M`
        : val.toLocaleString();

    const formatGrowthRate = (value: number) => {
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    // Helper function for creating growth rate indicator
    const GrowthIndicator = ({ value }: { value: number | null | typeof Infinity }) => {
      if (value === null || value === 0) return null;
      
      if (value === Infinity) {
        return (
          <span className="text-green-600 flex items-center justify-end whitespace-nowrap text-[11px]">
            +New
            <TrendingUp className="inline ml-0.5 w-3 h-3" />
          </span>
        );
      }
      
      return (
        <span className={`${value > 0 ? 'text-green-600' : 'text-red-600'} flex items-center justify-end whitespace-nowrap text-[11px]`}>
          {formatGrowthRate(value)}
          {value > 0 ? 
            <TrendingUp className="inline ml-0.5 w-3 h-3" /> : 
            <TrendingDown className="inline ml-0.5 w-3 h-3" />
          }
        </span>
      );
    };

    const isFirstYear = originalSeriesData.length > 0 && 
      originalSeriesData[0].dataClientCount.length > 0 && 
      year === Math.min(...originalSeriesData[0].dataClientCount.map(d => d.year));

    return (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3 min-w-[240px]">
        <div className="font-medium text-sm mb-3 pb-1 border-b border-gray-200">{year}</div>
        
        <div className="space-y-2.5 text-xs">
          {items.map((item) => (
            <div key={item.name} className="grid grid-cols-[100px_1fr_1fr] gap-x-2 items-center">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="whitespace-nowrap">{item.name}</span>
              </div>
              <div className="text-right flex justify-end items-center">
                <span className="font-medium tabular-nums">{formatDisplayValue(item.value)}</span>
              </div>
              <div className="text-right">
                {!isFirstYear && <GrowthIndicator value={item.yoy} />}
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-200 pt-2 mt-1 grid grid-cols-[100px_1fr_1fr] gap-x-2 items-center">
            <span className="font-medium whitespace-nowrap">Total</span>
            <div className="text-right flex justify-end items-center">
              <span className="font-medium tabular-nums">{formatDisplayValue(totalValue)}</span>
            </div>
            <div className="text-right">
              {!isFirstYear && <GrowthIndicator value={totalYoY} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function BookDevelopmentBySegmentReport() {
  const [reportData, setReportData] =
    useState<BookDevelopmentReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartView, setChartView] = useState<ChartView>("clientCount");
  const [selectedSegments, setSelectedSegments] = useState<SegmentName[]>([
    "Platinum",
    "Gold", 
    "Silver"
  ]);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BookDevelopmentClient | null;
    direction: "ascending" | "descending";
  }>({ key: null, direction: "ascending" });

  // Check if we should use mock data
  const useMock = import.meta.env.VITE_USE_MOCK_DATA !== "false";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (useMock) {
          // Use mock data
          const mockReportData =
            mockData.BookDevelopmentBySegmentReport as BookDevelopmentReportData;
          if (!mockReportData || !mockReportData.allSegmentsData) {
            throw new Error("Invalid mock data: missing allSegmentsData");
          }
          setReportData(mockReportData);
          // Keep default segment selection
        } else {
          // Try to fetch from API, fallback to mock data on error
          try {
            const data = await getBookDevelopmentReportData();
            if (!data || !data.allSegmentsData) {
              throw new Error("Invalid API response: missing allSegmentsData");
            }
            setReportData(data);
            // Keep default segment selection
          } catch (apiError) {
            console.warn(
              "API fetch failed, falling back to mock data:",
              apiError
            );
            const mockReportData =
              mockData.BookDevelopmentBySegmentReport as BookDevelopmentReportData;
            if (!mockReportData || !mockReportData.allSegmentsData) {
              throw new Error("Fallback failed: invalid mock data structure");
            }
            setReportData(mockReportData);
            // Keep default segment selection
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load report data"
        );
        console.error("BookDevelopmentBySegmentReport error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [useMock]);

  const handleSegmentToggle = (segmentName: SegmentName) => {
    if (selectedSegments.length === 1 && selectedSegments.includes(segmentName)) {
      // If clicking the currently selected single segment, show all segments
      setSelectedSegments(["Platinum", "Gold", "Silver"]);
    } else {
      // Otherwise, show only this segment
      setSelectedSegments([segmentName]);
    }
    setCurrentPage(1);
  };

  const handleClearSegmentFilters = () => {
    setSelectedSegments(["Platinum", "Gold", "Silver"]);
    setCurrentPage(1);
  };

  const handleTableSegmentChange = (value: string) => {
    if (value === "All Segments") {
      setSelectedSegments(["Platinum", "Gold", "Silver"]);
    } else {
      setSelectedSegments([value as SegmentName]);
    }
    setCurrentPage(1);
  };

  const filteredAndSortedClients = useMemo(() => {
    if (!reportData || !reportData.allSegmentsData) return [];

    let clientsToShow: BookDevelopmentClient[] = [];
    if (selectedSegments.length === 3) {
      // All segments selected
      clientsToShow = reportData.allSegmentsData.flatMap(
        (s) => s.clients || []
      );
    } else {
      // Specific segment selected
      clientsToShow = reportData.allSegmentsData
        .filter((s) => selectedSegments.includes(s.name))
        .flatMap((s) => s.clients || []);
    }

    if (filterSearchTerm) {
      const lowerSearchTerm = filterSearchTerm.toLowerCase();
      clientsToShow = clientsToShow.filter(
        (client) =>
          client.name?.toLowerCase().includes(lowerSearchTerm) ||
          client.segment?.toLowerCase().includes(lowerSearchTerm) ||
          client.aum?.toString().includes(lowerSearchTerm)
      );
    }

    if (sortConfig.key) {
      clientsToShow.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];
        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return clientsToShow;
  }, [reportData, selectedSegments, filterSearchTerm, sortConfig]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedClients.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedClients, currentPage]);

  const totalPages = Math.ceil(
    filteredAndSortedClients.length / ITEMS_PER_PAGE
  );

  const handleSort = (key: keyof BookDevelopmentClient) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const activeChartSeries = useMemo(() => {
    if (!reportData) return [];
    const order: SegmentName[] = ["Platinum", "Gold", "Silver"];
    
    return reportData.allSegmentsData
      .filter((segment) => selectedSegments.includes(segment.name))
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
      .map((segment) => ({
        name: segment.name,
        color: segment.color,
        fillColor: segment.fillColor || segment.color,
        dataAUM: segment.dataAUM,
        dataClientCount: segment.dataClientCount,
        clients: segment.clients,
        data:
          chartView === "assetsUnderManagement"
            ? segment.dataAUM
            : segment.dataClientCount,
      }));
  }, [reportData, selectedSegments, chartView]);

  const rechartsFormattedData = useMemo(() => {
    if (!reportData || activeChartSeries.length === 0) return [];
    const allYears = new Set<number>();
    activeChartSeries.forEach((series) => {
      series.data.forEach((dp) => allYears.add(dp.year));
    });
    const sortedYears = Array.from(allYears).sort((a, b) => a - b);

    return sortedYears.map((year) => {
      const yearData: { year: number; [segmentName: string]: number } = {
        year,
      };
      activeChartSeries.forEach((series) => {
        const point = series.data.find((dp) => dp.year === year);
        yearData[series.name] = point ? point.value : 0;
      });
      return yearData;
    });
  }, [reportData, activeChartSeries]);

  const yAxisTickFormatter = (value: number) => {
    if (chartView === "assetsUnderManagement") {
      if (Math.abs(value) >= 1000000000)
        return `$${(value / 1000000000).toFixed(1)}B`;
      if (Math.abs(value) >= 1000000)
        return `$${(value / 1000000).toFixed(1)}M`;
      if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    }
    return value.toLocaleString();
  };

  // Calculate period totals
  const periodTotals = useMemo(() => {
    if (!reportData || !activeChartSeries.length) return null;
    
    const latestYear = Math.max(...rechartsFormattedData.map(d => d.year));
    const earliestYear = Math.min(...rechartsFormattedData.map(d => d.year));
    
    const latestData = rechartsFormattedData.find(d => d.year === latestYear);
    const earliestData = rechartsFormattedData.find(d => d.year === earliestYear);
    
    if (!latestData || !earliestData) return null;
    
    let currentTotal = 0;
    let previousTotal = 0;
    
    activeChartSeries.forEach(series => {
      currentTotal += latestData[series.name] || 0;
      previousTotal += earliestData[series.name] || 0;
    });
    
    const growthRate = previousTotal !== 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : currentTotal > 0 ? Infinity : 0;
    
    return {
      current: currentTotal,
      previous: previousTotal,
      growthRate,
      period: `${earliestYear}-${latestYear}`,
      latestYear
    };
  }, [rechartsFormattedData, activeChartSeries]);

  // Check if we're in single segment mode (show clear filter button)
  const isFiltered = selectedSegments.length === 1;

  if (isLoading)
    return <div className="p-6 text-center">Loading report data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!reportData)
    return <div className="p-6 text-center">No data available.</div>;

  const getSegmentBadgeClasses = (segmentName: SegmentName) => {
    const config = SEGMENT_COLORS[segmentName];
    return `${config?.badgeBg} ${config?.badgeText} ${config?.badgeBorder}`;
  };

  const formatPeriodValue = (value: number) => {
    if (chartView === "assetsUnderManagement") {
      if (Math.abs(value) >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
      if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    }
    return value.toLocaleString();
  };

  const formatGrowthRate = (rate: number | typeof Infinity) => {
    if (rate === Infinity) return "New";
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Development by Segment</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track cumulative client growth and AUM by segment over time
          </p>
        </CardHeader>
        <CardContent>


          {/* Chart Container with Toggle in Top Right */}
          <div className="relative">
            {/* Chart View Toggle - Top Right */}
            <div className="absolute top-2 right-4 z-10 flex items-center space-x-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border">
              <Label
                htmlFor="chart-toggle-switch"
                className={`text-xs ${
                  chartView === "clientCount"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Client Count
              </Label>
              <Switch
                id="chart-toggle-switch"
                checked={chartView === "assetsUnderManagement"}
                onCheckedChange={(checked) =>
                  setChartView(
                    checked ? "assetsUnderManagement" : "clientCount"
                  )
                }
                className="scale-75"
              />
              <Label
                htmlFor="chart-toggle-switch"
                className={`text-xs ${
                  chartView === "assetsUnderManagement"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Assets Under Management
              </Label>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={rechartsFormattedData}
                  margin={{ top: 40, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12 }}
                    axisLine={{ strokeOpacity: 0.3 }}
                    tickLine={{ strokeOpacity: 0.3 }}
                  />
                  <YAxis
                    tickFormatter={yAxisTickFormatter}
                    tick={{ fontSize: 12 }}
                    width={80}
                    axisLine={{ strokeOpacity: 0.3 }}
                    tickLine={{ strokeOpacity: 0.3 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    content={
                      <CustomTooltipContent
                        view={chartView}
                        originalSeriesData={activeChartSeries}
                      />
                    }
                    cursor={{
                      stroke: "hsl(var(--muted-foreground))",
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                    animationDuration={150}
                  />
                  {activeChartSeries.map((series) => (
                    <Area
                      key={series.name}
                      type="monotone"
                      dataKey={series.name}
                      stackId="1"
                      stroke={series.color}
                      fill={series.fillColor || series.color}
                      fillOpacity={0.85}
                      strokeWidth={2}
                      activeDot={{ r: 4, fill: series.color, strokeWidth: 0 }}
                      dot={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Segment Legend Below Chart */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {reportData.allSegmentsData.map((segment) => (
              <button
                key={segment.name}
                onClick={() => handleSegmentToggle(segment.name)}
                className={`flex items-center space-x-2 text-sm transition-opacity ${
                  selectedSegments.includes(segment.name) 
                    ? 'opacity-100' 
                    : 'opacity-50 hover:opacity-75'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></span>
                <span className="text-foreground">{segment.name}</span>
              </button>
            ))}
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={handleClearSegmentFilters}
                size="sm"
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                Clear filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <CardTitle>Clients as of 2025</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedSegments.length === 3
                  ? "All segments"
                  : `Filtered by ${selectedSegments.join(", ")} segments`}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search households..."
                  className="pl-8 w-full md:w-[250px]"
                  value={filterSearchTerm}
                  onChange={(e) => {
                    setFilterSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={selectedSegments.length === 3 ? "All Segments" : selectedSegments[0]}
                onValueChange={handleTableSegmentChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Select Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Segments">All Segments</SelectItem>
                  {reportData.allSegmentsData.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md whitespace-nowrap">
                {filteredAndSortedClients.length} clients
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    Client Name{" "}
                    <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("segment")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    Segment{" "}
                    <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </TableHead>
                  <TableHead>Years with Firm</TableHead>
                  <TableHead
                    onClick={() => handleSort("aum")}
                    className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    AUM{" "}
                    <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <TableRow
                      key={client?.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">
                        {client?.name || ""}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${getSegmentBadgeClasses(
                            client?.segment
                          )}`}
                        >
                          {client?.segment || ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>{client?.yearsWithFirmText || ""}</div>
                        <div className="text-xs text-muted-foreground">
                          {client?.sinceDateText || ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {client?.aum?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }) || ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="default">
                          View Contact
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No clients match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

