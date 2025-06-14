import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, TrendingUp, DollarSign, BadgePercent, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

export default function Index() {
  const [selectedAdvisor, setSelectedAdvisor] = useState("firm");
  
  // Effect to initialize with localStorage value if available
  useEffect(() => {
    const storedView = localStorage.getItem("selectedAdvisorView");
    if (storedView) {
      setSelectedAdvisor(storedView);
    }
  }, []);

  // Handle advisor view change
  const handleViewChange = (view: string) => {
    setSelectedAdvisor(view);
  };
  
  // Sample data - different for each advisor
  const getClientAgeData = (advisor: string) => {
    switch(advisor) {
      case "advisor1": // Maria Reynolds
        return [
          { name: "Under 30", value: 12 },
          { name: "30-45", value: 35 },
          { name: "46-60", value: 30 },
          { name: "61-75", value: 18 },
          { name: "Over 75", value: 5 },
        ];
      case "advisor2": // Thomas Chen
        return [
          { name: "Under 30", value: 5 },
          { name: "30-45", value: 15 },
          { name: "46-60", value: 45 },
          { name: "61-75", value: 30 },
          { name: "Over 75", value: 5 },
        ];
      case "advisor3": // Aisha Patel
        return [
          { name: "Under 30", value: 20 },
          { name: "30-45", value: 30 },
          { name: "46-60", value: 25 },
          { name: "61-75", value: 15 },
          { name: "Over 75", value: 10 },
        ];
      case "advisor4": // Jackson Miller
        return [
          { name: "Under 30", value: 3 },
          { name: "30-45", value: 17 },
          { name: "46-60", value: 40 },
          { name: "61-75", value: 32 },
          { name: "Over 75", value: 8 },
        ];
      default: // Firm Overview
        return [
          { name: "Under 30", value: 8 },
          { name: "30-45", value: 22 },
          { name: "46-60", value: 38 },
          { name: "61-75", value: 25 },
          { name: "Over 75", value: 7 },
        ];
    }
  };
  
  const getClientSegmentation = (advisor: string) => {
    switch(advisor) {
      case "advisor1": // Maria Reynolds
        return [
          { name: "Platinum", value: 40, color: "#0088FE" },
          { name: "Gold", value: 35, color: "#00C49F" },
          { name: "Silver", value: 25, color: "#1E88E5" },
        ];
      case "advisor2": // Thomas Chen
        return [
          { name: "Platinum", value: 25, color: "#0088FE" },
          { name: "Gold", value: 55, color: "#00C49F" },
          { name: "Silver", value: 20, color: "#1E88E5" },
        ];
      case "advisor3": // Aisha Patel
        return [
          { name: "Platinum", value: 50, color: "#0088FE" },
          { name: "Gold", value: 30, color: "#00C49F" },
          { name: "Silver", value: 20, color: "#1E88E5" },
        ];
      case "advisor4": // Jackson Miller
        return [
          { name: "Platinum", value: 20, color: "#0088FE" },
          { name: "Gold", value: 60, color: "#00C49F" },
          { name: "Silver", value: 20, color: "#1E88E5" },
        ];
      default: // Firm Overview
        return [
          { name: "Platinum", value: 30, color: "#0088FE" },
          { name: "Gold", value: 45, color: "#00C49F" },
          { name: "Silver", value: 25, color: "#1E88E5" },
        ];
    }
  };

  const getAumData = (advisor: string) => {
    // Just use the same data structure but with different multipliers for each advisor
    const multipliers = {
      "advisor1": 0.65, // Maria Reynolds
      "advisor2": 0.48, // Thomas Chen
      "advisor3": 0.72, // Aisha Patel
      "advisor4": 0.55, // Jackson Miller
      "firm": 1.0     // Firm Overview (default)
    };
    
    const multiplier = multipliers[advisor] || 1;
    
    return [
      { month: "Jan '23", aum: 15200000 * multiplier },
      { month: "Feb '23", aum: 15800000 * multiplier },
      { month: "Mar '23", aum: 16100000 * multiplier },
      { month: "Apr '23", aum: 16500000 * multiplier },
      { month: "May '23", aum: 16700000 * multiplier },
      { month: "Jun '23", aum: 17200000 * multiplier },
      { month: "Jul '23", aum: 17500000 * multiplier },
      { month: "Aug '23", aum: 17800000 * multiplier },
      { month: "Sep '23", aum: 18200000 * multiplier },
      { month: "Oct '23", aum: 18500000 * multiplier },
      { month: "Nov '23", aum: 19000000 * multiplier },
      { month: "Dec '23", aum: 19800000 * multiplier },
      { month: "Jan '24", aum: 20500000 * multiplier },
      { month: "Feb '24", aum: 21200000 * multiplier },
      { month: "Mar '24", aum: 21800000 * multiplier },
      { month: "Apr '24", aum: 22300000 * multiplier },
      { month: "May '24", aum: 22800000 * multiplier },
      { month: "Jun '24", aum: 23400000 * multiplier },
      { month: "Jul '24", aum: 24100000 * multiplier },
      { month: "Aug '24", aum: 24800000 * multiplier },
      { month: "Sep '24", aum: 25500000 * multiplier },
      { month: "Oct '24", aum: 26300000 * multiplier },
      { month: "Nov '24", aum: 27100000 * multiplier },
      { month: "Dec '24", aum: 28000000 * multiplier },
    ];
  };

  // Get KPI data based on selected advisor
  const getKpiData = (advisor: string) => {
    switch(advisor) {
      case "advisor1": // Maria Reynolds
        return [
          {
            title: "Total Clients",
            value: "92",
            icon: Users,
            change: { value: "2.1%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "AUM",
            value: "$18.2M",
            icon: TrendingUp,
            change: { value: "10.4%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Revenue",
            value: "$780K",
            icon: DollarSign,
            change: { value: "7.2%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Average Client Age",
            value: "49",
            icon: BadgePercent,
            change: { value: "Younger", positive: true },
            variant: "blue" as const,
          },
        ];
      case "advisor2": // Thomas Chen
        return [
          {
            title: "Total Clients",
            value: "73",
            icon: Users,
            change: { value: "1.7%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "AUM",
            value: "$13.4M",
            icon: TrendingUp,
            change: { value: "8.9%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Revenue",
            value: "$570K",
            icon: DollarSign,
            change: { value: "5.6%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Average Client Age",
            value: "62",
            icon: BadgePercent,
            change: { value: "Older", positive: undefined },
            variant: "blue" as const,
          },
        ];
      case "advisor3": // Aisha Patel
        return [
          {
            title: "Total Clients",
            value: "104",
            icon: Users,
            change: { value: "5.6%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "AUM",
            value: "$20.2M",
            icon: TrendingUp,
            change: { value: "14.3%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Revenue",
            value: "$890K",
            icon: DollarSign,
            change: { value: "11.2%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Average Client Age",
            value: "45",
            icon: BadgePercent,
            change: { value: "Younger", positive: true },
            variant: "blue" as const,
          },
        ];
      case "advisor4": // Jackson Miller
        return [
          {
            title: "Total Clients",
            value: "77",
            icon: Users,
            change: { value: "0.9%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "AUM",
            value: "$15.4M",
            icon: TrendingUp,
            change: { value: "7.8%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Revenue",
            value: "$650K",
            icon: DollarSign,
            change: { value: "4.9%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Average Client Age",
            value: "59",
            icon: BadgePercent,
            change: { value: "Average", positive: undefined },
            variant: "blue" as const,
          },
        ];
      default: // Firm Overview
        return [
          {
            title: "Total Clients",
            value: "346",
            icon: Users,
            change: { value: "4.2%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "AUM",
            value: "$28M",
            icon: TrendingUp,
            change: { value: "12.4%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Revenue",
            value: "$1.2M",
            icon: DollarSign,
            change: { value: "8.3%", positive: true },
            variant: "blue" as const,
          },
          {
            title: "Average Client Age",
            value: "58",
            icon: BadgePercent,
            change: { value: "Average", positive: undefined },
            variant: "blue" as const,
          },
        ];
    }
  };

  // Get data based on selected advisor
  const clientAgeData = getClientAgeData(selectedAdvisor);
  const clientSegmentation = getClientSegmentation(selectedAdvisor);
  const aumData = getAumData(selectedAdvisor);
  const kpiData = getKpiData(selectedAdvisor);
  
  // Get the current advisor name for display
  const getCurrentAdvisorName = () => {
    const advisor = ADVISORS.find(a => a.id === selectedAdvisor);
    return advisor ? advisor.name : "Firm Overview";
  };

  // Custom color function for age brackets - green for younger, transitioning to red for older
  const getAgeBarColor = (entry: any) => {
    const ageMap = {
      "Under 30": "#4ade80",  // Green for youngest
      "30-45": "#86efac",     // Light green
      "46-60": "#fcd34d",     // Yellow
      "61-75": "#fb923c",     // Orange
      "Over 75": "#ef4444",   // Red for oldest
    };
    return ageMap[entry.name] || "#1E88E5";
  };

  // Custom colors for client segmentation
  const segmentColors = {
    "Platinum": "#8884d8", // Purple
    "Gold": "#ffc658",     // Gold
    "Silver": "#82ca9d",   // Teal
  };
  
  return (
    <DashboardLayout onToggleView={handleViewChange}>
      <div className="animate-fade-in">
        {/* KPI Cards - moved up by removing the title section */}
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, i) => (
            <StatCard
              key={i}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              change={kpi.change}
              variant={kpi.variant}
            />
          ))}
        </div>

        {/* AUM Over Time Chart */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Assets Under Management (AUM) Over Time</span>
              <Link 
                to="/reporting?report=clients-aum-overtime" 
                className="flex items-center text-sm text-primary hover:underline ml-2"
              >
                View Full Report <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </CardTitle>
            <CardDescription>24 month history showing growth</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/reporting?report=clients-aum-overtime" className="block h-80">
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
                  <Legend />
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
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1 bg-white h-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Clients by Age Bracket</span>
                <Link 
                  to="/reporting?report=age-demographics" 
                  className="flex items-center text-sm text-primary hover:underline ml-2"
                >
                  View Full Report <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </CardTitle>
              <CardDescription>Distribution across age groups</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {/* Using a full height and width container for the chart to scale properly */}
              <Link to="/reporting?report=age-demographics" className="block w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={clientAgeData} 
                    layout="horizontal"
                    margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
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
                      wrapperStyle={{ pointerEvents: 'none' }}
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
              </Link>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-white h-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Client Segmentation</span>
                <Link 
                  to="/reporting?report=client-segmentation" 
                  className="flex items-center text-sm text-primary hover:underline ml-2"
                >
                  View Full Report <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </CardTitle>
              <CardDescription>Distribution by client tier</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {/* Making this chart container have a fixed height to match the age bracket chart */}
              <Link to="/reporting?report=client-segmentation" className="block w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientSegmentation}
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="60%"
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {clientSegmentation.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={segmentColors[entry.name as keyof typeof segmentColors] || entry.color} 
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Percentage"]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                      }}
                      wrapperStyle={{ pointerEvents: 'none' }}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{
                        paddingTop: '20px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Define advisor names - must match Header component
const ADVISORS = [
  { id: "firm", name: "Firm Overview" },
  { id: "advisor1", name: "Maria Reynolds" },
  { id: "advisor2", name: "Thomas Chen" },
  { id: "advisor3", name: "Aisha Patel" },
  { id: "advisor4", name: "Jackson Miller" }
];
