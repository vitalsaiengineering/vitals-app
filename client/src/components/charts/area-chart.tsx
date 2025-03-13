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
  className?: string;
}

export function AreaChart({
  data,
  xAxisDataKey,
  series,
  height = 250,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  className,
}: AreaChartProps) {
  return (
    <div className={`w-full rounded-lg p-4 bg-card shadow-sm ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.4} />}
          <XAxis 
            dataKey={xAxisDataKey} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--muted))', strokeOpacity: 0.4 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--muted))', strokeOpacity: 0.4 }}
          />
          {showTooltip && (
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '0.375rem',
              }} 
              labelStyle={{ 
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                marginBottom: '0.25rem',
              }}
            />
          )}
          {showLegend && (
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))'
              }}
            />
          )}
          {series.map((s, index) => {
            const id = `color-${index}-${s.dataKey}`;
            return (
              <defs key={`gradient-${id}`}>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
            );
          })}
          {series.map((s, index) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              fill={`url(#color-${index}-${s.dataKey})`}
              fillOpacity={1}
              strokeWidth={2}
              activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
