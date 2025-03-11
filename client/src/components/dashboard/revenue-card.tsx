import { useState } from "react";
import { MetricCard } from "./metric-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart } from "../charts/bar-chart";

// Format currency in thousands
const formatThousands = (value: number) => {
  return `$${(value / 1000).toFixed(0)}K`;
};

// Format percentage
const formatPercentage = (value: number) => {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
};

interface RevenueCardProps {
  totalRevenue: number;
  revenueChange: number;
  revenueByQuarter: {
    quarter: string;
    revenue: number;
  }[];
  topClient: {
    name: string;
    revenue: number;
    percentage: number;
  };
  averageRevenue: number;
}

export function RevenueCard({ 
  totalRevenue, 
  revenueChange, 
  revenueByQuarter,
  topClient,
  averageRevenue
}: RevenueCardProps) {
  const [timeRange, setTimeRange] = useState("30");
  
  const actions = (
    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
      <span className="material-icons">more_vert</span>
    </Button>
  );
  
  // Format data for bar chart
  const chartData = revenueByQuarter;
  const barChartSeries = [
    {
      dataKey: "revenue",
      name: "Revenue",
      color: "hsl(var(--primary-500))"
    }
  ];
  
  return (
    <MetricCard 
      title="Revenue" 
      subtitle="By Client" 
      actions={actions}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-3xl font-bold text-neutral-900">
            {formatThousands(totalRevenue)}
          </span>
          <span className={cn(
            "ml-2 text-sm font-medium",
            revenueChange > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatPercentage(revenueChange)}
          </span>
        </div>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="chart-container">
        <BarChart 
          data={chartData}
          xAxisDataKey="quarter"
          series={barChartSeries}
          height={200}
          formatter={formatThousands}
        />
      </div>
      
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Top Client: {topClient.name}</span>
          <span className="text-sm font-medium">{formatThousands(topClient.revenue)}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-1.5">
          <div 
            className="bg-primary-600 h-1.5 rounded-full" 
            style={{ width: `${topClient.percentage}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-neutral-600">Avg. Client Revenue</span>
          <span className="text-sm font-medium">{formatThousands(averageRevenue)}</span>
        </div>
      </div>
    </MetricCard>
  );
}

// Helper for className conditionals
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
