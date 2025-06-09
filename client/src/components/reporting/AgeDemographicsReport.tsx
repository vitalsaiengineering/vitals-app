import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";

// Import the new data fetching function and the interface
import { getAgeDemographicsReportData, AgeDemographicsData } from '@/lib/clientData';

// Import mock data
import mockData from '@/data/mockData.js';

// ... (Existing interfaces like AgeDemographicsData might be slightly different from the one in clientData.ts, ensure consistency or use the imported one)
// For this example, I'll assume the AgeDemographicsData interface defined in this file is the one we want to use for structuring the fetched data.
// If clientData.ts exports a more accurate/complete one, prefer that.

// ... (SEGMENT_COLORS_HSL and chartConfig remain the same) ...
const SEGMENT_COLORS_HSL: { [key: string]: string } = {
  SILVER: 'hsl(var(--chart-3))',
  GOLD: 'hsl(var(--chart-2))',
  PLATINUM: 'hsl(var(--chart-1))',
  DEFAULT: 'hsl(var(--chart-4))',
};

const chartConfig = {
  silver: { label: "Silver", color: SEGMENT_COLORS_HSL.SILVER },
  gold: { label: "Gold", color: SEGMENT_COLORS_HSL.GOLD },
  platinum: { label: "Platinum", color: SEGMENT_COLORS_HSL.PLATINUM },
  totalClients: { label: "Total Clients", color: SEGMENT_COLORS_HSL.DEFAULT },
  totalAum: { label: "Total AUM", color: SEGMENT_COLORS_HSL.DEFAULT },
} satisfies ChartConfig;


