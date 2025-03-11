import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface LineChartProps {
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
  formatter?: (value: number) => string;
}

export function LineChart({
  data,
  xAxisDataKey,
  series,
  height = 250,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  formatter,
}: LineChartProps) {
  const tooltipFormatter = formatter || ((value: number) => `${value}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        {showTooltip && <Tooltip formatter={tooltipFormatter} />}
        {showLegend && <Legend />}
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            activeDot={{ r: 8 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
