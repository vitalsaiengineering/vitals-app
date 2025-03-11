import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface PieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  height?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatter?: (value: number) => string;
}

export function PieChart({
  data,
  height = 250,
  showLegend = true,
  showTooltip = true,
  formatter,
}: PieChartProps) {
  const tooltipFormatter = formatter || ((value: number) => `${value}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        {showTooltip && <Tooltip formatter={tooltipFormatter} />}
        {showLegend && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
