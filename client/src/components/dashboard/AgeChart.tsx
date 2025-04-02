import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getAgeGroups, AgeGroup } from "@/lib/clientData";

interface AgeChartProps {
  className?: string;
  onGroupSelect?: (groupName: string) => void;
  selectedGroup: string | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as AgeGroup;
    return (
      <div className="glass-effect p-3 rounded-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-muted-foreground">
          {data.count} clients ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const AgeChart: React.FC<AgeChartProps> = ({
  className,
  onGroupSelect,
  selectedGroup,
}) => {
  const ageGroups = getAgeGroups(); // Static demo data for now

  // Determine which bar index corresponds to the selected group name
  const selectedBarIndex = selectedGroup
    ? ageGroups.findIndex((group) => group.name === selectedGroup)
    : null;

  const handleBarClick = (data: any, index: number) => {
    if (onGroupSelect) {
      onGroupSelect(data.name);
    }
  };

  return (
    <Card
      className={`overflow-hidden animate-fade-in-up delay-100 ${className}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Age Demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ageGroups}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis
              dataKey="range"
              tick={{ fill: "#888", fontSize: 12 }}
              axisLine={{ stroke: "#eee" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#888", fontSize: 12 }}
              axisLine={{ stroke: "#eee" }}
              tickLine={false}
              width={30}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              className="smooth-transition cursor-pointer"
            >
              {ageGroups.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--ageBand-${index + 1})`}
                  opacity={
                    selectedBarIndex === null || selectedBarIndex === index
                      ? 1
                      : 0.5
                  }
                  onClick={() => handleBarClick(entry, index)}
                  className="smooth-transition"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AgeChart;
