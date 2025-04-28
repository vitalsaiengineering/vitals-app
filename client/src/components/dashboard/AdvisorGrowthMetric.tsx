import React, { useState, useMemo } from 'react';

// --- Data Imports ---
import {
  HouseholdNetNew,
  NnaOverviewMetrics,
  NnaChartDataPoint,
  MonthlyHouseholdSummary,
  getMockHouseholdNetNew,
  getMockNnaOverviewMetrics,
  getMockNnaChartData,
  getHouseholdTrendCounts,
  getMockMonthlyHouseholdSummary
} from '@/lib/clientData'; // Adjust path if needed

// --- UI Imports ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// --- Icon Imports ---
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, CheckIcon } from 'lucide-react';

// --- Charting Library Import ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';


// --- Helper Functions ---
const formatCurrency = (value: number, showSign = false): string => {
  const sign = value > 0 && showSign ? '+' : '';
  const formatted = Math.abs(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
   if (!showSign && value < 0) {
       return `-${formatted}`;
   }
   if (showSign && value < 0) {
       return `(${formatted.replace('$', '')})`;
   }
  return sign + formatted;
};

const formatNumberChange = (value: number): string => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    if (value === 0) return formatCurrency(0);
    return value < 0 ? `(${formatted})` : `+${formatted}`;
};


const getTextColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
};

const getStatusBadgeVariant = (status: 'Increasing' | 'Decreasing'): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (status) {
      case 'Decreasing': return 'destructive';
      // Use 'default' as base, color override happens in className
      case 'Increasing': return 'default';
      default: return 'secondary';
    }
};


// --- Sub-Component: HouseholdNetNewTable ---
interface HouseholdNetNewTableProps {
  households: HouseholdNetNew[];
}

