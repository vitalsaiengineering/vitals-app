import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { ChevronUp, ChevronDown } from "lucide-react";

// Import standardized types and utilities
import { StandardClient, FilterableClientResponse } from "@/types/client";
import {
  calculateAgeDemographics,
  AgeDemographicsData,
  getPrettyClientName,
  formatAUM,
} from "@/utils/client-analytics";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { filtersToApiParams } from "@/utils/filter-utils";
import { getClients } from "@/lib/clientData";
import { ReportSkeleton } from "@/components/ui/skeleton";

// Import contexts

import { useAdvisor } from "@/contexts/AdvisorContext";
import { ExternalLink } from "lucide-react";
import { ViewContactButton } from "@/components/ui/view-contact-button";

// Segment colors configuration
const SEGMENT_COLORS_HSL: { [key: string]: string } = {
  silver: "hsl(var(--chart-3))",
  gold: "hsl(var(--chart-2))",
  platinum: "hsl(var(--chart-1))",
  DEFAULT: "hsl(var(--chart-4))",
};

// Chart configuration for the 3 segments
const chartConfig: { [key: string]: { label: string; color: string } } = {
  silver: { label: "Silver", color: SEGMENT_COLORS_HSL.silver },
  gold: { label: "Gold", color: SEGMENT_COLORS_HSL.gold },
  platinum: { label: "Platinum", color: SEGMENT_COLORS_HSL.platinum },
  totalClients: { label: "Total Clients", color: SEGMENT_COLORS_HSL.DEFAULT },
  totalAum: { label: "Total AUM", color: SEGMENT_COLORS_HSL.DEFAULT },
};

// Define type for sort configuration
type SortConfig = {
  key: keyof StandardClient | 'aumDisplay';
  direction: 'asc' | 'desc';
};

