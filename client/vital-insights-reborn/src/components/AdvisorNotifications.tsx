
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Users, DollarSign, Home, BarChart, ArrowRight } from 'lucide-react';

type NotificationProps = {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  label?: string;
};

const Notification: React.FC<NotificationProps> = ({ title, value, change, icon, label }) => {
  const isPositive = change !== undefined && change > 0;
  
  return (
    <div className="border rounded-lg p-3 flex justify-between items-center hover:shadow-sm transition-shadow mb-3 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-vitals-gray text-vitals-blue">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        {change !== undefined ? (
          <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-vitals-green' : 'text-vitals-red'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(change)}%</span>
          </div>
        ) : (
          label && <div className="text-sm font-medium text-gray-500">{label}</div>
        )}
      </div>
    </div>
  );
};

export const AdvisorNotifications = () => {
  const notifications = [
    {
      title: "New Clients YTD",
      value: "18",
      icon: <Users size={16} />
    },
    {
      title: "Total Clients",
      value: "346",
      icon: <Users size={16} />
    },
    {
      title: "Average Account Size",
      value: "$843K",
      change: 2.5,
      icon: <DollarSign size={16} />
    },
    {
      title: "Average Household Value",
      value: "$1.2M",
      change: -1.2,
      icon: <Home size={16} />
    },
    {
      title: "Top Custodian",
      value: "Fidelity",
      label: "62% of assets",
      icon: <BarChart size={16} />
    },
    {
      title: "Top Investment Strategy",
      value: "US Large Cap Growth",
      label: "28% of portfolio",
      icon: <BarChart size={16} />
    }
  ];

  return (
    <div className="border rounded-lg p-4 h-full bg-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Practice Highlights</h3>
        <button className="text-sm font-medium text-vitals-blue hover:underline flex items-center gap-1">
          View all insights
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {notifications.map((notification, i) => (
          <Notification key={i} {...notification} />
        ))}
      </div>
    </div>
  );
};
