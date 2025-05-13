import React from 'react';
import { AppSidebar } from '@/components/dashboard-new/AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};