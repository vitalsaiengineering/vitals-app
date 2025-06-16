import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MappingSection } from '@/types/mapping';
import { SaveIcon } from 'lucide-react';

const OrionMapping: React.FC = () => {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<MappingSection[]>([
    {
      title: 'Investment Holdings',
      description: 'Map investment holdings and position data',
      mappings: [
        {
          sourceField: 'investmentStrategy',
          sourceLabel: (
            <div>
              <div className="font-bold">Investment Strategy</div>
              <div className="font-normal">Which field in Orion shows the investment strategy for your client?</div>
            </div>
          ),
          targetField: 'investment_strategy',
          targetOptions: [
            { label: 'Investment Strategy: Primary', value: 'investment_strategy' },
            { label: 'Strategy Type: Classification', value: 'strategy_type' },
            { label: 'Portfolio Strategy: Method', value: 'portfolio_strategy' },
          ],
        },
        {
          sourceField: 'platform',
          sourceLabel: (
            <div>
              <div className="font-bold">Platform</div>
              <div className="font-normal">Which field in Orion shows the platform you hold investments with?</div>
            </div>
          ),
          targetField: 'platform',
          targetOptions: [
            { label: 'Platform: Custodian', value: 'platform' },
            { label: 'Custodian: Institution', value: 'custodian' },
            { label: 'Broker: Platform', value: 'broker' },
          ],
        },
        {
          sourceField: 'partnerships',
          sourceLabel: (
            <div>
              <div className="font-bold">Partnerships</div>
              <div className="font-normal">Which field in Orion shows business partners involved with your portfolio management?</div>
            </div>
          ),
          targetField: 'partnerships',
          targetOptions: [
            { label: 'Partnerships: Business', value: 'partnerships' },
            { label: 'Business Partners: Entities', value: 'business_partners' },
            { label: 'Partner Firms: Collaborators', value: 'partner_firms' },
          ],
        },
      ],
    },
  ]);

  const handleMappingChange = (sectionIndex: number, sourceField: string, targetField: string) => {
    const newSections = [...sections];
    const mappingIndex = newSections[sectionIndex].mappings.findIndex(
      m => m.sourceField === sourceField
    );
    
    if (mappingIndex !== -1) {
      newSections[sectionIndex].mappings[mappingIndex].targetField = targetField;
      setSections(newSections);
    }
  };

  const handleSave = () => {
    // In a real application, we would save the mapping to the backend here
    console.log('Saving Orion mapping:', sections);
    
    toast({
      title: "Mapping saved",
      description: "Your Orion Advisor Services field mapping has been saved successfully.",
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Orion Advisor Services"
        description="Map your firm's portfolio data fields to Orion Advisor Services"
        backLink="/settings"
        onBack={() => {
          window.history.pushState({}, "", "/settings?tab=data-mapping");
          window.dispatchEvent(new Event('popstate'));
        }}
      />

      <div className="mapping-container">
        {sections.map((section, index) => (
          <FieldMappingCard
            key={index}
            title={section.title}
            description={section.description}
            mappings={section.mappings}
            onMappingChange={(sourceField, targetField) => 
              handleMappingChange(index, sourceField, targetField)
            }
            sourceSystem="Firm"
            targetSystem="Orion"
          />
        ))}
        
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <Button onClick={handleSave} className="px-6">
            <SaveIcon className="w-4 h-4 mr-2" />
            Save Mappings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrionMapping;