import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch"; // For the toggle switch
import { Label } from "@/components/ui/label";   // For switch label
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

import * as RechartsPrimitive from "recharts"; // For direct Tooltip usage

export interface AgeDemographicsData {
  overall: {
    totalClients: number;
    totalAUM: number;
    averageClientAge: number;
  };
  byAgeBracket: Array<{
    bracket: string; // e.g., "<20", "21-40"
    clientCount: number;
    clientPercentage: number;
    aum: number;
    aumPercentage: number;
    // For detailed chart tooltips (optional)
    detailedBreakdown?: Array<{ segment: string; clients: number; aum: number }>;
  }>;
  clientDetails: Array<{
    id: string;
    name: string;
    age: number;
    segment: string; // e.g., "Gold", "Platinum"
    joinDate: string; // YYYY-MM-DD
    aum?: number; // Optional, for AUM view
  }>;
}

export const ageDemographicsMockData: AgeDemographicsData = {
  overall: {
    totalClients: 35,
    totalAUM: 7405000,
    averageClientAge: 53.5,
  },
  byAgeBracket: [
    { bracket: "<20", clientCount: 1, clientPercentage: 2.8, aum: 50000, aumPercentage: 0.67, 
      detailedBreakdown: [{ segment: "Silver", clients: 1, aum: 50000}] },
    { bracket: "21-40", clientCount: 8, clientPercentage: 22.9, aum: 740000, aumPercentage: 10.0,
      detailedBreakdown: [
        { segment: "Silver", clients: 5, aum: 300000},
        { segment: "Gold", clients: 3, aum: 440000},
      ]
    },
    { bracket: "41-60", clientCount: 11, clientPercentage: 31.4, aum: 2105000, aumPercentage: 28.4,
      detailedBreakdown: [
        { segment: "Silver", clients: 2, aum: 200000},
        { segment: "Gold", clients: 6, aum: 1205000},
        { segment: "Platinum", clients: 3, aum: 700000},
      ]
    },
    { bracket: "61-80", clientCount: 10, clientPercentage: 28.6, aum: 3660000, aumPercentage: 49.4,
      detailedBreakdown: [
        { segment: "Gold", clients: 4, aum: 1000000},
        { segment: "Platinum", clients: 6, aum: 2660000},
      ]
    },
    { bracket: ">80", clientCount: 5, clientPercentage: 14.3, aum: 850000, aumPercentage: 11.5,
      detailedBreakdown: [
        { segment: "Gold", clients: 2, aum: 300000},
        { segment: "Platinum", clients: 3, aum: 550000},
      ]
    },
  ],
  clientDetails: [
    { id: 'c1', name: 'Harper Lee', age: 42, segment: 'Gold', joinDate: '2022-02-14', aum: 130000 },
    { id: 'c2', name: 'John Doe', age: 65, segment: 'Platinum', joinDate: '2018-07-21', aum: 750000 },
    { id: 'c3', name: 'Alice Smith', age: 33, segment: 'Silver', joinDate: '2023-01-10', aum: 80000 },
    { id: 'c4', name: 'Robert Brown', age: 58, segment: 'Gold', joinDate: '2019-05-05', aum: 220000 },
    { id: 'c5', name: 'Emily White', age: 72, segment: 'Platinum', joinDate: '2015-11-30', aum: 1200000 },
    // Add more clients, especially to match the 35 total
  ],
};

interface AgeDemographicsReportProps {
  reportId: string;
}

// type ActiveToggle = 'clients' | 'aum'; // Replaced by isAumView boolean

const SEGMENT_COLORS_HSL: { [key: string]: string } = {
  SILVER: 'hsl(var(--chart-1))',
  GOLD: 'hsl(var(--chart-2))',
  PLATINUM: 'hsl(var(--chart-3))',
  DEFAULT: 'hsl(var(--chart-4))',
};