// Custom Tooltip Component
const CustomChartTooltip = ({
  active,
  payload,
  label,
  isAumViewInTooltip,
  reportData,
}: TooltipProps<ValueType, NameType> & {
  isAumViewInTooltip: boolean;
  reportData: AgeDemographicsData | null;
}) => {
  if (active && payload && payload.length && reportData) {
    const originalBracketData = reportData.byAgeBracket.find(
      (b) => b.bracket === label
    );

    return (
      <div className="bg-background p-3 border border-border shadow-lg rounded-md text-xs min-w-[180px]">
        <p className="font-bold text-sm mb-2">{label}</p>
        {!isAumViewInTooltip && originalBracketData && (
          <p className="mb-1 text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {originalBracketData.clientCount} Clients (
              {originalBracketData.clientPercentage.toFixed(1)}%)
            </span>
          </p>
        )}
        {isAumViewInTooltip && originalBracketData && (
          <p className="mb-1 text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {formatAUM(originalBracketData.aum)} (
              {originalBracketData.aumPercentage.toFixed(1)}%)
            </span>
          </p>
        )}
        <div className="mt-1 space-y-0.5">
          {payload.map((entry) => {
            if (
              entry.dataKey &&
              chartConfig[entry.dataKey as string]?.label &&
              !entry.dataKey?.toString().toLowerCase().includes("total")
            ) {
              return (
                <div
                  key={entry.dataKey}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{
                        backgroundColor:
                          entry.color ||
                          chartConfig[entry.dataKey as string]?.color,
                      }}
                    />
                    <span>{chartConfig[entry.dataKey as string]?.label}:</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {!isAumViewInTooltip
                      ? Number(entry.value).toLocaleString()
                      : formatAUM(Number(entry.value))}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }
  return null;
};

// Helper function to get dot color for age brackets (updated brackets)
const getBracketDotColor = (bracket: string): string => {
  switch (bracket) {
    case "0-20":
      return "hsl(var(--age-band-under-20))";
    case "21-40":
      return "hsl(var(--age-band-21-40))";
    case "41-60":
      return "hsl(var(--age-band-41-60))";
    case "61-80":
      return "hsl(var(--age-band-61-80))";
    case "81+":
      return "hsl(var(--age-band-over-80))";
    default:
      return "hsl(var(--age-band-default))";
  }
};

interface AgeDemographicsReportProps {
  reportId: string;
}

export default function AgeDemographicsReport({
  reportId,
}: AgeDemographicsReportProps) {
  const [isAumView, setIsAumView] = useState<boolean>(false);
  const [selectedAgeBracketForTable, setSelectedAgeBracketForTable] = useState<
    string | null
  >(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'age',
    direction: 'asc'
  });

  // State for fetched data, loading, and error
  const [clients, setClients] = useState<StandardClient[]>([]);
  const [reportData, setReportData] = useState<AgeDemographicsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Contexts
  const { selectedAdvisor } = useAdvisor();
  const { filters } = useReportFilters();

  // Function to handle column sorting
  const requestSort = (key: keyof StandardClient | 'aumDisplay') => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: keyof StandardClient | 'aumDisplay') => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" /> 
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Fetch data from unified API endpoint
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build API parameters with filters from context
        const params = filtersToApiParams(filters, selectedAdvisor);

        // Use the centralized getClients function
        const result = await getClients(params);

        // Set clients and calculate analytics
        setClients(result);
        const calculatedData = calculateAgeDemographics(result);
        setReportData(calculatedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch report data"
        );
        console.error("Error fetching clients:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [reportId, selectedAdvisor, filters]);

  // Define the desired stacking order (bottom to top)
  const desiredSegmentOrder = ["platinum", "gold", "silver"];

  const chartDataForRecharts = useMemo(() => {
    if (!reportData) return [];
    return reportData.byAgeBracket.map((bracket) => {
      const base = { name: bracket.bracket };
      if (!isAumView) {
        // Clients view
        const clientSegments: { [key: string]: number } = {};
        bracket.detailedBreakdown?.forEach((detail) => {
          clientSegments[detail.segment.toLowerCase()] = detail.clients;
        });
        return {
          ...base,
          ...clientSegments,
          totalClients: bracket.clientCount,
        };
      } else {
        // AUM view
        const aumSegments: { [key: string]: number } = {};
        bracket.detailedBreakdown?.forEach((detail) => {
          aumSegments[detail.segment.toLowerCase()] = detail.aum;
        });
        return { ...base, ...aumSegments, totalAum: bracket.aum };
      }
    });
  }, [reportData, isAumView]);

  const displayData = useMemo(() => {
    if (!reportData) return null;
    
    // Filter clients by selected age bracket
    const filteredClients = clients.filter((client) => {
      if (!selectedAgeBracketForTable) return true;
      const age = client.age;
      switch (selectedAgeBracketForTable) {
        case "0-20":
          return age >= 0 && age <= 20;
        case "21-40":
          return age >= 21 && age <= 40;
        case "41-60":
          return age >= 41 && age <= 60;
        case "61-80":
          return age >= 61 && age <= 80;
        case "81+":
          return age >= 81;
        default:
          return true;
      }
    });
    
    // Apply sorting to the filtered clients
    const sortedClients = [...filteredClients].sort((a, b) => {
      const key = sortConfig.key;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      // Special case for aumDisplay which is a derived field
      if (key === 'aumDisplay') {
        // Handle null or undefined values - always put them at the end
        if (!a.aum && b.aum) return 1;
        if (a.aum && !b.aum) return -1;
        if (!a.aum && !b.aum) return 0;
        
        return ((a.aum || 0) - (b.aum || 0)) * direction;
      }
      
      // Handle name which is a composite field
      if (key === 'name' || key === 'firstName' || key === 'lastName') {
        const nameA = getPrettyClientName(a).toLowerCase();
        const nameB = getPrettyClientName(b).toLowerCase();
        return nameA.localeCompare(nameB) * direction;
      }
      
      // Handle date fields
      if (key === 'inceptionDate' || key === 'dateOfBirth') {
        // If one value is null/undefined and the other isn't, null values should be at the end
        if (!a[key] && b[key]) return 1;
        if (a[key] && !b[key]) return -1;
        if (!a[key] && !b[key]) return 0;
        
        // Otherwise compare the dates
        const dateA = new Date(a[key] as string).getTime();
        const dateB = new Date(b[key] as string).getTime();
        
        // Handle invalid dates
        if (isNaN(dateA) && !isNaN(dateB)) return 1;
        if (!isNaN(dateA) && isNaN(dateB)) return -1;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        
        return (dateA - dateB) * direction;
      }
      
      // Handle numeric fields
      if (typeof a[key] === 'number' && typeof b[key] === 'number') {
        return ((a[key] as number) - (b[key] as number)) * direction;
      }
      
      // Handle string fields
      const valueA = String(a[key] || '').toLowerCase();
      const valueB = String(b[key] || '').toLowerCase();
      
      // If one value is empty and the other isn't, empty values should be at the end
      if (!valueA && valueB) return 1;
      if (valueA && !valueB) return -1;
      
      return valueA.localeCompare(valueB) * direction;
    });
    
    return {
      totalValue: !isAumView
        ? reportData.overall.totalClients
        : formatAUM(reportData.overall.totalAUM),
      totalLabel: !isAumView ? "Total Clients" : "Total AUM",
      averageClientAge: reportData.overall.averageClientAge,
      brackets: reportData.byAgeBracket.map((b) => ({
        ...b,
        displayValue: !isAumView ? b.clientCount : formatAUM(b.aum),
        displayPercentage: !isAumView ? b.clientPercentage : b.aumPercentage,
        valueLabel: !isAumView ? "Clients" : "AUM",
        isSelected: selectedAgeBracketForTable === b.bracket,
        dotColor: getBracketDotColor(b.bracket),
      })),
      tableData: sortedClients
        .filter((client) => {
          if (!selectedAgeBracketForTable) return true;
          const age = client.age;
          switch (selectedAgeBracketForTable) {
            case "0-20":
              return age >= 0 && age <= 20;
            case "21-40":
              return age >= 21 && age <= 40;
            case "41-60":
              return age >= 41 && age <= 60;
            case "61-80":
              return age >= 61 && age <= 80;
            case "81+":
              return age >= 81;
            default:
              return true;
          }
        })
        .map((client) => ({
          ...client,
          aumDisplay: client.aum ? formatAUM(client.aum) : "N/A",
        })),
    };
  }, [isAumView, reportData, selectedAgeBracketForTable, clients, sortConfig]);

  const segmentsInChart = useMemo(() => {
    if (!reportData) return [];
    const allSegments = new Set<string>();
    reportData.byAgeBracket.forEach((bracket) => {
      bracket.detailedBreakdown?.forEach((detail) =>
        allSegments.add(detail.segment.toLowerCase())
      );
    });
    return Array.from(allSegments).sort((a, b) => {
      const indexA = desiredSegmentOrder.indexOf(a);
      const indexB = desiredSegmentOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [reportData]);

  const handleSummaryCardClick = (bracket: string) => {
    setSelectedAgeBracketForTable((prev) =>
      prev === bracket ? null : bracket
    );
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedBracketName = data.activePayload[0].payload.name;
      if (clickedBracketName) {
        setSelectedAgeBracketForTable((prev) =>
          prev === clickedBracketName ? null : clickedBracketName
        );
      }
    }
  };

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (error || !displayData) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading report: {error || "No data available"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Client Age Demographics
              </CardTitle>
              <CardDescription className="text-gray-600 mt-3 text-base">
                {displayData.totalLabel}: {displayData.totalValue}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
              <Label
                htmlFor="aum-toggle"
                className={
                  !isAumView ? "text-blue-600 font-semibold" : "text-gray-500"
                }
              >
                Clients
              </Label>
              <Switch
                id="aum-toggle"
                checked={isAumView}
                onCheckedChange={setIsAumView}
                aria-label="Toggle between AUM and Clients view"
              />
              <Label
                htmlFor="aum-toggle"
                className={
                  isAumView ? "text-blue-600 font-semibold" : "text-gray-500"
                }
              >
                AUM
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/4 space-y-2 p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-base font-medium text-gray-600">
                Average Client Age
              </h3>
              <p className="text-4xl font-bold text-blue-600">
                {displayData.averageClientAge.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">years</p>
            </div>
            <div className="lg:w-3/4 h-[300px] lg:h-[350px] bg-muted/20 p-4 rounded-lg">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsBarChart
                  data={chartDataForRecharts}
                  margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                  onClick={handleBarClick}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      isAumView
                        ? `$${(Number(value) / 1000).toLocaleString()}k`
                        : value
                    }
                  />
                  <RechartsPrimitive.Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={
                      <CustomChartTooltip
                        isAumViewInTooltip={isAumView}
                        reportData={reportData}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {segmentsInChart.map((segment, index) => (
                    <Bar
                      key={segment}
                      dataKey={segment}
                      stackId="a"
                      fill={`var(--color-${segment})`}
                      name={chartConfig[segment]?.label || segment}
                      radius={
                        index === segmentsInChart.length - 1
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                      }
                    />
                  ))}
                  {segmentsInChart.length === 0 && reportData && (
                    <Bar
                      dataKey={!isAumView ? "totalClients" : "totalAum"}
                      fill={`var(--color-${
                        !isAumView ? "totalClients" : "totalAum"
                      })`}
                      name={
                        chartConfig[!isAumView ? "totalClients" : "totalAum"]
                          ?.label as string
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </RechartsBarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {displayData.brackets.map((bracket) => (
              <Card
                key={bracket.bracket}
                onClick={() => handleSummaryCardClick(bracket.bracket)}
                className={`cursor-pointer transition-all duration-300 border border-gray-100 hover:shadow-lg hover:scale-[1.02] group ${
                  bracket.isSelected
                    ? "ring-2 ring-blue-500 shadow-lg bg-blue-50"
                    : "hover:shadow-md bg-white"
                }`}
              >
                <CardHeader className="pb-2 pt-4 text-center">
                  <CardDescription className="flex items-center justify-center group-hover:text-blue-600 transition-colors duration-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full mr-2 transition-all duration-300 group-hover:scale-125"
                      style={{ backgroundColor: bracket.dotColor }}
                    ></span>
                    {bracket.bracket}
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-2xl group-hover:text-blue-600 transition-colors duration-300">
                    {bracket.displayValue}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-center">
                  <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                    {bracket.displayPercentage.toFixed(1)}% of{" "}
                    {!isAumView ? "total clients" : "total AUM"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Clients{" "}
              {selectedAgeBracketForTable
                ? `(${selectedAgeBracketForTable})`
                : "(All)"}
            </h3>
            <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      onClick={() => requestSort('firstName')} 
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Name {getSortDirectionIcon('firstName')}
                    </TableHead>
                    <TableHead 
                      onClick={() => requestSort('age')} 
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Age {getSortDirectionIcon('age')}
                    </TableHead>
                    <TableHead 
                      onClick={() => requestSort('segment')} 
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Segment {getSortDirectionIcon('segment')}
                    </TableHead>
                    <TableHead 
                      onClick={() => requestSort('inceptionDate')} 
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Inception Date {getSortDirectionIcon('inceptionDate')}
                    </TableHead>
                    {isAumView && (
                      <TableHead 
                        onClick={() => requestSort('aumDisplay')} 
                        className="cursor-pointer hover:bg-muted/80 text-right"
                      >
                        AUM {getSortDirectionIcon('aumDisplay')}
                      </TableHead>
                    )}
                    <TableHead className="font-semibold text-gray-700 py-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.tableData.length > 0 ? (
                    displayData.tableData.map((client) => {
                      // Enhanced segment styling with proper colors and text contrast
                      const getSegmentStyle = (segment: string) => {
                        switch (segment?.toLowerCase()) {
                          case "platinum":
                            return {
                              backgroundColor: "#eff6ff", // blue-50
                              color: "#1e40af", // blue-800
                              borderColor: "#bfdbfe", // blue-200
                            };
                          case "gold":
                            return {
                              backgroundColor: "#fefce8", // yellow-50
                              color: "#a16207", // yellow-800
                              borderColor: "#fde68a", // yellow-200
                            };
                          case "silver":
                            return {
                              backgroundColor: "#f9fafb", // gray-50
                              color: "#1f2937", // gray-800
                              borderColor: "#e5e7eb", // gray-200
                            };
                          default:
                            return {
                              backgroundColor: "#f9fafb", // gray-50
                              color: "#1f2937", // gray-800
                              borderColor: "#e5e7eb", // gray-200
                            };
                        }
                      };

                      const segmentStyle = getSegmentStyle(client.segment);

                      return (
                        <TableRow
                          key={client.id}
                          className="hover:bg-blue-50 border-b border-gray-100 transition-all duration-200 hover:shadow-sm group cursor-pointer"
                        >
                          <TableCell className="font-medium text-gray-900 py-4 group-hover:text-blue-700 transition-colors duration-200">
                            {getPrettyClientName(client)}
                          </TableCell>
                          <TableCell className="py-4 text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                            {client.age}
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className="px-3 py-1 text-xs rounded-full font-medium transition-all duration-200 group-hover:scale-105 group-hover:shadow-md border"
                              style={{
                                backgroundColor: segmentStyle.backgroundColor,
                                color: segmentStyle.color,
                                borderColor: segmentStyle.borderColor,
                              }}
                            >
                              {client.segment || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                            {formatDate(client.inceptionDate)}
                          </TableCell>
                          {isAumView && (
                            <TableCell className="text-right font-semibold text-gray-900 py-4 group-hover:text-blue-700 transition-colors duration-200">
                              {client.aumDisplay}
                            </TableCell>
                          )}
                          <TableCell className="text-right py-4">
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-md opacity-70 group-hover:opacity-100"
                            >
                              View Contact
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={isAumView ? 6 : 5}
                        className="text-center text-gray-500 py-12"
                      >
                        No clients match the current filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
