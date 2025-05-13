
import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { AppSidebar } from '@/components/AppSidebar';

const Index = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 overflow-auto">
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
