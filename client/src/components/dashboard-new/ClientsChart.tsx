import React from 'react';
import { 
  BarChart as RechartsBarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Data representing client segments within each age bracket
const data = [
  { 
    name: '<20', 
    premium: 0,
    standard: 1,
    basic: 1,
    premiumAum: 0,
    standardAum: 0.8,
    basicAum: 0.5
  },
  { 
    name: '20-40', 
    premium: 3,
    standard: 2,
    basic: 3,
    premiumAum: 3.5,
    standardAum: 1.8,
    basicAum: 1.2
  },
  { 
    name: '41-60', 
    premium: 3,
    standard: 4,
    basic: 4,
    premiumAum: 4.2,
    standardAum: 3.6,
    basicAum: 2.8
  },
  { 
    name: '61-80', 
    premium: 4,
    standard: 3,
    basic: 3,
    premiumAum: 5.1,
    standardAum: 2.7,
    basicAum: 2.1
  },
  { 
    name: '>80', 
    premium: 2,
    standard: 1,
    basic: 1,
    premiumAum: 2.5,
    standardAum: 0.7,
    basicAum: 0.3
  },
];

export const ClientsAgeChart = () => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Age Demographics</h2>
          <p className="text-sm text-gray-500">Distribution across age groups</p>
        </div>
        <a href="#" className="text-sm text-blue-600 hover:underline">View Full Report</a>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <Tooltip
              formatter={(value) => [`${value}`, 'Clients']}
              labelStyle={{ color: '#555' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            
            <Bar dataKey="basic" stackId="a" fill="#B3D4FF" name="Basic" />
            <Bar dataKey="standard" stackId="a" fill="#4A89DC" name="Standard" />
            <Bar dataKey="premium" stackId="a" fill="#1E3A8A" name="Premium" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 