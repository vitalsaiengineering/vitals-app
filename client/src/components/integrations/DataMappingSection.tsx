import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

// Import the image assets directly
// These paths assume the images are in the /public folder
const vitalsIcon = '/attached_assets/vitals.png';
const wealthboxIcon = '/attached_assets/wealthbox.png';
const orionIcon = '/attached_assets/orion.png';

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
      <img 
        src={vitalsIcon} 
        alt="Vitals AI" 
        className="w-8 h-8 object-contain" 
      />
    ),
    color: 'bg-blue-50',
  },
  {
    name: 'Wealthbox',
    description: 'Map client data fields to Wealthbox CRM',
    path: '/settings?tab=data-mapping&mapping=wealthbox',
    icon: (
      <img 
        src={wealthboxIcon} 
        alt="Wealthbox" 
        className="w-8 h-8 object-contain" 
      />
    ),
    color: 'bg-blue-50',
  },
  {
    name: 'Orion Advisor',
    description: 'Map portfolio data to Orion Advisor Services',
    path: '/settings?tab=data-mapping&mapping=orion',
    icon: (
      <img 
        src={orionIcon} 
        alt="Orion Advisor" 
        className="w-8 h-8 object-contain" 
      />
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