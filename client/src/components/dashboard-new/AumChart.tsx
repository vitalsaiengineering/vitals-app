import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', aum: 24 },
  { month: 'Feb', aum: 24.5 },
  { month: 'Mar', aum: 25.2 },
  { month: 'Apr', aum: 26.1 },
  { month: 'May', aum: 26.9 },
  { month: 'Jun', aum: 27.2 },
  { month: 'Jul', aum: 27.8 },
  { month: 'Aug', aum: 28 },
];

export const AumChart = () => {
  const formatYAxis = (value: number) => {
    return `$${value}M`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">AUM Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis 
                tickFormatter={formatYAxis} 
                axisLine={false} 
                tickLine={false} 
                domain={['dataMin - 1', 'dataMax + 1']} 
              />
              <Tooltip
                formatter={(value) => [`$${value}M`, 'AUM']}
                labelFormatter={(label) => `${label}`}
              />
              <Line
                type="monotone"
                dataKey="aum"
                stroke="#4361ee"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};