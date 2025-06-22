import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import ClientAnniversaryView from './ClientAnniversaryView';
import ClientInceptionView from './ClientInceptionView';
import { useAdvisor } from '@/contexts/AdvisorContext';

/**
 * ClientDashboard Component
 * 
 * Main dashboard with exact layout matching reference image
 * Uses original data sources from ClientInceptionView and ClientAnniversaryView
 */
export default function ClientDashboard() {
  const [globalSearch, setGlobalSearch] = useState('');
  const { selectedAdvisor } = useAdvisor();

  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-full mx-auto">
        {/* Header with toggle buttons - exact match to reference image */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{selectedAdvisor !== "All Advisors" 
                  ? `${selectedAdvisor}'s Client Dashboard` 
                  : "Client Dashboard"}</h1>
            <p className="text-muted-foreground mt-1">
              Track client acquisition and segmentation metrics
            </p>
          </div>
          
          {/* Toggle buttons - exact match to reference image */}
          <div className="flex gap-0">
            <Button
              variant={activeTab === 'clients' ? 'default' : 'outline'}
              className={`rounded-r-none border-r-0 px-6 py-2 ${
                activeTab === 'clients' 
                  ? 'bg-[#22d3ee] text-white hover:bg-[#22d3ee]/90' 
                  : 'bg-white text-black border hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('clients')}
            >
              <Users className="w-4 h-4 mr-2" />
              Clients
            </Button>
            <Button
              variant={activeTab === 'anniversaries' ? 'default' : 'outline'}
              className={`rounded-l-none px-6 py-2 ${
                activeTab === 'anniversaries' 
                  ? 'bg-[#22d3ee] text-white hover:bg-[#22d3ee]/90' 
                  : 'bg-white text-black border hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('anniversaries')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Anniversaries
            </Button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'clients' && (
          <ClientInceptionView 
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
          />
        )}
        
        {activeTab === 'anniversaries' && (
          <ClientAnniversaryView 
            globalSearch={globalSearch} 
            setGlobalSearch={setGlobalSearch}
          />
        )}
      </div>
    </div>
  );
}