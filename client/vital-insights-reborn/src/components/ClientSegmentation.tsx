
import React from 'react';
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const data = [
  { name: 'Platinum', value: 30 },
  { name: 'Gold', value: 45 },
  { name: 'Silver', value: 25 },
];

const COLORS = ['#304FFE', '#4A89DC', '#90CAF9'];

export const ClientSegmentation = () => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Client Segmentation</h2>
          <p className="text-sm text-gray-500">Distribution by client value</p>
        </div>
        <a href="#" className="text-sm text-blue-600 hover:underline">View Full Report</a>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`, 'Percentage']}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value) => value}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
