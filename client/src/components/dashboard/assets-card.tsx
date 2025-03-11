import { useState } from "react";
import { MetricCard } from "./metric-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart } from "../charts/pie-chart";

// Format currency in millions
const formatMillions = (value: number) => {
  return `$${(value / 1000000).toFixed(1)}M`;
};

// Format percentage
const formatPercentage = (value: number) => {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
};

interface AssetsCardProps {
  totalAum: number;
  aumChange: number;
  aumByClientType: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function AssetsCard({ totalAum, aumChange, aumByClientType }: AssetsCardProps) {
  const [timeRange, setTimeRange] = useState("30");
  
  const actions = (
    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
      <span className="material-icons">more_vert</span>
    </Button>
  );
  
  return (
    <MetricCard 
      title="Assets Under Management" 
      subtitle="By Client" 
      actions={actions}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-3xl font-bold text-neutral-900">
            {formatMillions(totalAum)}
          </span>
          <span className={cn(
            "ml-2 text-sm font-medium",
            aumChange > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatPercentage(aumChange)}
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
        <PieChart 
          data={aumByClientType}
          height={200}
          formatter={formatMillions}
        />
      </div>
      
      <div className="mt-2">
        {aumByClientType.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm mb-1">
            <div className="flex items-center">
              <span 
                className="h-3 w-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              ></span>
              <span>{item.name}</span>
            </div>
            <span className="font-medium">{formatMillions(item.value)}</span>
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
