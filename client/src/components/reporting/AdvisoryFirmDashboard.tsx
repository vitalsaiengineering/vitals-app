import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  CheckSquare, 
  FileText, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  getAdvisoryFirmDashboardData, 
  type AdvisoryFirmDashboardData,
  type GetAdvisoryFirmDashboardParams 
} from '@/lib/clientData';

interface AdvisoryFirmDashboardProps {
  advisorId?: number;
  startDate?: string;
  endDate?: string;
  department?: string;
}

// Custom Tooltip Components
const LineChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{data.month}</p>
        <p className="text-sm text-blue-600">
          <span className="font-medium">Total Activities:</span> {data.totalActivities.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Change:</span> -235
        </p>
        <p className="text-xs text-gray-500 mt-1">Click to view details</p>
      </div>
    );
  }
  return null;
};

const WeeklyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-blue-600">Meetings: {data.meetings}</p>
          <p className="text-sm text-blue-600">Notes: {data.notes}</p>
          <p className="text-sm text-blue-600">Workflows: {data.workflows}</p>
        </div>
      </div>
    );
  }
  return null;
};

// Utility Functions
const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    case 'down':
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
};

const formatPercentageChange = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}% vs prior 30 days`;
};

// Main Component
export const AdvisoryFirmDashboard: React.FC<AdvisoryFirmDashboardProps> = ({
  advisorId,
  startDate,
  endDate,
  department,
}) => {
  const [data, setData] = useState<AdvisoryFirmDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStaff, setSelectedStaff] = useState<string | null>('jd');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params: GetAdvisoryFirmDashboardParams = {
          ...(advisorId && { advisorId }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(department && { department }),
        };
        
        const result = await getAdvisoryFirmDashboardData(params);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching advisory firm dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [advisorId, startDate, endDate, department]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
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

  const handleStaffClick = (staffId: string) => {
    setSelectedStaff(staffId);
    // Switch to staff tab to show the table if not already there
    if (activeTab !== 'staff') {
      setActiveTab('staff');
    }
  };

  const selectedStaffDetail = data.staffDetails.find(s => s.id === selectedStaff);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Advisory Firm Dashboard</h1>
        <p className="text-gray-600">Monitor staff activities and performance across all departments</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview">Firm Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Breakout</TabsTrigger>
        </TabsList>

        {/* Firm Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalActivities.toLocaleString()}</div>
                <p className="text-xs text-green-600">{formatPercentageChange(12.3)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client Meetings</CardTitle>
                <Calendar className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.clientMeetings}</div>
                <p className="text-xs text-red-600">{formatPercentageChange(-2.1)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CheckSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.tasksCompleted}</div>
                <p className="text-xs text-green-600">{formatPercentageChange(15.2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notes Created</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.notesCreated}</div>
                <p className="text-xs text-gray-500">(no change)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.messagesSent}</div>
                <p className="text-xs text-green-600">{formatPercentageChange(22.4)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section for Firm Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Activities Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Monthly Total Activities</CardTitle>
                <p className="text-sm text-gray-500">Jan 2024 - Dec 2024</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyData}>
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
                      />
                      <Tooltip content={<LineChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="totalActivities"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Activity Breakdown</CardTitle>
                <p className="text-sm text-gray-500">Current Period</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.activityBreakdown.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: activity.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{activity.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{activity.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity Breakdown - Fixed to show stacked bars */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Weekly Activity Breakdown</CardTitle>
              <p className="text-sm text-gray-500">Average by Activity Type</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="day" 
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
                    />
                    <Tooltip content={<WeeklyTooltip />} />
                    <Bar dataKey="meetings" stackId="a" fill="#1E40AF" />
                    <Bar dataKey="notes" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="workflows" stackId="a" fill="#60A5FA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Breakout Tab */}
        <TabsContent value="staff" className="space-y-6">
          {/* Staff Performance Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
                <p className="text-sm text-gray-500">Apr 28 - May 27</p>
                <p className="text-sm font-medium text-gray-700">Most Active Staff</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.topPerformers.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => handleStaffClick(staff.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStaff === staff.id
                        ? 'bg-blue-50 border border-blue-200' 
                        : staff.isHighlighted 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">{staff.initials}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">
                          {staff.meetings} meetings • {staff.emails} emails • {staff.tasks} tasks
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{staff.totalActivities}</div>
                      <div className="text-xs text-gray-500">total activities</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Needs Attention */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Needs Attention</CardTitle>
                <p className="text-sm text-gray-500">Apr 28 - May 27</p>
                <p className="text-sm font-medium text-gray-700">Less Active Staff</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.needsAttention.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => handleStaffClick(staff.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStaff === staff.id
                        ? 'bg-blue-50 border border-blue-200' 
                        : staff.isHighlighted 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">{staff.initials}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">
                          {staff.meetings} meetings • {staff.emails} emails • {staff.tasks} tasks
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{staff.totalActivities}</div>
                      <div className="text-xs text-gray-500">total activities</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary for Selected Staff */}
          {selectedStaffDetail && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Activity Summary - {selectedStaffDetail.name}
                </CardTitle>
                <p className="text-sm text-gray-500">Performance breakdown by time period</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Activity Type</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">MTD</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">QTD</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">YTD</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">TTM</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStaffDetail.activities.map((activity, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{activity.activityType}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{activity.mtd}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{activity.qtd}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{activity.ytd}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{activity.ttm}</td>
                          <td className="py-3 px-4 text-center">{getTrendIcon(activity.trend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvisoryFirmDashboard;