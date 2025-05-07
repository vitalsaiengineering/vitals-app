import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface IntegrationOption {
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

const integrations: IntegrationOption[] = [
  {
    name: 'Vitals AI Inputs',
    description: 'Configure Vital inputs to your practice KPIs',
    path: '/settings?tab=data-mapping&mapping=vitals',
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        ></path>
      </svg>
    ),
    color: 'bg-blue-50',
  },
  {
    name: 'Wealthbox',
    description: 'Map client data fields to Wealthbox CRM',
    path: '/settings?tab=data-mapping&mapping=wealthbox',
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        ></path>
      </svg>
    ),
    color: 'bg-blue-50',
  },
  {
    name: 'Orion Advisor',
    description: 'Map portfolio data to Orion Advisor Services',
    path: '/settings?tab=data-mapping&mapping=orion',
    icon: (
      <svg
        className="w-8 h-8 text-purple-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        ></path>
      </svg>
    ),
    color: 'bg-purple-50',
  },
];

interface DataMappingSectionProps {
  activeMapping: string | null;
  onSetActiveMapping: (mapping: string) => void;
}

const DataMappingSection: React.FC<DataMappingSectionProps> = ({ 
  activeMapping,
  onSetActiveMapping
}) => {
  if (activeMapping === 'vitals' || activeMapping === 'wealthbox' || activeMapping === 'orion') {
    return null; // The specific mapping component will be rendered elsewhere
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Integration Settings</h2>
      <p className="text-muted-foreground mb-6">
        Configure data mapping between your firm's data and integration partners
      </p>
      
      <div className="grid gap-6 md:grid-cols-1">
        {integrations.map((integration) => (
          <Link 
            key={integration.name} 
            href={integration.path}
            onClick={(e) => {
              e.preventDefault();
              const mappingType = integration.path.split('mapping=')[1];
              onSetActiveMapping(mappingType);
            }}
          >
            <Card className="p-6 h-full transition-all duration-300 hover:shadow-md border border-border cursor-pointer">
              <CardContent className="p-0">
                <div className="flex items-start">
                  <div className={`${integration.color} p-3 rounded-lg mr-4`}>
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{integration.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{integration.description}</p>
                  </div>
                  <div className="ml-4 text-muted-foreground">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DataMappingSection;