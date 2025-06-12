import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Users, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  getReferralAnalyticsData,
  type ReferralAnalyticsData,
  type ReferralSource,
  type ReferralClient,
  type GetReferralAnalyticsParams
} from '@/lib/clientData';

// Colors for the pie chart
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

// Update the grade badge styling function
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, string> = {
    Platinum: 'bg-violet-100 text-violet-800',
    Gold: 'bg-amber-100 text-amber-800', 
    Silver: 'bg-gray-100 text-gray-800',
  };
  return GRADE_COLORS[grade] || 'bg-gray-100 text-gray-800';
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface ReferralAnalyticsReportProps {
  globalSearch?: string;
}

export default function ReferralAnalyticsReport({ globalSearch = '' }: ReferralAnalyticsReportProps) {
  const [analyticsData, setAnalyticsData] = useState<ReferralAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sources');
  const [selectedReferrer, setSelectedReferrer] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferralSource, setSelectedReferralSource] = useState<ReferralSource | null>(null);
  const [viewMode, setViewMode] = useState<'numbers' | 'keynote'>('numbers');

  const fetchAnalyticsData = async (params?: GetReferralAnalyticsParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReferralAnalyticsData(params);
      setAnalyticsData(data);
      // Don't set a default selected source - let user click to select
      if (!selectedReferralSource && data.referralSources.length > 0) {
        setSelectedReferralSource(null); // Start with no selection
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load referral analytics data';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(); // Initial fetch
  }, []);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetReferralAnalyticsParams = {};
    const search = globalSearch || searchQuery;
    if (search.trim()) params.search = search.trim();
    if (selectedReferrer !== 'all') params.referrer = selectedReferrer;
    
    const timer = setTimeout(() => {
      fetchAnalyticsData(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearch, searchQuery, selectedReferrer]);

  const handlePieClick = (data: any) => {
    const source = analyticsData?.referralSources.find(s => s.name === data.name);
    if (source) {
      setSelectedReferralSource(source);
    }
  };

  // Custom tooltip for pie chart
  const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: any[];
    totalReferrals: number;
  }> = ({ active, payload, totalReferrals }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the data object passed to the Pie segment
      const source = analyticsData?.referralSources.find(s => s.name === data.name);
      const percentage = totalReferrals > 0 ? ((data.value / totalReferrals) * 100).toFixed(0) : 0;
      
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200 text-sm">
          <p className="font-semibold text-gray-800">{data.name}</p>
          {source?.company && (
            <p className="text-xs text-gray-500">{source.company}</p>
          )}
          <p className="text-gray-600 mt-1">{data.value} referrals</p>
          <p className="text-gray-600">{percentage}% of total</p>
          {source && (
            <p className="text-green-600 font-medium">
              Total AUM: {formatCurrency(source.totalAUM)}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  const chartData = analyticsData?.referralSources.map(source => ({
    name: source.name,
    value: source.totalReferrals,
    percentage: source.percentage
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Referral Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your top referral sources and measure their performance.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="sources">Top Referral Sources</TabsTrigger>
          <TabsTrigger value="all">All Referrals</TabsTrigger>
        </TabsList>

        {/* Top Referral Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Chart */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider text-blue-600 font-semibold">
                    Top Referral Sources
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-6">
                  {/* Donut Chart */}
                  <div className="relative">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            onClick={handlePieClick}
                            className="cursor-pointer"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                className="cursor-pointer focus:outline-none"
                                stroke="#fff"
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={<CustomTooltip totalReferrals={analyticsData?.totalReferrals || 0} />}
                            cursor={{ fill: "transparent" }}
                            wrapperStyle={{ zIndex: 10 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Total Referred</div>
                      <div className="text-4xl font-bold text-gray-900">{analyticsData?.totalReferrals || 0}</div>
                      {selectedReferralSource && (
                        <div className="text-xs text-blue-600 text-center mt-1">
                          By {selectedReferralSource.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-3">
                    {analyticsData?.referralSources.slice(0, 10).map((source, index) => (
                      <button
                        key={source.id}
                        onClick={() => setSelectedReferralSource(source)}
                        className={`flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                          selectedReferralSource?.id === source.id ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{source.name}</div>
                          <div className="text-sm text-gray-600">
                            {source.totalReferrals} ({source.percentage}%)
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Selected Referrer Details or All Clients */}
            <Card className="flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm uppercase tracking-wider text-blue-600 font-semibold">
                  {selectedReferralSource ? 
                    `Clients Referred by ${selectedReferralSource.name}` : 
                    'All Referred Clients'
                  }
                </CardTitle>
                {selectedReferralSource && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{selectedReferralSource.totalReferrals} clients</span>
                    </div>
                    <div className="text-green-600 font-semibold">
                      Total AUM: {formatCurrency(selectedReferralSource.totalAUM)}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                {isLoading && <div className="p-4 text-center text-muted-foreground">Loading...</div>}
                {!isLoading && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Table Headers */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-3">
                      <div className="col-span-4">Name</div>
                      <div className="col-span-3">Segment</div>
                      <div className="col-span-5 text-right">AUM</div>
                    </div>
                    
                    {/* Client List - with flex-1 to fill remaining space */}
                    <div className="space-y-0 flex-1 overflow-y-auto">
                      {selectedReferralSource ? (
                        // Show clients for selected referral source
                        selectedReferralSource.clients.slice(0, 10).map((client, index) => (
                          <div key={client.id} className="grid grid-cols-12 gap-4 items-center py-3 px-0">
                            <div className="col-span-4">
                              <div className="font-medium text-sm text-gray-900">{client.clientName}</div>
                            </div>
                            <div className="col-span-3">
                              <Badge 
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeBadgeClasses(client.segment)}`}
                              >
                                {client.segment}
                              </Badge>
                            </div>
                            <div className="col-span-5 text-right">
                              <div className="font-semibold text-green-600 text-sm">
                                {formatCurrency(client.aum)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Show all clients when no specific source is selected
                        analyticsData?.allReferrals.slice(0, 15).map((client, index) => (
                          <div key={client.id} className="grid grid-cols-12 gap-4 items-center py-3 px-0">
                            <div className="col-span-4">
                              <div className="font-medium text-sm text-gray-900">{client.clientName}</div>
                            </div>
                            <div className="col-span-3">
                              <Badge 
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeBadgeClasses(client.segment)}`}
                              >
                                {client.segment}
                              </Badge>
                            </div>
                            <div className="col-span-5 text-right">
                              <div className="font-semibold text-green-600 text-sm">
                                {formatCurrency(client.aum)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Referrals Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedReferrer} onValueChange={setSelectedReferrer}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select referrer" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyticsData?.filterOptions.referrers.map(referrer => (
                      <SelectItem key={referrer.id} value={referrer.id}>
                        {referrer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {isLoading && <div className="p-4 text-center text-muted-foreground">Loading referrals data...</div>}
              {!isLoading && analyticsData && analyticsData.allReferrals.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                  No referrals match the current filters.
                </div>
              )}
              {!isLoading && analyticsData && analyticsData.allReferrals.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-medium text-gray-700">Client Name</TableHead>
                        <TableHead className="font-medium text-gray-700">Segment</TableHead>
                        <TableHead className="font-medium text-gray-700">Referred By</TableHead>
                        <TableHead className="font-medium text-gray-700">Primary Advisor</TableHead>
                        <TableHead className="text-right font-medium text-gray-700">AUM</TableHead>
                        <TableHead className="font-medium text-gray-700">
                          Client Inception Date <span className="ml-1 text-gray-400">↓</span>
                        </TableHead>
                        <TableHead className="text-right font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.allReferrals.map((referral) => (
                        <TableRow key={referral.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">{referral.clientName}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getGradeBadgeClasses(referral.segment)}`}
                            >
                              {referral.segment}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{referral.referredBy}</TableCell>
                          <TableCell className="text-gray-700">{referral.primaryAdvisor || 'N/A'}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(referral.aum)}
                          </TableCell>
                          <TableCell className="text-gray-700">{formatDate(referral.referralDate)}</TableCell>
                          <TableCell className="text-right">
                          <Button variant="default" size="sm">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}