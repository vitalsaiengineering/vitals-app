import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { ageRange: '30-39', count: 32 },
  { ageRange: '40-49', count: 56 },
  { ageRange: '50-59', count: 124 },
  { ageRange: '60-69', count: 86 },
  { ageRange: '70+', count: 48 },
];

export const ClientsAgeChart = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Client Age Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="ageRange" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value} clients`, 'Count']}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Bar 
                dataKey="count" 
                fill="#4361ee" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};