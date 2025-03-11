import { ResponsiveContainer, AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AreaChartProps {
  data: any[];
  xAxisDataKey: string;
  series: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  height?: number | string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export function AreaChart({
  data,
  xAxisDataKey,
  series,
  height = 250,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {series.map((s) => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.3}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
