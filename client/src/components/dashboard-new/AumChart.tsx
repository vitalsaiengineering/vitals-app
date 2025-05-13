import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Data representing cumulative growth by segment over time
const data = [
  { 
    year: '2015', 
    platinum: 50000000, 
    gold: 30000000, 
    silver: 20000000,
    platinumClients: 15,
    goldClients: 25,
    silverClients: 40
  },
  { 
    year: '2016', 
    platinum: 80000000, 
    gold: 60000000, 
    silver: 40000000,
    platinumClients: 20,
    goldClients: 35,
    silverClients: 55
  },
  { 
    year: '2017', 
    platinum: 120000000, 
    gold: 90000000, 
    silver: 60000000,
    platinumClients: 28,
    goldClients: 42,
    silverClients: 65
  },
  { 
    year: '2018', 
    platinum: 180000000, 
    gold: 120000000, 
    silver: 100000000,
    platinumClients: 35,
    goldClients: 50,
    silverClients: 80
  },
  { 
    year: '2019', 
    platinum: 250000000, 
    gold: 170000000, 
    silver: 130000000,
    platinumClients: 45,
    goldClients: 65,
    silverClients: 95
  },
  { 
    year: '2020', 
    platinum: 320000000, 
    gold: 220000000, 
    silver: 160000000,
    platinumClients: 55,
    goldClients: 78,
    silverClients: 110
  },
  { 
    year: '2021', 
    platinum: 400000000, 
    gold: 280000000, 
    silver: 210000000,
    platinumClients: 68,
    goldClients: 92,
    silverClients: 125
  },
  { 
    year: '2022', 
    platinum: 520000000, 
    gold: 350000000, 
    silver: 280000000,
    platinumClients: 80,
    goldClients: 110,
    silverClients: 145
  },
  { 
    year: '2023', 
    platinum: 650000000, 
    gold: 420000000, 
    silver: 330000000,
    platinumClients: 95,
    goldClients: 130,
    silverClients: 160
  },
  { 
    year: '2024', 
    platinum: 800000000, 
    gold: 520000000, 
    silver: 380000000,
    platinumClients: 110,
    goldClients: 145,
    silverClients: 180
  },
  { 
    year: '2025', 
    platinum: 950000000, 
    gold: 600000000, 
    silver: 450000000,
    platinumClients: 125,
    goldClients: 160,
    silverClients: 200
  }
];

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

export const AumChart = () => {
  // Define a unified tickFormatter function that always returns a string
  const tickFormatter = (value: number) => {
    return formatCurrency(value);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex flex-col mb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Book Development by Segment</h2>
          <a href="#" className="text-sm text-blue-600 hover:underline">View Full Report</a>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Click on a segment to filter or a year to view details
        </p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient id="colorPlatinum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0D47A1" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1976D2" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorSilver" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#42A5F5" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis 
              tickFormatter={tickFormatter}
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                return [formatCurrency(value as number), name === 'platinum' ? 'Platinum' : name === 'gold' ? 'Gold' : 'Silver'];
              }}
              labelStyle={{ color: '#555' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value) => {
                return value === 'platinum' ? 'Platinum' : value === 'gold' ? 'Gold' : 'Silver';
              }}
            />

            <Area 
              type="monotone" 
              dataKey="platinum" 
              stackId="1"
              stroke="#0D47A1" 
              fillOpacity={1}
              fill="url(#colorPlatinum)" 
            />
            <Area 
              type="monotone" 
              dataKey="gold" 
              stackId="1"
              stroke="#1976D2" 
              fillOpacity={1}
              fill="url(#colorGold)" 
            />
            <Area 
              type="monotone" 
              dataKey="silver" 
              stackId="1"
              stroke="#42A5F5" 
              fillOpacity={1}
              fill="url(#colorSilver)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};