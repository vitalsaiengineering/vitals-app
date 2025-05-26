import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getOrionAumChartData } from '@/lib/api';
import { Loader2 } from 'lucide-react';

// Interface for chart data
interface ChartDataPoint {
  period: string;
  date: string;
  aum: number;
  dataPoints: number;
  periodStart: string;
  periodEnd: string;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

export const AumChart = () => {
  const [aggregation, setAggregation] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Fetch Orion AUM data
  const { 
    data: aumResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['orion-aum-chart-data', aggregation],
    queryFn: () => getOrionAumChartData({ aggregation }),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Define a unified tickFormatter function that always returns a string
  const tickFormatter = (value: number) => {
    return formatCurrency(value);
  };

  // Mock data for when no real data is available
  const mockData = [
    { period: '2023-01', aum: 1250000, date: '2023-01-01', dataPoints: 1 },
    { period: '2023-02', aum: 1275000, date: '2023-02-01', dataPoints: 1 },
    { period: '2023-03', aum: 1290000, date: '2023-03-01', dataPoints: 1 },
    { period: '2023-04', aum: 1310000, date: '2023-04-01', dataPoints: 1 },
    { period: '2023-05', aum: 1285000, date: '2023-05-01', dataPoints: 1 },
    { period: '2023-06', aum: 1320000, date: '2023-06-01', dataPoints: 1 },
    { period: '2023-07', aum: 1345000, date: '2023-07-01', dataPoints: 1 },
    { period: '2023-08', aum: 1330000, date: '2023-08-01', dataPoints: 1 },
    { period: '2023-09', aum: 1365000, date: '2023-09-01', dataPoints: 1 },
    { period: '2023-10', aum: 1380000, date: '2023-10-01', dataPoints: 1 },
    { period: '2023-11', aum: 1395000, date: '2023-11-01', dataPoints: 1 },
    { period: '2023-12', aum: 1420000, date: '2023-12-01', dataPoints: 1 },
  ];

  // Transform data for the chart
  const realData = aumResponse?.data?.map((item: ChartDataPoint) => ({
    period: item.period,
    aum: item.aum,
    date: item.date,
    dataPoints: item.dataPoints,
  })) || [];

  // Use real data if available, otherwise use mock data
  const chartData = realData.length > 0 ? realData : mockData;
  const isUsingMockData = realData.length === 0 && !isLoading && !error;

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Average AUM Over Time</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Loading portfolio data from Orion...
          </p>
        </div>
        
        <div className="h-[300px] flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading AUM data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Average AUM Over Time</h2>
            <button 
              onClick={() => refetch()}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
          <p className="text-sm text-red-500 mt-1">
            Failed to load AUM data. Please check your Orion connection.
          </p>
        </div>
        
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Unable to load portfolio data</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }



  return (
          <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Average AUM Over Time</h2>
            <div className="flex items-center space-x-2">
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <a href="#" className="text-sm text-blue-600 hover:underline">View Full Report</a>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-500">
            {isUsingMockData 
              ? "Showing sample data - Connect to Orion and sync your data to see real AUM trends"
              : "Hover over data points to see detailed values"
            }
          </p>
          {aumResponse?.summary && !isUsingMockData && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Latest: </span>
              {formatCurrency(aumResponse.summary.latestAum)}
              {aumResponse.summary.growth !== 0 && (
                <span className={`ml-2 ${aumResponse.summary.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({aumResponse.summary.growth > 0 ? '+' : ''}{aumResponse.summary.growth}%)
                </span>
              )}
            </div>
          )}
          {isUsingMockData && (
            <div className="text-sm text-orange-600">
              <span className="font-medium">Sample Data</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`h-[300px] ${isUsingMockData ? 'relative' : ''}`}>
        {isUsingMockData && (
          <div className="absolute top-2 right-2 z-10 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
            Sample Data
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient id="colorAum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUsingMockData ? "#F97316" : "#0D47A1"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={isUsingMockData ? "#F97316" : "#0D47A1"} stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="period" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis 
              tickFormatter={tickFormatter}
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Average AUM']}
              labelFormatter={(label) => `Period: ${label}`}
              labelStyle={{ color: '#555' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />

            <Area 
              type="monotone" 
              dataKey="aum" 
              stroke={isUsingMockData ? "#F97316" : "#0D47A1"} 
              fillOpacity={1}
              fill="url(#colorAum)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};