const chartConfig = {
  silver: { label: "Silver", color: SEGMENT_COLORS_HSL.SILVER },
  gold: { label: "Gold", color: SEGMENT_COLORS_HSL.GOLD },
  platinum: { label: "Platinum", color: SEGMENT_COLORS_HSL.PLATINUM },
  totalClients: { label: "Total Clients", color: SEGMENT_COLORS_HSL.DEFAULT },
  totalAum: { label: "Total AUM", color: SEGMENT_COLORS_HSL.DEFAULT },
} satisfies ChartConfig;

// Custom Tooltip Component
const CustomChartTooltip = ({ active, payload, label, isAumViewInTooltip }: TooltipProps<ValueType, NameType> & { isAumViewInTooltip: boolean }) => {
  if (active && payload && payload.length) {
    const originalBracketData = ageDemographicsMockData.byAgeBracket.find(b => b.bracket === label);

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


export default function AgeDemographicsReport({ reportId }: AgeDemographicsReportProps) {
  const [isAumView, setIsAumView] = useState<boolean>(false); // true for AUM, false for Clients
  const [selectedAgeBracketForTable, setSelectedAgeBracketForTable] = useState<string | null>(null);
  
  const reportData: AgeDemographicsData = ageDemographicsMockData;
  const activeToggle = isAumView ? 'aum' : 'clients'; // Derived value

  const chartDataForRecharts = useMemo(() => {
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
  }, [reportData.byAgeBracket, isAumView]);

  const displayData = useMemo(() => {
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
    const allSegments = new Set<string>();
    reportData.byAgeBracket.forEach(bracket => {
      bracket.detailedBreakdown?.forEach(detail => allSegments.add(detail.segment.toLowerCase()));
    });
    return Array.from(allSegments);
  }, [reportData.byAgeBracket]);

  const handleSummaryCardClick = (bracket: string) => {
    setSelectedAgeBracketForTable(prev => prev === bracket ? null : bracket);
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedBracketName = data.activePayload[0].payload.name; // 'name' is the age bracket from chartData
      if (clickedBracketName) {
        setSelectedAgeBracketForTable(prev => prev === clickedBracketName ? null : clickedBracketName);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center"> {/* items-center for vertical alignment */}
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
                  onClick={handleBarClick} // Added click handler to the chart
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => isAumView ? `$${(Number(value)/1000).toLocaleString()}k` : value} />
                  <RechartsPrimitive.Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    content={<CustomChartTooltip isAumViewInTooltip={isAumView} />} // Pass current view to tooltip
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {segmentsInChart.map((segment, index) => (
                    <Bar 
                      key={segment} dataKey={segment} stackId="a" 
                      fill={`var(--color-${segment})`}
                      name={chartConfig[segment]?.label || segment}
                      radius={index === segmentsInChart.length -1 ? [4,4,0,0] : [0,0,0,0]}
                    />
                  ))}
                  {segmentsInChart.length === 0 && (
                      <Bar dataKey={!isAumView ? 'totalClients' : 'totalAum'} fill={`var(--color-${!isAumView ? 'totalClients' : 'totalAum'})`} name={chartConfig[!isAumView ? 'totalClients' : 'totalAum']?.label as string} radius={[4,4,0,0]} />
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
                  <CardDescription>{bracket.bracket}</CardDescription>
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
                          className="px-2 py-0.5 text-xs rounded-full" 
                          style={{ 
                            backgroundColor: `${chartConfig[client.segment.toLowerCase()]?.color || SEGMENT_COLORS_HSL.DEFAULT}33`, 
                            color: chartConfig[client.segment.toLowerCase()]?.color || SEGMENT_COLORS_HSL.DEFAULT,
                            border: `1px solid ${chartConfig[client.segment.toLowerCase()]?.color || SEGMENT_COLORS_HSL.DEFAULT}`
                          }}
                        >
                          {client.segment}
                        </span>
                      </TableCell>
                      <TableCell>{client.joinDate}</TableCell>
                      {isAumView && <TableCell className="text-right">{client.aumDisplay}</TableCell>}
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Contact</Button>
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