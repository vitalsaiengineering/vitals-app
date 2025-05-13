
import React from 'react';
import { Users, DollarSign, BarChart } from 'lucide-react';
import { StatCard } from './StatCard';
import { AumChart } from './AumChart';
import { ClientsAgeChart } from './ClientsChart';
import { ClientSegmentation } from './ClientSegmentation';
import { Header } from './Header';
import { AskVitals } from './AskVitals';

export const Dashboard = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Advisor Dashboard</h1>
            <div className="relative">
              <select className="pl-3 pr-8 py-1.5 rounded border appearance-none focus:outline-none focus:ring-1 focus:ring-vitals-lightBlue text-sm">
                <option>All Advisors</option>
                <option>Jack Sample</option>
                <option>Jane Doe</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M7 10l5 5 5-5H7z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard 
              title="Total Clients" 
              value="346" 
              change={4.2} 
              icon={<Users size={20} className="text-vitals-blue" />} 
            />
            <StatCard 
              title="AUM" 
              value="$28M" 
              change={12.4} 
              icon={<DollarSign size={20} className="text-vitals-blue" />} 
            />
            <StatCard 
              title="Revenue" 
              value="$1.2M" 
              change={6.3} 
              icon={<BarChart size={20} className="text-vitals-blue" />} 
            />
            <StatCard 
              title="Average Client Age" 
              value="58" 
              suffix="Average"
              icon={<Users size={20} className="text-vitals-blue" />} 
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <AumChart />
            <div className="grid grid-cols-2 gap-6 mt-6">
              <ClientsAgeChart />
              <ClientSegmentation />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="h-full">
              <AskVitals />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
