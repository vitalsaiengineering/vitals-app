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
import {
  ArrowUpDown,
  Search,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
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
import { AumChart } from "@/components/dashboard-new/AumChart";
import { getClients } from "@/lib/clientData";
import { StandardClient } from "@/types/client";

import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { filtersToApiParams } from "@/utils/filter-utils";
import { getSegmentName, getPrettyClientName } from "@/utils/client-analytics";
import { FilteredReportSkeleton } from "@/components/ui/skeleton";
import { ViewContactButton } from "@/components/ui/view-contact-button";

// Define types that work with StandardClient
interface BookDevelopmentClient extends Omit<StandardClient, "segment"> {
  segment: SegmentName;
  yearsWithFirm: number;
  yearsWithFirmText: string;
  sinceDateText: string;
}

interface YearlySegmentDataPoint {
  year: number;
  value: number;
  previousYearValue?: number;
}

interface BookDevelopmentSegmentData {
  name: "Platinum" | "Gold" | "Silver" | "N/A";
  color: string;
  fillColor?: string;
  dataAUM: YearlySegmentDataPoint[];
  dataClientCount: YearlySegmentDataPoint[];
  clients: BookDevelopmentClient[];
}

interface BookDevelopmentReportData {
  allSegmentsData: BookDevelopmentSegmentData[];
}

type ChartView = "clientCount" | "assetsUnderManagement";
type SegmentName = "Platinum" | "Gold" | "Silver" | "N/A";
type SegmentSelection = SegmentName | "All Segments";

// Updated colors to match the design's blue theme more closely
const SEGMENT_COLORS = {
  Platinum: {
    base: "hsl(222, 47%, 44%)",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800",
    badgeBorder: "border-blue-200",
  },
  Gold: {
    base: "hsl(216, 65%, 58%)",
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-800",
    badgeBorder: "border-yellow-200",
  },
  Silver: {
    base: "hsl(210, 55%, 78%)",
    badgeBg: "bg-gray-50",
    badgeText: "text-gray-800",
    badgeBorder: "border-gray-200",
  },
  "N/A": {
    base: "hsl(0, 0%, 60%)",
    badgeBg: "bg-gray-50",
    badgeText: "text-gray-800",
    badgeBorder: "border-gray-200",
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
  chartData,
}: TooltipProps<ValueType, NameType> & {
  view: ChartView;
  originalSeriesData: BookDevelopmentSegmentData[];
  chartData: SegmentChartData[];
}) => {
  if (active && payload && payload.length && originalSeriesData && label) {
    const year = Number(label);
    let totalValue = 0;
    let totalPreviousYearValue = 0;
    let hasAnyPreviousValueForTotal = false;

    const items = payload
      .map((pld) => {
        const segmentName = pld.name as SegmentName;
        const currentValue = pld.value as number;
        totalValue += currentValue;

        // Use the actual chart data to get previous year value
        // Find the previous year in the chart data
        const previousYearValue = chartData.find(
          (d: SegmentChartData) => d.year === year - 1
        )?.[segmentName];

        let yoy: number | null | typeof Infinity = null;
        if (previousYearValue !== undefined && previousYearValue !== null) {
          if (previousYearValue !== 0) {
            yoy =
              ((currentValue - previousYearValue) / previousYearValue) * 100;
          } else if (currentValue > 0) {
            yoy = Infinity;
          } else {
            yoy = 0;
          }
          totalPreviousYearValue += previousYearValue;
          hasAnyPreviousValueForTotal = true;
        }

        return {
          name: segmentName,
          color:
            originalSeriesData.find((s) => s.name === segmentName)?.color ||
            pld.color,
          value: currentValue,
          yoy: yoy,
        };
      })
      .sort((a, b) => {
        const order: SegmentName[] = ["Platinum", "Gold", "Silver"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    let totalYoY: number | null | typeof Infinity = null;
    if (hasAnyPreviousValueForTotal && totalPreviousYearValue !== 0) {
      if (totalPreviousYearValue !== 0) {
        totalYoY =
          ((totalValue - totalPreviousYearValue) / totalPreviousYearValue) *
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
        : Math.round(val).toLocaleString();

    const formatGrowthRate = (value: number) => {
      return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
    };

    // Helper function for creating growth rate indicator
    const GrowthIndicator = ({
      value,
    }: {
      value: number | null | typeof Infinity;
    }) => {
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
        <span
          className={`${
            value > 0 ? "text-green-600" : "text-red-600"
          } flex items-center justify-end whitespace-nowrap text-[11px]`}
        >
          {formatGrowthRate(value)}
          {value > 0 ? (
            <TrendingUp className="inline ml-0.5 w-3 h-3" />
          ) : (
            <TrendingDown className="inline ml-0.5 w-3 h-3" />
          )}
        </span>
      );
    };

    const isFirstYear =
      originalSeriesData.length > 0 &&
      originalSeriesData[0].dataClientCount.length > 0 &&
      year ===
        Math.min(...originalSeriesData[0].dataClientCount.map((d) => d.year));

    return (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3 min-w-[240px]">
        <div className="font-medium text-sm mb-3 pb-1 border-b border-gray-200">
          {year}
        </div>

        <div className="space-y-2.5 text-xs">
          {items.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[100px_1fr_1fr] gap-x-2 items-center"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="whitespace-nowrap">{item.name}</span>
              </div>
              <div className="text-right flex justify-end items-center">
                <span className="font-medium tabular-nums">
                  {formatDisplayValue(item.value)}
                </span>
              </div>
              <div className="text-right">
                {!isFirstYear && <GrowthIndicator value={item.yoy} />}
              </div>
            </div>
          ))}

          <div className="border-t border-gray-200 pt-2 mt-1 grid grid-cols-[100px_1fr_1fr] gap-x-2 items-center">
            <span className="font-medium whitespace-nowrap">Total</span>
            <div className="text-right flex justify-end items-center">
              <span className="font-medium tabular-nums">
                {formatDisplayValue(totalValue)}
              </span>
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

// Add this interface at the top with other interfaces
interface SegmentChartData {
  year: number;
  Platinum: number;
  Gold: number;
  Silver: number;
  "N/A": number;
}

// Helper function to transform StandardClient to BookDevelopmentClient
const transformToBookDevelopmentClient = (
  client: StandardClient
): BookDevelopmentClient => {
  const inceptionDate = client.inceptionDate
    ? new Date(client.inceptionDate)
    : new Date();
  const yearsWithFirm = Math.floor(
    (Date.now() - inceptionDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  // Map lowercase segment names to capitalized ones
  const segmentMap: Record<string, SegmentName> = {
    platinum: "Platinum",
    gold: "Gold",
    silver: "Silver",
  };

  const mappedSegment = segmentMap[client.segment] || "N/A";

  return {
    ...client,
    name: getPrettyClientName(client), // Use getPrettyClientName function
    yearsWithFirm,
    yearsWithFirmText: `${yearsWithFirm} years`,
    sinceDateText: inceptionDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    segment: mappedSegment,
  };
};

// Helper function to generate mock segment data from clients
const generateSegmentDataFromClients = (
  clients: StandardClient[]
): BookDevelopmentReportData => {
  const transformedClients = clients.map(transformToBookDevelopmentClient);

  // Group clients by segment (including N/A)
  const clientsBySegment = transformedClients.reduce((acc, client) => {
    const segmentName = client.segment as SegmentName; // Already normalized by getSegmentName
    if (!acc[segmentName]) acc[segmentName] = [];
    acc[segmentName].push(client);
    return acc;
  }, {} as Record<SegmentName, BookDevelopmentClient[]>);

  // Generate yearly data for each segment (mock data for now)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

  const allSegmentsData: BookDevelopmentSegmentData[] = (
    ["Platinum", "Gold", "Silver", "N/A"] as SegmentName[]
  ).map((segmentName) => {
    const segmentClients = clientsBySegment[segmentName] || [];
    const segmentAUM = segmentClients.reduce((sum, c) => sum + c.aum, 0);

    // Generate mock yearly progression
    const baseClientCount = segmentClients.length;
    const baseAUM = segmentAUM;

    const dataClientCount = years.map((year) => ({
      year,
      value:
        baseClientCount > 0
          ? Math.max(
              1,
              Math.floor(baseClientCount * (0.6 + Math.random() * 0.4))
            )
          : 0,
    }));

    const dataAUM = years.map((year) => ({
      year,
      value:
        baseAUM > 0
          ? Math.max(100000, Math.floor(baseAUM * (0.6 + Math.random() * 0.4)))
          : 0,
    }));

    return {
      name: segmentName,
      color: SEGMENT_COLORS[segmentName].base,
      fillColor: SEGMENT_COLORS[segmentName].base,
      dataClientCount,
      dataAUM,
      clients: segmentClients,
    };
  }); // Show all segments even if they have no clients

  return { allSegmentsData };
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
    "Silver",
    "N/A",
  ]);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BookDevelopmentClient | null;
    direction: "ascending" | "descending";
  }>({ key: null, direction: "ascending" });

  const { filters, filterOptions } = useReportFilters();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch real data from standardized API
        const apiParams = filtersToApiParams(filters);
        const clients = await getClients(apiParams);
        const transformedData = generateSegmentDataFromClients(clients);
        setReportData(transformedData);
      } catch (error) {
        console.error("Error fetching report data:", error);
        setError("Failed to load report data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Filter clients based on search term and selected segments (now using server-filtered data)
  const filteredClients = useMemo(() => {
    if (!reportData) return [];

    // Extract all clients from the segment data
    let allClients: BookDevelopmentClient[] = [];
    if (reportData.allSegmentsData) {
      reportData.allSegmentsData.forEach(
        (segment: BookDevelopmentSegmentData) => {
          if (segment.clients && Array.isArray(segment.clients)) {
            allClients.push(...segment.clients);
          }
        }
      );
    }

    // Client data is now pre-filtered by advisor/date/segment from server
    // Only apply local search term filtering
    let filtered = allClients;
    if (filterSearchTerm.trim()) {
      const searchLower = filterSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          getPrettyClientName(client).toLowerCase().includes(searchLower) ||
          client.segment.toLowerCase().includes(searchLower) ||
          client.aum.toString().includes(searchLower)
      );
    }

    // Filter by selected segments (for chart display)
    if (selectedSegments.length > 0) {
      filtered = filtered.filter((client) =>
        selectedSegments.includes(client.segment as SegmentName)
      );
    }

    return filtered;
  }, [reportData, filterSearchTerm, selectedSegments]);

  // Sort clients based on sort config
  const sortedClients = useMemo(() => {
    if (!sortConfig.key) return filteredClients;

    return [...filteredClients].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined)
        return sortConfig.direction === "ascending" ? 1 : -1;
      if (bValue === undefined)
        return sortConfig.direction === "ascending" ? -1 : 1;

      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredClients, sortConfig]);

  // Calculate total pages
  const handleSegmentToggle = (segmentName: SegmentName) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentName)
        ? prev.filter((s) => s !== segmentName)
        : [...prev, segmentName]
    );
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearSegmentFilters = () => {
    setSelectedSegments(["Platinum", "Gold", "Silver", "N/A"]);
    setCurrentPage(1);
  };

  const handleTableSegmentChange = (value: string) => {
    if (value === "All Segments") {
      setSelectedSegments(["Platinum", "Gold", "Silver", "N/A"]);
    } else {
      setSelectedSegments([value as SegmentName]);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const filteredAndSortedClients = useMemo(() => {
    if (!reportData || !reportData.allSegmentsData) return [];

    let clientsToShow: BookDevelopmentClient[] = [];
    if (selectedSegments.length === 4) {
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
          getPrettyClientName(client).toLowerCase().includes(lowerSearchTerm) ||
          client.segment?.toLowerCase().includes(lowerSearchTerm) ||
          client.aum?.toString().includes(lowerSearchTerm)
      );
    }

    if (sortConfig.key) {
      clientsToShow.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        // Handle undefined values
        if (valA === undefined && valB === undefined) return 0;
        if (valA === undefined)
          return sortConfig.direction === "ascending" ? 1 : -1;
        if (valB === undefined)
          return sortConfig.direction === "ascending" ? -1 : 1;

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
    const order: SegmentName[] = ["Platinum", "Gold", "Silver", "N/A"];

    return reportData.allSegmentsData
      .filter((segment) => selectedSegments.includes(segment.name))
      .sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        // Handle case where segment might not be in order array
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
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

  // Add this function to match AumChart's data transformation
  const getMockSegmentData = (): SegmentChartData[] => {
    // Fallback data - removed mockData reference
    return [
      {
        year: 2019,
        Platinum: 40000000,
        Gold: 25000000,
        Silver: 12000000,
        "N/A": 2000000,
      },
      {
        year: 2020,
        Platinum: 43000000,
        Gold: 27000000,
        Silver: 13000000,
        "N/A": 2200000,
      },
      {
        year: 2021,
        Platinum: 46000000,
        Gold: 29000000,
        Silver: 14000000,
        "N/A": 2400000,
      },
      {
        year: 2022,
        Platinum: 50000000,
        Gold: 31000000,
        Silver: 15000000,
        "N/A": 2600000,
      },
      {
        year: 2023,
        Platinum: 54000000,
        Gold: 33000000,
        Silver: 16000000,
        "N/A": 2800000,
      },
      {
        year: 2024,
        Platinum: 58000000,
        Gold: 36000000,
        Silver: 17000000,
        "N/A": 3000000,
      },
      {
        year: 2025,
        Platinum: 63000000,
        Gold: 39000000,
        Silver: 18000000,
        "N/A": 3200000,
      },
    ];
  };

  // Update the rechartsFormattedData to exactly match AumChart's transformation
  const rechartsFormattedData = useMemo(() => {
    if (!reportData) return [];

    // For real data, transform it to match the same format as AumChart
    const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

    let baseData = years.map((year) => {
      const dataPoint: SegmentChartData = {
        year,
        Platinum: 0,
        Gold: 0,
        Silver: 0,
        "N/A": 0,
      };

      reportData.allSegmentsData.forEach((segment) => {
        const yearData =
          chartView === "assetsUnderManagement"
            ? segment.dataAUM.find((data) => data.year === year)
            : segment.dataClientCount.find((data) => data.year === year);

        if (yearData) {
          dataPoint[segment.name as keyof Omit<SegmentChartData, "year">] =
            yearData.value;
        }
      });

      return dataPoint;
    });

    // Apply advisor filtering to real data as well
    if (filters.advisorIds.length > 0) {
      // Create advisor-specific distribution patterns
      const advisorDistributionPatterns: Record<
        string,
        { Platinum: number; Gold: number; Silver: number; "N/A": number }
      > = {
        "Jackson Miller": {
          Platinum: 0.4,
          Gold: 0.35,
          Silver: 0.2,
          "N/A": 0.05,
        }, // First advisor has more Platinum
        "Sarah Johnson": {
          Platinum: 0.3,
          Gold: 0.45,
          Silver: 0.2,
          "N/A": 0.05,
        }, // Second advisor has more Gold
        "Thomas Chen": {
          Platinum: 0.25,
          Gold: 0.35,
          Silver: 0.35,
          "N/A": 0.05,
        }, // Third advisor has more Silver
        "Maria Reynolds": { Platinum: 0.3, Gold: 0.3, Silver: 0.3, "N/A": 0.1 }, // Fourth advisor is balanced with more N/A
      };

      // Use the pattern for this advisor (or a default pattern as fallback)
      const advisorName = filters.advisorIds[0]; // Assuming single advisor selection for now
      const pattern = advisorDistributionPatterns[advisorName] || {
        Platinum: 0.3,
        Gold: 0.3,
        Silver: 0.3,
        "N/A": 0.1,
      };

      // Assume each advisor manages roughly 25% of the total
      const ratio = 0.25;

      baseData = baseData.map((dataPoint) => {
        // Calculate total for this year including N/A
        const totalValue =
          dataPoint.Platinum +
          dataPoint.Gold +
          dataPoint.Silver +
          dataPoint["N/A"];

        // Apply the ratio to get this advisor's portion
        const advisorTotal = totalValue * ratio;

        // Distribute according to this advisor's pattern
        return {
          year: dataPoint.year,
          Platinum: advisorTotal * pattern.Platinum,
          Gold: advisorTotal * pattern.Gold,
          Silver: advisorTotal * pattern.Silver,
          "N/A": advisorTotal * pattern["N/A"],
        };
      });
    }

    return baseData;
  }, [reportData, filters.advisorIds, chartView]);

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

  // Check if we're in single segment mode (show clear filter button)
  const isFiltered = selectedSegments.length === 1;
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSegments, filterSearchTerm, filters.advisorIds]);

  if (isLoading) return <FilteredReportSkeleton />;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!reportData)
    return <div className="p-6 text-center">No data available.</div>;

  const getSegmentBadgeClasses = (segmentName: SegmentName) => {
    const config = SEGMENT_COLORS[segmentName];
    return `${config?.badgeBg} ${config?.badgeText} ${config?.badgeBorder}`;
  };

  const formatPeriodValue = (value: number) => {
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

  const formatGrowthRate = (rate: number | typeof Infinity) => {
    if (rate === Infinity) return "New";
    return `${rate >= 0 ? "+" : ""}${rate.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {filters.advisorIds.length === 1
              ? `${
                  filterOptions?.advisors.find(
                    (a) => a.id === filters.advisorIds[0]
                  )?.name
                }'s Book Development by Segment`
              : "Book Development by Segment"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track cumulative client growth and AUM by segment over time
            {filters.advisorIds.length === 1 &&
              ` for ${
                filterOptions?.advisors.find(
                  (a) => a.id === filters.advisorIds[0]
                )?.name
              }`}
          </p>
        </CardHeader>
        <CardContent>
          {/* Chart Container with Toggle in Top Right */}
          <div className="relative">
            {/* Chart View Toggle - Top Right */}
            <div className="absolute top-2 right-4 z-10 flex items-center space-x-2 bg-white/90  rounded-full px-4 py-2">
              <Label
                htmlFor="chart-toggle-switch"
                className={`text-xs font-medium transition-colors ${
                  chartView === "clientCount"
                    ? "text-blue-600"
                    : "text-gray-600"
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
                className="scale-90 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor="chart-toggle-switch"
                className={`text-xs font-medium transition-colors ${
                  chartView === "assetsUnderManagement"
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Assets Under Management
              </Label>
            </div>

            {/* {chartView === "assetsUnderManagement" ? (
                <AumChart showViewFullReport={false} selectedAdvisor={selectedAdvisor} />
              ) : ( */}
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
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    content={
                      <CustomTooltipContent
                        view={chartView}
                        originalSeriesData={activeChartSeries}
                        chartData={rechartsFormattedData}
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
            {/* )} */}
          </div>

          {/* Segment Legend Below Chart */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {reportData.allSegmentsData.map((segment) => (
              <button
                key={segment.name}
                onClick={() => handleSegmentToggle(segment.name)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSegments.includes(segment.name)
                    ? "opacity-100 bg-blue-50 text-blue-700 shadow-sm scale-105"
                    : "opacity-70 hover:opacity-100 hover:bg-gray-50 hover:scale-105"
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
                className="text-muted-foreground hover:text-foreground ml-2 hover:bg-gray-50 transition-colors"
              >
                Clear filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                Clients as of 2025
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedSegments.length === 4
                  ? "All segments"
                  : `Filtered by ${selectedSegments.join(", ")} segments`}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search households..."
                  className="pl-10 w-full md:w-[280px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={filterSearchTerm}
                  onChange={(e) => {
                    setFilterSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={
                  selectedSegments.length === 4
                    ? "All Segments"
                    : selectedSegments[0]
                }
                onValueChange={handleTableSegmentChange}
              >
                <SelectTrigger className="w-full md:w-[180px] border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
              <span className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-2 rounded-full whitespace-nowrap border border-blue-200">
                {filteredClients.length} clients
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-semibold"
                  >
                    Client Name{" "}
                    <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50 group-hover:opacity-100 text-blue-600" />
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("segment")}
                    className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-semibold"
                  >
                    Segment{" "}
                    <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50 group-hover:opacity-100 text-blue-600" />
                  </TableHead>
                  <TableHead className="font-semibold">
                    Years with Firm
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("aum")}
                    className="text-right cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-semibold"
                  >
                    AUM{" "}
                    <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50 group-hover:opacity-100 text-blue-600" />
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <TableRow
                      key={client?.id}
                      className="hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <TableCell className="font-medium text-gray-900 group-hover:text-blue-900">
                        {client?.name || ""}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getSegmentBadgeClasses(
                            (client?.segment || "N/A") as SegmentName
                          )}`}
                        >
                          {client?.segment || ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {client?.yearsWithFirmText || ""}
                        </div>
                        <div className="text-xs text-gray-500">
                          {client?.sinceDateText || ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {client?.aum?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }) || ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="opacity-70 group-hover:opacity-100 transition-all duration-200">
                          <ViewContactButton
                            clientId={client.id}
                            wealthboxClientId={client.wealthboxClientId}
                            orionClientId={client.orionClientId}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-gray-500"
                    >
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
                className="border-gray-200 hover:bg-gray-50"
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
                className="border-gray-200 hover:bg-gray-50"
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
