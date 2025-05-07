
import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const integrations = [
  {
    name: 'Vitals AI Inputs',
    description: 'Configure Vital inputs to your practice KPIs',
    path: '/settings/vitals',
    icon: <img src="/lovable-uploads/514cb508-9e6f-4373-9956-ea683f13517a.png" alt="Vitals AI Inputs" className="w-8 h-8" />,
    color: 'bg-blue-50',
  },
  {
    name: 'Wealthbox',
    description: 'Map client data fields to Wealthbox CRM',
    path: '/settings/wealthbox',
    icon: <img src="/lovable-uploads/29d0ae34-09aa-4ff9-9a3f-d674f8d53894.png" alt="Wealthbox" className="w-8 h-8" />,
    color: 'bg-blue-50',
  },
  {
    name: 'Orion Advisor',
    description: 'Map portfolio data to Orion Advisor Services',
    path: '/settings/orion',
    icon: <img src="/lovable-uploads/8a1fd350-aa27-4be5-ab77-22ad84fe1936.png" alt="Orion" className="w-8 h-8" />,
    color: 'bg-violet-50',
  }
];

const Settings: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Integration Settings"
        description="Configure data mapping between your firm's data and integration partners"
      />

      <div className="max-w-3xl mx-auto grid gap-6 md:grid-cols-1">
        {integrations.map((integration) => (
          <Link key={integration.path} to={integration.path}>
            <Card className="p-6 h-full transition-all duration-300 hover:shadow-md border border-border">
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
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Settings;
