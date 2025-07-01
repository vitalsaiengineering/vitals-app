import React from 'react';
import { AppSidebar } from '@/components/dashboard-new/AppSidebar';
import { Header } from '@/components/dashboard-new/Header';
import { useLocation } from 'wouter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  
  // Don't show header on settings and profile pages
  const showHeaderPaths = ['/dashboard'];
  const shouldShowHeader = showHeaderPaths.includes(location);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        {shouldShowHeader && <Header />}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};