const HouseholdNetNewTable: React.FC<HouseholdNetNewTableProps> = ({ households }) => {
  return (
    <div className="rounded-lg border shadow-sm bg-card text-card-foreground">
       <div className="p-6">
         <h3 className="text-lg font-semibold leading-none tracking-tight">Household Net New</h3>
       </div>
       <div className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Client Name</TableHead>
              <TableHead className="text-left">Segmentation</TableHead>
              <TableHead className="text-right">Starting AUM</TableHead>
              <TableHead className="text-right">Distributions</TableHead>
              <TableHead className="text-right">Contributions</TableHead>
              <TableHead className="text-right">Transfers</TableHead>
              <TableHead className="text-right">Net Change</TableHead>
              <TableHead className="text-right">Ending AUM</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {households.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No matching households found.
                </TableCell>
              </TableRow>
            ) : (
              households.map((household) => (
                <TableRow key={household.id}>
                  <TableCell className="font-medium text-left">{household.clientName}</TableCell>
                  <TableCell className="text-left">
                    <Badge variant={household.segmentation === 'Platinum' ? 'secondary' : 'outline'} className={cn(household.segmentation === 'Platinum' && 'bg-gray-800 text-white')}>
                        {household.segmentation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(household.startingAUM)}</TableCell>
                  <TableCell className={cn("text-right", getTextColor(household.distributions))}>
                    {formatNumberChange(household.distributions)}
                  </TableCell>
                  <TableCell className={cn("text-right", getTextColor(household.contributions))}>
                    {formatNumberChange(household.contributions)}
                  </TableCell>
                  <TableCell className={cn("text-right", getTextColor(household.transfers))}>
                    {formatNumberChange(household.transfers)}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", getTextColor(household.netChange))}>
                    {formatNumberChange(household.netChange)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(household.endingAUM)}</TableCell>
                  <TableCell className="text-center">
                    {/* Apply specific green background and white text for 'Increasing' status */}
                    <Badge
                      variant={getStatusBadgeVariant(household.status)}
                      className={cn(
                        household.status === 'Increasing' && 'bg-green-600 text-white border-transparent hover:bg-green-700', // Updated classes
                        // Destructive variant handles red automatically
                      )}
                    >
                      {household.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


// --- Sub-Component: NnaOverview ---
const NnaOverview: React.FC = () => {
  const metrics: NnaOverviewMetrics = getMockNnaOverviewMetrics();
  const chartData: NnaChartDataPoint[] = getMockNnaChartData();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const monthlySummary: MonthlyHouseholdSummary | null = useMemo(() => {
      if (!selectedMonth) return null;
      return getMockMonthlyHouseholdSummary(selectedMonth);
  }, [selectedMonth]);

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return <MinusIcon className="h-4 w-4 text-gray-500" />;
  };

   const distinctBarColors = [
    "#87CEEB", "#87CEEB", "#87CEEB",
    "#4682B4",
    "#6495ED",
    "#ADD8E6",
    "#B0E0E6",
    "#87CEFA",
    "#1E90FF",
    "#4169E1",
    "#6A5ACD",
    "#708090"
  ];

  const handleChartClick = (data: any) => {
      if (data && data.activePayload && data.activePayload.length > 0) {
          const clickedMonth = data.activePayload[0].payload.month;
          setSelectedMonth(clickedMonth);
      }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Starting AUM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.startingAUM)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributions</CardTitle>
            {getTrendIcon(metrics.distributions)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.distributions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributions</CardTitle>
             {getTrendIcon(metrics.contributions)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.contributions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Transfers</CardTitle>
             {getTrendIcon(metrics.netTransfers)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.netTransfers)}</div>
          </CardContent>
        </Card>
      </div>


      {/* Net New Assets Chart */}
      <Card>
         <CardHeader>
          <div className="flex justify-between items-center">
             <CardTitle>Net New Assets</CardTitle>
             <div className="text-sm text-muted-foreground">2025</div>
          </div>
           <p className="text-2xl font-bold pt-2">{formatCurrency(metrics.totalNetNewAssets)}</p>
           <p className="text-xs text-muted-foreground">
             Net New Assets over last 12 months: Starting AUM + Contributions - Distributions + Net Transfers
           </p>
        </CardHeader>
        <CardContent className="h-[350px] p-2">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                labelStyle={{ fontWeight: 'bold' }}
                formatter={(value: number) => [formatCurrency(value), 'Net New Assets']}
                labelFormatter={(label) => label}
                 />
              <Bar dataKey="netNewAssets" radius={[4, 4, 0, 0]}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={distinctBarColors[index % distinctBarColors.length]} cursor="pointer" />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Household Summary Table */}
      {selectedMonth && monthlySummary && (
        <div className="rounded-lg border shadow-sm bg-card text-card-foreground p-4">
            <h3 className="text-md font-semibold mb-3">{monthlySummary.month} Household Summary</h3>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted-foreground font-medium">
                        <th className="pb-2 font-medium">Starting AUM</th>
                        <th className="pb-2 font-medium">Contributions</th>
                        <th className="pb-2 font-medium">Distributions</th>
                        <th className="pb-2 font-medium">Net Transfers</th>
                        <th className="pb-2 font-medium">Ending AUM</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-1">{formatCurrency(monthlySummary.startingAUM)}</td>
                        <td className={cn("py-1", getTextColor(monthlySummary.contributions))}>
                            {formatCurrency(monthlySummary.contributions, true)}
                        </td>
                        <td className={cn("py-1", getTextColor(monthlySummary.distributions))}>
                            {formatCurrency(monthlySummary.distributions, true)}
                        </td>
                        <td className={cn("py-1", getTextColor(monthlySummary.netTransfers))}>
                            {formatCurrency(monthlySummary.netTransfers, true)}
                        </td>
                        <td className="py-1 font-medium">{formatCurrency(monthlySummary.endingAUM)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
      )}
      {!selectedMonth && (
          <div className="text-center text-muted-foreground p-4">
              Click a bar on the chart to view the monthly household summary.
          </div>
      )}
    </div>
  );
};


// --- Sub-Component: NnaHouseholdDetails ---
type FilterType = 'all' | 'increasing' | 'decreasing' | 'stable';

const NnaHouseholdDetails: React.FC = () => {
  const allHouseholds: HouseholdNetNew[] = getMockHouseholdNetNew();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const trendCounts = useMemo(() => getHouseholdTrendCounts(allHouseholds), [allHouseholds]);

  const filteredHouseholds = useMemo(() => {
      let filtered = allHouseholds;

      if (activeFilter === 'increasing') {
      filtered = filtered.filter(h => h.status === 'Increasing');
      } else if (activeFilter === 'decreasing') {
      filtered = filtered.filter(h => h.status === 'Decreasing');
      } // Add 'stable' logic if needed

      if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
          h.clientName.toLowerCase().includes(lowerSearchTerm)
      );
      }
      return filtered;
  }, [allHouseholds, searchTerm, activeFilter]);

  return (
      <div className="space-y-6">
      {/* Household Investment Trends Filters */}
      <div>
          <h3 className="text-lg font-semibold mb-3">Household Investment Trends</h3>
          <div className="flex flex-wrap gap-4 mb-4">
          <Button
              variant={activeFilter === 'increasing' ? 'secondary' : 'outline'}
              onClick={() => setActiveFilter('increasing')}
              className="flex-1 justify-start text-left h-auto p-3 min-w-[180px]"
          >
              <ArrowUpIcon className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
              <div>
                  <div className="text-sm">Increasing Households</div>
                  <div className="text-xl font-bold">{trendCounts.increasing}</div>
              </div>
          </Button>
          <Button
              variant={activeFilter === 'decreasing' ? 'secondary' : 'outline'}
              onClick={() => setActiveFilter('decreasing')}
              className="flex-1 justify-start text-left h-auto p-3 min-w-[180px]"
          >
              <ArrowDownIcon className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
              <div>
                  <div className="text-sm">Decreasing Households</div>
                  <div className="text-xl font-bold">{trendCounts.decreasing}</div>
              </div>
          </Button>
          <Button
              variant={activeFilter === 'stable' ? 'secondary' : 'outline'}
              onClick={() => setActiveFilter('stable')}
              className="flex-1 justify-start text-left h-auto p-3 min-w-[180px]"
              disabled
          >
              <MinusIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
              <div>
                  <div className="text-sm">Stable Households</div>
                  <div className="text-xl font-bold">{trendCounts.stable}</div>
              </div>
          </Button>
          <Button
              onClick={() => setActiveFilter('all')}
              className={cn(
                  "flex-1 justify-start text-left h-auto p-3 min-w-[180px] text-white",
                  activeFilter === 'all'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700 opacity-80'
              )}
          >
              <CheckIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <div>
                  <div className="text-sm">All</div>
                  <div className="text-xl font-bold">{trendCounts.all}</div>
              </div>
          </Button>
          </div>
          {/* Summary Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-6 rounded-lg bg-green-100 border border-green-200 text-green-800">
                  <div className="text-2xl font-bold">{trendCounts.increasing}</div>
                  <div>Households adding investments</div>
              </div>
              <div className="p-6 rounded-lg bg-red-100 border border-red-200 text-red-800">
                  <div className="text-2xl font-bold">{trendCounts.decreasing}</div>
                  <div>Households reducing investments</div>
              </div>
          </div>

          {/* Search Input */}
          <Input
          type="search"
          placeholder="Search households..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          />
      </div>

      {/* Household Net New Table */}
      <HouseholdNetNewTable households={filteredHouseholds} />

      </div>
  );
};


// --- Main Component: NetNewAssetsReport ---
const NetNewAssetsReport: React.FC = () => {
  const advisorName = "Alex Morgan";
  const reportDate = "April 2025";

  return (
      <div className="container mx-auto p-4 md:p-6 space-y-4">
          {/* Header */}
          <div>
              <h1 className="text-2xl font-bold tracking-tight">Net New Assets Report</h1>
              <p className="text-muted-foreground">Financial summary for {advisorName} - {reportDate}</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="household-details">Household Details</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                  <NnaOverview />
              </TabsContent>
              <TabsContent value="household-details" className="mt-4">
                  <NnaHouseholdDetails />
              </TabsContent>
          </Tabs>
      </div>
  );
};

export default NetNewAssetsReport;