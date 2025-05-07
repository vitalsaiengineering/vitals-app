
import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MappingSection } from '@/types/mapping';
import { SaveIcon } from 'lucide-react';

const OrionSettings: React.FC = () => {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<MappingSection[]>([
    {
      title: 'Client Portfolio Data',
      description: 'Map portfolio and investment data fields',
      mappings: [
        {
          sourceField: 'accountNumber',
          sourceLabel: 'Account Number',
          targetField: 'account_id',
          targetOptions: [
            { label: 'Account ID', value: 'account_id' },
            { label: 'Account Number', value: 'account_number' },
            { label: 'Portfolio ID', value: 'portfolio_id' },
          ],
        },
        {
          sourceField: 'accountType',
          sourceLabel: 'Account Type',
          targetField: 'account_type',
          targetOptions: [
            { label: 'Account Type', value: 'account_type' },
            { label: 'Account Category', value: 'account_category' },
            { label: 'Investment Type', value: 'investment_type' },
          ],
        },
        {
          sourceField: 'accountValue',
          sourceLabel: 'Account Value',
          targetField: 'current_value',
          targetOptions: [
            { label: 'Current Value', value: 'current_value' },
            { label: 'Market Value', value: 'market_value' },
            { label: 'Portfolio Value', value: 'portfolio_value' },
          ],
        },
      ],
    },
    {
      title: 'Investment Holdings',
      description: 'Map investment holdings and position data',
      mappings: [
        {
          sourceField: 'securityId',
          sourceLabel: 'Security ID',
          targetField: 'security_id',
          targetOptions: [
            { label: 'Security ID', value: 'security_id' },
            { label: 'CUSIP', value: 'cusip' },
            { label: 'Symbol', value: 'symbol' },
          ],
        },
        {
          sourceField: 'positionValue',
          sourceLabel: 'Position Value',
          targetField: 'position_value',
          targetOptions: [
            { label: 'Position Value', value: 'position_value' },
            { label: 'Market Value', value: 'market_value' },
            { label: 'Current Value', value: 'current_value' },
          ],
        },
        {
          sourceField: 'acquisitionDate',
          sourceLabel: 'Acquisition Date',
          targetField: 'purchase_date',
          targetOptions: [
            { label: 'Purchase Date', value: 'purchase_date' },
            { label: 'Trade Date', value: 'trade_date' },
            { label: 'Acquisition Date', value: 'acquisition_date' },
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
        
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} className="px-6">
            <SaveIcon className="w-4 h-4 mr-2" />
            Save Mappings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrionSettings;
