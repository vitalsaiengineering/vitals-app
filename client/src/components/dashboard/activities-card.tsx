import { useState } from "react";
import { MetricCard } from "./metric-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart } from "../charts/line-chart";

// Format percentage
const formatPercentage = (value: number) => {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
};

interface ActivitiesCardProps {
  totalActivities: number;
  activityChange: number;
  activityTrend: {
    date: string;
    emails: number;
    calls: number;
  }[];
  activityBreakdown: {
    type: string;
    count: number;
  }[];
}

export function ActivitiesCard({
  totalActivities,
  activityChange,
  activityTrend,
  activityBreakdown,
}: ActivitiesCardProps) {
  const [timeRange, setTimeRange] = useState("30");

  const actions = (
    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
      <span className="material-icons">more_vert</span>
    </Button>
  );

  // Format data for line chart
  const chartData = activityTrend;
  const lineChartSeries = [
    {
      dataKey: "emails",
      name: "Emails",
      color: "hsl(var(--primary-500))"
    },
    {
      dataKey: "calls",
      name: "Calls",
      color: "hsl(var(--secondary-400))"
    }
  ];

  return (
    <MetricCard
      title="Client Activities"
      subtitle="By Type"
      actions={actions}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-3xl font-bold text-neutral-900">
            {totalActivities.toLocaleString()}
          </span>
          <span className={cn(
            "ml-2 text-sm font-medium",
            activityChange > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatPercentage(activityChange)}
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
        <LineChart
          data={chartData}
          xAxisDataKey="date"
          series={lineChartSeries}
          height={200}
        />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {activityBreakdown.map((activity, index) => (
          <div key={index} className="bg-neutral-50 p-2 rounded text-center">
            <div className="text-lg font-semibold text-primary-600">{activity.count}</div>
            <div className="text-xs text-neutral-500">{activity.type}</div>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}

// Helper for className conditionals
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
