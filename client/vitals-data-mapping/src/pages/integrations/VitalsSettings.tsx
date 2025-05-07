import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MappingSection } from '@/types/mapping';
import { SaveIcon } from 'lucide-react';

const VitalsSettings: React.FC = () => {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<MappingSection[]>([
    {
      title: 'Firm Practice Data',
      description: 'Map your firm practice information to Vitals',
      mappings: [
        {
          sourceField: 'advHourlyRate',
          sourceLabel: 'What is your firms ADV hourly rate?',
          targetField: 'hourly_rate',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
        },
        {
          sourceField: 'employeeCount',
          sourceLabel: 'How many employees do you have?',
          targetField: 'employee_count',
          targetOptions: [],
          inputType: 'number',
          customInput: true,
        },
        {
          sourceField: 'techSpend',
          sourceLabel: 'How much did you spend on your tech stack in the prior year?',
          targetField: 'technology_spend',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
        },
        {
          sourceField: 'marketingSpend',
          sourceLabel: 'How much did you spend on marketing in the prior year?',
          targetField: 'marketing_spend',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
        },
      ],
    },
    {
      title: 'Time Estimates',
      description: 'Let\'s estimate how much time each of these requests take on average',
      mappings: [
        {
          sourceField: 'clientMeeting',
          sourceLabel: 'Client Meeting',
          targetField: '30_minutes',
          targetOptions: [
            { label: '60 minutes', value: '60_minutes' },
            { label: '45 minutes', value: '45_minutes' },
            { label: '30 minutes', value: '30_minutes' },
            { label: '15 minutes', value: '15_minutes' },
            { label: '5 minutes', value: '5_minutes' },
          ],
        },
        {
          sourceField: 'clientTask',
          sourceLabel: 'Client Task',
          targetField: '15_minutes',
          targetOptions: [
            { label: '60 minutes', value: '60_minutes' },
            { label: '45 minutes', value: '45_minutes' },
            { label: '30 minutes', value: '30_minutes' },
            { label: '15 minutes', value: '15_minutes' },
            { label: '5 minutes', value: '5_minutes' },
          ],
        },
        {
          sourceField: 'clientWorkflow',
          sourceLabel: 'Client Workflow',
          targetField: '45_minutes',
          targetOptions: [
            { label: '60 minutes', value: '60_minutes' },
            { label: '45 minutes', value: '45_minutes' },
            { label: '30 minutes', value: '30_minutes' },
            { label: '15 minutes', value: '15_minutes' },
            { label: '5 minutes', value: '5_minutes' },
          ],
        },
        {
          sourceField: 'clientPhoneCall',
          sourceLabel: 'Client Phone Call',
          targetField: '15_minutes',
          targetOptions: [
            { label: '60 minutes', value: '60_minutes' },
            { label: '45 minutes', value: '45_minutes' },
            { label: '30 minutes', value: '30_minutes' },
            { label: '15 minutes', value: '15_minutes' },
            { label: '5 minutes', value: '5_minutes' },
          ],
        },
        {
          sourceField: 'clientTextMessage',
          sourceLabel: 'Client Text Message',
          targetField: '5_minutes',
          targetOptions: [
            { label: '60 minutes', value: '60_minutes' },
            { label: '45 minutes', value: '45_minutes' },
            { label: '30 minutes', value: '30_minutes' },
            { label: '15 minutes', value: '15_minutes' },
            { label: '5 minutes', value: '5_minutes' },
          ],
        },
      ],
    },
    {
      title: 'Valuation Estimates',
      description: 'Financial metrics to estimate the economic value of your practice',
      mappings: [
        {
          sourceField: 'assetsUnderManagement',
          sourceLabel: 'Assets Under Management (AUM)',
          targetField: 'aum',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
        },
        {
          sourceField: 'grossRevenueLastYear',
          sourceLabel: 'Gross revenue for last fiscal year',
          targetField: 'gross_revenue',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
        },
        {
          sourceField: 'percentRevenueRecurring',
          sourceLabel: 'Percentage of revenue that is recurring',
          targetField: 'recurring_revenue_percent',
          targetOptions: [],
          inputType: 'number',
          customInput: true,
        },
        {
          sourceField: 'projectedGrowthRate',
          sourceLabel: 'Projected growth rate of your business (%)',
          targetField: 'growth_rate',
          targetOptions: [],
          inputType: 'number',
          customInput: true,
        },
        {
          sourceField: 'operatingProfit',
          sourceLabel: 'Operating profit margin (%)',
          targetField: 'profit_margin',
          targetOptions: [],
          inputType: 'number',
          customInput: true,
        },
        {
          sourceField: 'ownerCompensation',
          sourceLabel: 'Owner\'s total compensation',
          targetField: 'owner_compensation',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
        },
        {
          sourceField: 'nonrecurringExpenses',
          sourceLabel: 'Non-recurring expenses',
          targetField: 'nonrecurring_expenses',
          targetOptions: [],
          inputType: 'currency',
          customInput: true,
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

  const handleInputChange = (sectionIndex: number, sourceField: string, value: string) => {
    const newSections = [...sections];
    const mappingIndex = newSections[sectionIndex].mappings.findIndex(
      m => m.sourceField === sourceField
    );
    
    if (mappingIndex !== -1) {
      newSections[sectionIndex].mappings[mappingIndex].targetField = value;
      setSections(newSections);
    }
  };

  const handleSave = () => {
    console.log('Saving Vitals mapping:', sections);
    
    toast({
      title: "Mapping saved",
      description: "Your Vitals field mapping has been saved successfully.",
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Vital Inputs"
        description="Map your firm's practice data to Vitals"
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
            onInputChange={(sourceField, value) => 
              handleInputChange(index, sourceField, value)
            }
            sourceSystem="Firm"
            targetSystem="Vitals"
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

export default VitalsSettings;
