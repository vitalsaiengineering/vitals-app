
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

const data = [
  { month: "Jan", sales: 12000 },
  { month: "Feb", sales: 19000 },
  { month: "Mar", sales: 15000 },
  { month: "Apr", sales: 22000 },
  { month: "May", sales: 28000 },
  { month: "Jun", sales: 25000 },
  { month: "Jul", sales: 34000 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-border shadow-sm rounded-lg">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-primary font-semibold">{`$${payload[0].value?.toLocaleString()}`}</p>
      </div>
    );
  }

  return null;
};

export const SalesChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0078D4" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0078D4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          tickLine={false} 
          axisLine={false} 
          tick={{ fill: '#888888' }} 
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tick={{ fill: '#888888' }}
          tickFormatter={(value) => `$${value / 1000}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="sales" 
          stroke="#0078D4" 
          fillOpacity={1} 
          fill="url(#colorSales)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
