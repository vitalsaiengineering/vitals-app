import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { 
  FileText, 
  Download, 
  Filter, 
  Share2, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Reporting() {
  const [selectedReport, setSelectedReport] = useState("client-demographics");
  const [dateRange, setDateRange] = useState("Last 12 Months");

  // Demo data for reports
  const clientAgeData = [
    { name: "Under 30", value: 8 },
    { name: "30-45", value: 22 },
    { name: "46-60", value: 38 },
    { name: "61-75", value: 25 },
    { name: "Over 75", value: 7 },
  ];

  const clientSegmentationData = [
    { name: "Platinum", value: 30, color: "#0088FE" },
    { name: "Gold", value: 45, color: "#00C49F" },
    { name: "Silver", value: 25, color: "#1E88E5" },
  ];

  const aumData = [
    { month: "Jan '23", aum: 15200000 },
    { month: "Feb '23", aum: 15800000 },
    { month: "Mar '23", aum: 16100000 },
    { month: "Apr '23", aum: 16500000 },
    { month: "May '23", aum: 16700000 },
    { month: "Jun '23", aum: 17200000 },
    { month: "Jul '23", aum: 17500000 },
    { month: "Aug '23", aum: 17800000 },
    { month: "Sep '23", aum: 18200000 },
    { month: "Oct '23", aum: 18500000 },
    { month: "Nov '23", aum: 19000000 },
    { month: "Dec '23", aum: 19800000 },
    { month: "Jan '24", aum: 20500000 },
    { month: "Feb '24", aum: 21200000 },
    { month: "Mar '24", aum: 21800000 },
    { month: "Apr '24", aum: 22300000 },
  ];

  const revenueData = [
    { month: "Jan '23", revenue: 620000 },
    { month: "Feb '23", revenue: 650000 },
    { month: "Mar '23", revenue: 670000 },
    { month: "Apr '23", revenue: 680000 },
    { month: "May '23", revenue: 700000 },
    { month: "Jun '23", revenue: 720000 },
    { month: "Jul '23", revenue: 740000 },
    { month: "Aug '23", revenue: 760000 },
    { month: "Sep '23", revenue: 790000 },
    { month: "Oct '23", revenue: 810000 },
    { month: "Nov '23", revenue: 840000 },
    { month: "Dec '23", revenue: 870000 },
    { month: "Jan '24", revenue: 900000 },
    { month: "Feb '24", revenue: 920000 },
    { month: "Mar '24", revenue: 950000 },
    { month: "Apr '24", revenue: 980000 },
  ];

  const clientGrowthData = [
    { month: "Jan '23", newClients: 3, lostClients: 1, netGrowth: 2 },
    { month: "Feb '23", newClients: 5, lostClients: 2, netGrowth: 3 },
    { month: "Mar '23", newClients: 4, lostClients: 0, netGrowth: 4 },
    { month: "Apr '23", newClients: 6, lostClients: 1, netGrowth: 5 },
    { month: "May '23", newClients: 3, lostClients: 2, netGrowth: 1 },
    { month: "Jun '23", newClients: 7, lostClients: 1, netGrowth: 6 },
    { month: "Jul '23", newClients: 5, lostClients: 3, netGrowth: 2 },
    { month: "Aug '23", newClients: 4, lostClients: 1, netGrowth: 3 },
    { month: "Sep '23", newClients: 8, lostClients: 2, netGrowth: 6 },
    { month: "Oct '23", newClients: 6, lostClients: 1, netGrowth: 5 },
    { month: "Nov '23", newClients: 5, lostClients: 0, netGrowth: 5 },
    { month: "Dec '23", newClients: 9, lostClients: 2, netGrowth: 7 },
    { month: "Jan '24", newClients: 7, lostClients: 1, netGrowth: 6 },
    { month: "Feb '24", newClients: 6, lostClients: 2, netGrowth: 4 },
    { month: "Mar '24", newClients: 8, lostClients: 1, netGrowth: 7 },
    { month: "Apr '24", newClients: 10, lostClients: 3, netGrowth: 7 },
  ];

  const referralSourceData = [
    { name: "Client Referrals", value: 45, color: "#8884d8" },
    { name: "Centers of Influence", value: 25, color: "#82ca9d" },
    { name: "Digital Marketing", value: 15, color: "#ffc658" },
    { name: "Events", value: 10, color: "#ff8042" },
    { name: "Other", value: 5, color: "#0088FE" },
  ];

  const clientRetentionData = [
    { name: "Less than 1 year", value: 85 },
    { name: "1-3 years", value: 92 },
    { name: "3-5 years", value: 95 },
    { name: "5-10 years", value: 98 },
    { name: "10+ years", value: 99 },
  ];

  // Custom color function for age brackets - green for younger, transitioning to red for older
  const getAgeBarColor = (entry: { name: string; value: number }) => {
    const ageMap: Record<string, string> = {
      "Under 30": "#4ade80",  // Green for youngest
      "30-45": "#86efac",     // Light green
      "46-60": "#fcd34d",     // Yellow
      "61-75": "#fb923c",     // Orange
      "Over 75": "#ef4444",   // Red for oldest
    };
    return ageMap[entry.name] || "#1E88E5";
  };

  // Format currency for AUM and Revenue
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Generate dynamic report content based on selected report
  const renderReportContent = () => {
    switch (selectedReport) {
      case "client-demographics":
        return (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Client Age Demographics</CardTitle>
                <CardDescription>Distribution of clients across age brackets</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={clientAgeData} 
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      type="number"
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 'dataMax + 5']}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      formatter={(value) => [`${value}%`, "Percentage"]}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Percentage" 
                      radius={[4, 4, 0, 0]}
                    >
                      {clientAgeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getAgeBarColor(entry)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Segmentation</CardTitle>
                <CardDescription>Distribution by client classification</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientSegmentationData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {clientSegmentationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case "aum-trends":
        return (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Assets Under Management (AUM) Over Time</CardTitle>
                <CardDescription>{dateRange} trends in total AUM</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={aumData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value, i) => i % 3 === 0 ? value : ''} 
                    />
                    <YAxis 
                      tickFormatter={(value) => 
                        `$${(Number(value) / 1000000).toFixed(1)}M`} 
                    />
                    <Tooltip 
                      formatter={(value) => 
                        [`$${(Number(value) / 1000000).toFixed(2)}M`, "AUM"]} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="aum" 
                      stroke="#1E88E5" 
                      fill="#1E88E5" 
                      fillOpacity={0.2} 
                      name="AUM" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>{dateRange} revenue trends</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value, i) => i % 3 === 0 ? value : ''} 
                    />
                    <YAxis 
                      tickFormatter={(value) => 
                        `$${(Number(value) / 1000).toFixed(0)}K`} 
                    />
                    <Tooltip 
                      formatter={(value) => 
                        [`$${(Number(value) / 1000).toFixed(0)}K`, "Revenue"]} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4ade80" 
                      fill="#4ade80" 
                      fillOpacity={0.2} 
                      name="Revenue" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case "client-growth":
        return (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
                <CardDescription>{dateRange} client acquisition and retention</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientGrowthData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value, i) => i % 3 === 0 ? value : ''} 
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newClients" name="New Clients" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lostClients" name="Lost Clients" stackId="b" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="netGrowth" name="Net Growth" stroke="#1E88E5" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Referral Sources</CardTitle>
                <CardDescription>Distribution of client acquisition channels</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referralSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {referralSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Retention by Tenure</CardTitle>
                <CardDescription>Retention rates based on client relationship length</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientRetentionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[80, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Retention Rate"]} />
                    <Bar dataKey="value" name="Retention Rate" fill="#1E88E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p>Select a report to view</p>
          </div>
        );
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reporting & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business intelligence and client insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Report Selection Sidebar */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                <button
                  onClick={() => setSelectedReport("client-demographics")}
                  className={`flex items-center gap-2 p-3 text-left transition-colors ${
                    selectedReport === "client-demographics" 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Users size={18} />
                  <span>Client Demographics</span>
                </button>
                <button
                  onClick={() => setSelectedReport("aum-trends")}
                  className={`flex items-center gap-2 p-3 text-left transition-colors ${
                    selectedReport === "aum-trends" 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <TrendingUp size={18} />
                  <span>AUM & Revenue</span>
                </button>
                <button
                  onClick={() => setSelectedReport("client-growth")}
                  className={`flex items-center gap-2 p-3 text-left transition-colors ${
                    selectedReport === "client-growth" 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <DollarSign size={18} />
                  <span>Client Growth</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="date-range" className="w-full">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last 12 Months">Last 12 Months</SelectItem>
                    <SelectItem value="Year to Date">Year to Date</SelectItem>
                    <SelectItem value="Last 3 Years">Last 3 Years</SelectItem>
                    <SelectItem value="Last 5 Years">Last 5 Years</SelectItem>
                    <SelectItem value="Custom Range">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advisor">Advisor</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="advisor" className="w-full">
                    <SelectValue placeholder="Select advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Advisors</SelectItem>
                    <SelectItem value="advisor1">Maria Reynolds</SelectItem>
                    <SelectItem value="advisor2">Thomas Chen</SelectItem>
                    <SelectItem value="advisor3">Aisha Patel</SelectItem>
                    <SelectItem value="advisor4">Jackson Miller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Client Segment</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="segment" className="w-full">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                <button className="flex items-center gap-2 p-3 text-left hover:bg-muted">
                  <FileText size={16} />
                  <span>Q2 2024 Business Review</span>
                </button>
                <button className="flex items-center gap-2 p-3 text-left hover:bg-muted">
                  <FileText size={16} />
                  <span>Annual Client Demographics</span>
                </button>
                <button className="flex items-center gap-2 p-3 text-left hover:bg-muted">
                  <FileText size={16} />
                  <span>Revenue Growth 2023-2024</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className="md:col-span-9">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
}