// Custom Tooltip Component - Updated to use reportData from state
const CustomChartTooltip = ({ active, payload, label, isAumViewInTooltip, reportData }: TooltipProps<ValueType, NameType> & { isAumViewInTooltip: boolean, reportData: AgeDemographicsData | null }) => {
  if (active && payload && payload.length && reportData) { // Check if reportData is available
    const originalBracketData = reportData.byAgeBracket.find(b => b.bracket === label);

    return (
      <div className="bg-background p-3 border border-border shadow-lg rounded-md text-xs min-w-[180px]">
        <p className="font-bold text-sm mb-2">{label}</p>
        {!isAumViewInTooltip && originalBracketData && (
          <p className="mb-1 text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{originalBracketData.clientCount} Clients ({originalBracketData.clientPercentage.toFixed(1)}%)</span>
          </p>
        )}
        {isAumViewInTooltip && originalBracketData && (
          <p className="mb-1 text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{originalBracketData.aum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({originalBracketData.aumPercentage.toFixed(1)}%)</span>
          </p>
        )}
        <div className="mt-1 space-y-0.5">
          {payload.map((entry) => {
            if (entry.dataKey && chartConfig[entry.dataKey as string]?.label && !entry.dataKey?.toString().toLowerCase().includes('total')) {
              return (
                <div key={entry.dataKey} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: entry.color || chartConfig[entry.dataKey as string]?.color }}
                    />
                    <span>{chartConfig[entry.dataKey as string]?.label}:</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {!isAumViewInTooltip
                      ? Number(entry.value).toLocaleString()
                      : Number(entry.value).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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


// Helper function to get dot color for age brackets
const getBracketDotColor = (bracket: string): string => {
  switch (bracket) {
    case "<20": return "hsl(var(--age-band-under-20))";
    case "21-40": return "hsl(var(--age-band-21-40))";
    case "41-60": return "hsl(var(--age-band-41-60))";
    case "61-80": return "hsl(var(--age-band-61-80))";
    case ">80": return "hsl(var(--age-band-over-80))";
    default: return "hsl(var(--age-band-default))";
  }
};

interface AgeDemographicsReportProps {
  reportId: string; // Assuming reportId might be used to fetch specific report, or advisorId if available
  // advisorId?: number; // Consider adding advisorId if needed for fetching
}

export default function AgeDemographicsReport({ reportId /*, advisorId */ }: AgeDemographicsReportProps) {
  const [isAumView, setIsAumView] = useState<boolean>(false);
  const [selectedAgeBracketForTable, setSelectedAgeBracketForTable] = useState<string | null>(null);

  // State for fetched data, loading, and error
  const [reportData, setReportData] = useState<AgeDemographicsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we should use mock data
  const useMock = process.env.REACT_APP_USE_MOCK_DATA !== 'false';

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (useMock) {
          // Use mock data
          const mockReportData = mockData.AgeDemographicsReport as AgeDemographicsData;
          setReportData(mockReportData);
        } else {
          // Try to fetch from API, fallback to mock data on error
          try {
            const data = await getAgeDemographicsReportData();
            setReportData(data);
          } catch (apiError) {
            console.warn('API fetch failed, falling back to mock data:', apiError);
            const mockReportData = mockData.AgeDemographicsReport as AgeDemographicsData;
            setReportData(mockReportData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [reportId, useMock]); // Re-fetch if reportId or useMock changes

  // Define the desired stacking order (bottom to top)
  const desiredSegmentOrder = ['platinum', 'gold', 'silver'];

  const chartDataForRecharts = useMemo(() => {
    if (!reportData) return []; // Return empty if no data
    return reportData.byAgeBracket.map(bracket => {
      const base = { name: bracket.bracket };
      if (!isAumView) { // Clients view
        const clientSegments: { [key: string]: number } = {};
        bracket.detailedBreakdown?.forEach(detail => {
          clientSegments[detail.segment.toLowerCase()] = detail.clients;
        });
        return { ...base, ...clientSegments, totalClients: bracket.clientCount };
      } else { // AUM view
        const aumSegments: { [key: string]: number } = {};
        bracket.detailedBreakdown?.forEach(detail => {
          aumSegments[detail.segment.toLowerCase()] = detail.aum;
        });
        return { ...base, ...aumSegments, totalAum: bracket.aum };
      }
    });
  }, [reportData, isAumView]);

  const displayData = useMemo(() => {
    if (!reportData) return null; // Return null if no data
    return {
      totalValue: !isAumView ? reportData.overall.totalClients : reportData.overall.totalAUM.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      totalLabel: !isAumView ? 'Total Clients' : 'Total AUM',
      averageClientAge: reportData.overall.averageClientAge,
      brackets: reportData.byAgeBracket.map(b => ({
        ...b,
        displayValue: !isAumView ? b.clientCount : b.aum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        displayPercentage: !isAumView ? b.clientPercentage : b.aumPercentage,
        valueLabel: !isAumView ? 'Clients' : 'AUM',
        isSelected: selectedAgeBracketForTable === b.bracket,
        dotColor: getBracketDotColor(b.bracket),
      })),
      tableData: reportData.clientDetails
        .filter(client => {
          if (!selectedAgeBracketForTable) return true;
          const age = client.age;
          switch (selectedAgeBracketForTable) {
            case "<20": return age < 20;
            case "21-40": return age >= 21 && age <= 40;
            case "41-60": return age >= 41 && age <= 60;
            case "61-80": return age >= 61 && age <= 80;
            case ">80": return age > 80;
            default: return true;
          }
        })
        .map(client => ({
          ...client,
          aumDisplay: client.aum ? client.aum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'N/A',
        })),
    };
  }, [isAumView, reportData, selectedAgeBracketForTable]);

  const segmentsInChart = useMemo(() => {
    if (!reportData) return [];
    const allSegments = new Set<string>();
    reportData.byAgeBracket.forEach(bracket => {
      bracket.detailedBreakdown?.forEach(detail => allSegments.add(detail.segment.toLowerCase()));
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
    setSelectedAgeBracketForTable(prev => prev === bracket ? null : bracket);
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedBracketName = data.activePayload[0].payload.name;
      if (clickedBracketName) {
        setSelectedAgeBracketForTable(prev => prev === clickedBracketName ? null : clickedBracketName);
      }
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading report data...</div>;
  }

  if (error || !displayData) { // Also check if displayData is null
    return <div className="p-6 text-center text-red-500">Error loading report: {error || "No data available"}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Client Age Demographics</CardTitle>
              <CardDescription>{displayData.totalLabel}: {displayData.totalValue}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="aum-toggle" className={!isAumView ? "text-primary font-semibold" : "text-muted-foreground"}>
                Clients
              </Label>
              <Switch
                id="aum-toggle"
                checked={isAumView}
                onCheckedChange={setIsAumView}
                aria-label="Toggle between AUM and Clients view"
              />
              <Label htmlFor="aum-toggle" className={isAumView ? "text-primary font-semibold" : "text-muted-foreground"}>
                AUM
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/4 space-y-1">
              <h3 className="text-base font-medium text-muted-foreground">Average Client Age</h3>
              <p className="text-4xl font-bold">{displayData.averageClientAge.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">years</p>
            </div>
            <div className="lg:w-3/4 h-[300px] lg:h-[350px] bg-muted/20 p-4 rounded-lg">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsBarChart
                  data={chartDataForRecharts}
                  margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                  onClick={handleBarClick}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => isAumView ? `$${(Number(value) / 1000).toLocaleString()}k` : value} />
                  <RechartsPrimitive.Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    content={<CustomChartTooltip isAumViewInTooltip={isAumView} reportData={reportData} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {segmentsInChart.map((segment, index) => (
                    <Bar
                      key={segment} dataKey={segment} stackId="a"
                      fill={`var(--color-${segment})`}
                      name={chartConfig[segment]?.label || segment}
                      radius={index === segmentsInChart.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                  {segmentsInChart.length === 0 && reportData && ( // Ensure reportData exists
                    <Bar dataKey={!isAumView ? 'totalClients' : 'totalAum'} fill={`var(--color-${!isAumView ? 'totalClients' : 'totalAum'})`} name={chartConfig[!isAumView ? 'totalClients' : 'totalAum']?.label as string} radius={[4, 4, 0, 0]} />
                  )}
                </RechartsBarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {displayData.brackets.map(bracket => (
              <Card
                key={bracket.bracket}
                onClick={() => handleSummaryCardClick(bracket.bracket)}
                className={`cursor-pointer transition-all ${bracket.isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
              >
                <CardHeader className="pb-2 pt-4 text-center">
                  <CardDescription className="flex items-center justify-center">
                    <span
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: bracket.dotColor }}
                    ></span>
                    {bracket.bracket}
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-2xl">{bracket.displayValue}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {bracket.displayPercentage.toFixed(1)}% of {!isAumView ? 'total clients' : 'total AUM'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              Clients {selectedAgeBracketForTable ? `(${selectedAgeBracketForTable})` : '(All)'}
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Join Date</TableHead>
                    {isAumView && <TableHead className="text-right">AUM</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.tableData.length > 0 ? displayData.tableData
                    .map(client => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.age}</TableCell>
                        <TableCell>
                          <span
                            className="px-2.5 py-1 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor: chartConfig[client.segment.toLowerCase()]?.color || SEGMENT_COLORS_HSL.DEFAULT,
                              color: 'hsl(var(--primary-foreground))',
                            }}
                          >
                            {client.segment}
                          </span>
                        </TableCell>
                        <TableCell>{client.joinDate}</TableCell>
                        {isAumView && <TableCell className="text-right">{client.aumDisplay}</TableCell>}
                        <TableCell className="text-right">
                          <Button variant="default" size="sm">
                            View Contact
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                    <TableRow>
                      <TableCell colSpan={isAumView ? 6 : 5} className="text-center text-muted-foreground py-10">
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