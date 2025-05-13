
import React from 'react';
import { 
  LayoutDashboard, 
  BarChart, 
  DollarSign, 
  Settings, 
  Users, 
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false,
  onClick
}: { 
  icon: React.ElementType, 
  label: string,
  active?: boolean,
  onClick?: () => void
}) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full justify-start gap-3 px-3 font-normal",
        active 
          ? "bg-white/10 text-white" 
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Button>
  );
};

export const AppSidebar = () => {
  return (
    <div className="h-screen w-64 bg-vitals-blue flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-vitals-blue font-bold">V</span>
          </div>
          <span className="text-white font-semibold text-lg">Vitals AI</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 px-3 py-2 space-y-1">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={BarChart} label="Reporting" />
        <SidebarItem icon={DollarSign} label="Valuation" />
        <SidebarItem icon={Settings} label="Settings" />
        <SidebarItem icon={Users} label="Clients" />
        <SidebarItem icon={User} label="Profile" />
      </div>

      {/* Administration section */}
      <div className="px-6 py-3">
        <div className="text-white/50 text-xs font-medium mb-2">ADMINISTRATION</div>
        <div className="px-3 space-y-1">
          <SidebarItem icon={Settings} label="User Management" />
        </div>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-vitals-lightBlue flex items-center justify-center text-white font-medium">
            JS
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">Jack Sample</span>
            <span className="text-white/50 text-xs">Advisor</span>
          </div>
        </div>
      </div>
    </div>
  );
};
