
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  suffix?: string;
};

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon,
  suffix 
}) => {
  const isPositive = change && change > 0;
  
  return (
    <div className="bg-white p-4 rounded-lg border flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${isPositive ? 'text-vitals-green' : 'text-vitals-red'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="bg-vitals-gray p-3 rounded-lg">
        {icon}
      </div>
    </div>
  );
};
