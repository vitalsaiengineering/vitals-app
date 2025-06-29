import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, UserPlus, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StandardClient } from '@/types/client';
import { getClients } from '@/lib/clientData';
import { useReportFilters } from '@/contexts/ReportFiltersContext';
import { filtersToApiParams } from '@/utils/filter-utils';
import { ReportSkeleton } from '@/components/ui/skeleton';
import { getAdvisorReportTitle } from '@/lib/utils';

interface ReferralData {
  month: string;
  referralRate: number;
  referredClients: number;
  totalNewClients: number;
  shortMonth: string;
}

interface ClientReferralRateData {
  kpi: {
    currentRate: number;
    rateChange: number;
    newClientsThisMonth: number;
    referredClientsThisMonth: number;
  };
  chartData: ReferralData[];
}

// Data transformation functions
const generateReferralReportFromClients = (clients: StandardClient[]): ClientReferralRateData => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Generate last 12 months of data
  const chartData: ReferralData[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    
    // Get clients for this month (based on inception date)
    const monthlyClients = clients.filter(client => {
      if (!client.inceptionDate) return false;
      const inceptionDate = new Date(client.inceptionDate);
      return inceptionDate.getMonth() === month && inceptionDate.getFullYear() === year;
          });

      const totalNewClients = monthlyClients.length;
      const referredClients = monthlyClients.filter(client => 
        Boolean(client.referredBy)
      ).length;
      const referralRate = totalNewClients > 0 ? Math.round((referredClients / totalNewClients) * 100) : 0;
      
      chartData.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      shortMonth: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      referralRate,
      referredClients,
      totalNewClients
    });
  }
  
  // Calculate current month KPIs
  const currentMonthData = chartData[chartData.length - 1];
  const previousMonthData = chartData[chartData.length - 2];
  
  const currentRate = currentMonthData.referralRate;
  const previousRate = previousMonthData ? previousMonthData.referralRate : 0;
  const rateChange = previousRate > 0 ? currentRate - previousRate : 0;
  
  return {
    kpi: {
      currentRate,
      rateChange,
      newClientsThisMonth: currentMonthData.totalNewClients,
      referredClientsThisMonth: currentMonthData.referredClients
    },
    chartData
  };
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{data.month}</p>
        <div className="space-y-1">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Referral Rate:</span> {data.referralRate}%
          </p>
          <p className="text-sm text-blue-600">
            <span className="font-medium">Referred New Clients:</span> {data.referredClients}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Total New Clients:</span> {data.totalNewClients}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const ClientReferralRate: React.FC = () => {
  const { filters, filterOptions } = useReportFilters();
  const [data, setData] = useState<ClientReferralRateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiParams = filtersToApiParams(filters);
        const clients = await getClients(apiParams);
        const transformedData = generateReferralReportFromClients(clients);
        
        setData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching referral rate data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12">No data available</div>;
  }

  const { kpi, chartData } = data;
  
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}% from last month`;
  };

  // Dynamic insights based on actual data
  const keyInsights = [
    {
      title: kpi.rateChange >= 0 ? "Strong Referral Performance" : "Referral Rate Opportunity",
      description: `Your referral rate has ${kpi.rateChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(kpi.rateChange).toFixed(1)} percentage points over the past month, with ${kpi.currentRate}% of new clients now coming through referrals.`,
      color: kpi.rateChange >= 0 ? "border-l-green-500" : "border-l-amber-500",
      bgColor: kpi.rateChange >= 0 ? "bg-green-50" : "bg-amber-50"
    },
    {
      title: kpi.rateChange >= 0 ? "Positive Growth Trajectory" : "Focus on Client Satisfaction", 
      description: kpi.rateChange >= 0 
        ? "The trend shows consistent growth in referral effectiveness, indicating strong client satisfaction and advocacy."
        : "Consider reviewing client satisfaction initiatives to improve referral rates and client advocacy.",
      color: "border-l-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: kpi.currentRate >= 30 ? "Market Leadership" : "Industry Benchmark",
      description: kpi.currentRate >= 30 
        ? `At ${kpi.currentRate}%, your referral rate significantly exceeds industry averages. This indicates exceptional client trust and service quality.`
        : `At ${kpi.currentRate}%, there's opportunity to grow toward industry leaders who typically see 30%+ referral rates through enhanced client experience.`,
      color: kpi.currentRate >= 30 ? "border-l-purple-500" : "border-l-orange-500",
      bgColor: kpi.currentRate >= 30 ? "bg-purple-50" : "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {getAdvisorReportTitle("New Client Referral Performance", filters, filterOptions || undefined)}
        </h2>
        <p className="text-gray-600">
          Track the percentage of new clients that come through referrals from existing clients each month.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Referral Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Referral Rate
            </CardTitle>
            {kpi.rateChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatPercentage(kpi.currentRate)}
            </div>
            <p className={`text-sm mt-1 ${kpi.rateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(kpi.rateChange)}
            </p>
          </CardContent>
        </Card>

        {/* New Clients This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Clients This Month
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {kpi.newClientsThisMonth}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Total onboarded
            </p>
          </CardContent>
        </Card>

        {/* Referred New Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Referred New Clients
            </CardTitle>
            <UserPlus className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {kpi.referredClientsThisMonth}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            New Client Referral Rate Trend
          </CardTitle>
          <p className="text-sm text-gray-500">
            Monthly referral rate calculated as (Referred New Clients ÷ Total New Clients Onboarded) × 100
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <defs>
                  <linearGradient id="colorReferralRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="shortMonth" 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="referralRate"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorReferralRate)"
                />
                <Line
                  type="monotone"
                  dataKey="referralRate"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            {kpi.rateChange >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-amber-600" />
            )}
            <CardTitle className="text-lg font-semibold text-gray-900">
              Key Insights
            </CardTitle>
          </div>
          <p className="text-sm text-gray-500">
            Analysis of your new client referral performance trends
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keyInsights.map((insight, index) => (
              <div
                key={index}
                className={`border-l-4 ${insight.color} ${insight.bgColor} p-4 rounded-r-lg`}
              >
                <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                <p className="text-sm text-gray-700">{insight.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientReferralRate;