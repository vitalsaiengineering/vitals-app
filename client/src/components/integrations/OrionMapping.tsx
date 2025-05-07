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
      title: 'Portfolio Fields',
      description: 'Map portfolio data fields to Orion Advisor fields',
      mappings: [
        {
          sourceField: 'accountNumber',
          sourceLabel: 'Which field represents Account Number?',
          targetField: 'account_number',
          targetOptions: [
            { label: 'Account Number', value: 'account_number' },
            { label: 'Account ID', value: 'account_id' },
            { label: 'Portfolio ID', value: 'portfolio_id' },
          ],
        },
        {
          sourceField: 'accountValue',
          sourceLabel: 'Which field represents Account Value?',
          targetField: 'market_value',
          targetOptions: [
            { label: 'Market Value', value: 'market_value' },
            { label: 'Asset Value', value: 'asset_value' },
            { label: 'Portfolio Value', value: 'portfolio_value' },
          ],
        },
        {
          sourceField: 'accountType',
          sourceLabel: 'Which field indicates Account Type?',
          targetField: 'account_type',
          targetOptions: [
            { label: 'Account Type', value: 'account_type' },
            { label: 'Registration Type', value: 'registration_type' },
            { label: 'Account Registration', value: 'account_registration' },
          ],
        },
        {
          sourceField: 'custodian',
          sourceLabel: 'Which field indicates the Custodian?',
          targetField: 'custodian',
          targetOptions: [
            { label: 'Custodian', value: 'custodian' },
            { label: 'Custodial Institution', value: 'custodial_institution' },
            { label: 'Held At', value: 'held_at' },
          ],
        },
      ],
    },
    {
      title: 'Performance Metrics',
      description: 'Map performance metrics to Orion Advisor fields',
      mappings: [
        {
          sourceField: 'timeWeightedReturn',
          sourceLabel: 'Which field represents Time-Weighted Return?',
          targetField: 'twr',
          targetOptions: [
            { label: 'TWR', value: 'twr' },
            { label: 'Time-Weighted Return', value: 'time_weighted_return' },
            { label: 'Performance Return', value: 'performance_return' },
          ],
        },
        {
          sourceField: 'benchmark',
          sourceLabel: 'Which field indicates the Benchmark?',
          targetField: 'benchmark',
          targetOptions: [
            { label: 'Benchmark', value: 'benchmark' },
            { label: 'Index', value: 'index' },
            { label: 'Comparison Index', value: 'comparison_index' },
          ],
        },
        {
          sourceField: 'internalRateOfReturn',
          sourceLabel: 'Which field indicates Internal Rate of Return?',
          targetField: 'irr',
          targetOptions: [
            { label: 'IRR', value: 'irr' },
            { label: 'Money-Weighted Return', value: 'money_weighted_return' },
            { label: 'Internal Rate of Return', value: 'internal_rate_of_return' },
          ],
        }
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
      description: "Your Orion field mapping has been saved successfully.",
    });
  };

  return (
    <div>
      <PageHeader 
        title="Orion Advisor Integration"
        description="Map your portfolio data fields to corresponding Orion Advisor fields"
        backLink="/settings"
      />

      <div className="max-w-4xl mx-auto">
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
        
        <div className="flex justify-end mt-6 mb-10">
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