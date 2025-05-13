import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  suffix?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  suffix, 
  icon 
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  
  return (
    <Card className="p-4 border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div>{icon}</div>}
      </div>
      
      <div className="flex items-end">
        <div className="text-2xl font-bold">{value}</div>
        {suffix && <div className="ml-1 text-sm text-gray-500 mb-1">{suffix}</div>}
      </div>
      
      {change !== undefined && (
        <div className="mt-1 flex items-center">
          <div className={`flex items-center ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {isPositive ? (
              <ArrowUpIcon size={16} />
            ) : isNegative ? (
              <ArrowDownIcon size={16} />
            ) : null}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
          <span className="text-xs text-gray-500 ml-1">from last month</span>
        </div>
      )}
    </Card>
  );
};