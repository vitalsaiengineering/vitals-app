import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface BarChartProps {
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
  layout?: 'horizontal' | 'vertical';
  formatter?: (value: number) => string;
}

export function BarChart({
  data,
  xAxisDataKey,
  series,
  height = 250,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  layout = 'vertical',
  formatter,
}: BarChartProps) {
  const tooltipFormatter = formatter || ((value: number) => `${value}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis type={layout === 'horizontal' ? 'category' : 'number'} dataKey={layout === 'horizontal' ? xAxisDataKey : undefined} />
        <YAxis dataKey={layout === 'vertical' ? xAxisDataKey : undefined} type={layout === 'horizontal' ? 'number' : 'category'} />
        {showTooltip && <Tooltip formatter={tooltipFormatter} />}
        {showLegend && <Legend />}
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.name}
            fill={s.color}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
