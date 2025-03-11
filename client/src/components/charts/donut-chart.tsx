import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface DonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  height?: number | string;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatter?: (value: number) => string;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  height = 250,
  innerRadius = 60,
  outerRadius = 80,
  showLegend = true,
  showTooltip = true,
  formatter,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const tooltipFormatter = formatter || ((value: number) => `${value}`);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showTooltip && <Tooltip formatter={tooltipFormatter} />}
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
      
      {(centerLabel || centerValue) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          {centerLabel && <div className="text-sm text-neutral-500">{centerLabel}</div>}
          {centerValue && <div className="text-lg font-semibold">{centerValue}</div>}
        </div>
      )}
    </div>
  );
}
