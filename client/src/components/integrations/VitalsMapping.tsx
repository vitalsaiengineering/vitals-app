import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MappingSection } from '@/types/mapping';
import { SaveIcon } from 'lucide-react';
import FieldMappingRow from '@/components/mapping/FieldMappingRow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const VitalsMapping: React.FC = () => {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<MappingSection[]>([
    {
      title: 'Practice KPIs',
      description: 'Define which fields to include in your practice KPIs',
      mappings: [
        {
          sourceField: 'aum',
          sourceLabel: 'Which field represents your Assets Under Management?',
          targetField: 'total_aum',
          targetOptions: [
            { label: 'Total AUM', value: 'total_aum' },
            { label: 'Assets Under Management', value: 'assets_under_management' },
            { label: 'Total Assets', value: 'total_assets' },
          ],
        },
        {
          sourceField: 'revenue',
          sourceLabel: 'Which field represents your Total Revenue?',
          targetField: 'annual_revenue',
          targetOptions: [
            { label: 'Annual Revenue', value: 'annual_revenue' },
            { label: 'Total Revenue', value: 'total_revenue' },
            { label: 'Gross Revenue', value: 'gross_revenue' },
          ],
        },
        {
          sourceField: 'households',
          sourceLabel: 'Which field represents Total Households?',
          targetField: 'household_count',
          targetOptions: [
            { label: 'Household Count', value: 'household_count' },
            { label: 'Total Households', value: 'total_households' },
            { label: 'Client Households', value: 'client_households' },
          ],
        },
        {
          sourceField: 'advisors',
          sourceLabel: 'Which field represents Advisor Count?',
          targetField: 'advisor_count',
          targetOptions: [
            { label: 'Advisor Count', value: 'advisor_count' },
            { label: 'Total Advisors', value: 'total_advisors' },
            { label: 'Team Members', value: 'team_members' },
          ],
        },
      ],
    },
    {
      title: 'Client Growth Metrics',
      description: 'Define which fields to use for client growth metrics',
      mappings: [
        {
          sourceField: 'newClients',
          sourceLabel: 'Which field tracks New Clients?',
          targetField: 'new_clients_mtd',
          targetOptions: [
            { label: 'New Clients MTD', value: 'new_clients_mtd' },
            { label: 'New Clients This Month', value: 'new_clients_this_month' },
            { label: 'Client Acquisitions', value: 'client_acquisitions' },
          ],
        },
        {
          sourceField: 'prospectConversion',
          sourceLabel: 'Which field tracks Prospect Conversion?',
          targetField: 'prospect_conversion_rate',
          targetOptions: [
            { label: 'Prospect Conversion Rate', value: 'prospect_conversion_rate' },
            { label: 'Lead Conversion', value: 'lead_conversion' },
            { label: 'Conversion Percentage', value: 'conversion_percentage' },
          ],
        },
        {
          sourceField: 'clientRetention',
          sourceLabel: 'Which field tracks Client Retention?',
          targetField: 'retention_rate',
          targetOptions: [
            { label: 'Retention Rate', value: 'retention_rate' },
            { label: 'Client Retention', value: 'client_retention' },
            { label: 'Client Loyalty', value: 'client_loyalty' },
          ],
        },
      ],
    },
  ]);

  // Custom thresholds section
  const [thresholdSections, setThresholdSections] = useState<MappingSection[]>([
    {
      title: 'KPI Thresholds',
      description: 'Set threshold values for your key performance indicators',
      mappings: [
        {
          sourceField: 'aumTarget',
          sourceLabel: 'AUM Target',
          targetField: '$10000000',
          targetOptions: [],
          customInput: true,
          inputType: 'currency',
        },
        {
          sourceField: 'revenueTarget',
          sourceLabel: 'Revenue Target',
          targetField: '$1000000',
          targetOptions: [],
          customInput: true,
          inputType: 'currency',
        },
        {
          sourceField: 'clientCountTarget',
          sourceLabel: 'Client Count Target',
          targetField: '100',
          targetOptions: [],
          customInput: true,
          inputType: 'number',
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

  const handleThresholdChange = (sectionIndex: number, sourceField: string, value: string) => {
    const newSections = [...thresholdSections];
    const mappingIndex = newSections[sectionIndex].mappings.findIndex(
      m => m.sourceField === sourceField
    );
    
    if (mappingIndex !== -1) {
      newSections[sectionIndex].mappings[mappingIndex].targetField = value;
      setThresholdSections(newSections);
    }
  };

  const handleSave = () => {
    // In a real application, we would save the mapping to the backend here
    console.log('Saving Vitals AI mapping:', sections);
    console.log('Saving KPI thresholds:', thresholdSections);
    
    toast({
      title: "Mapping saved",
      description: "Your Vitals AI field mapping has been saved successfully.",
    });
  };

  const renderThresholdsSection = () => {
    const section = thresholdSections[0];
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
          {section.description && <CardDescription>{section.description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border">
            {section.mappings.map((mapping) => (
              <FieldMappingRow
                key={mapping.sourceField}
                mapping={mapping}
                onMappingChange={(sourceField, targetField) => {}}
                onInputChange={(sourceField, value) => 
                  handleThresholdChange(0, sourceField, value)
                }
                sourceSystem="KPI"
                targetSystem="Target"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader 
        title="Vitals AI Inputs"
        description="Configure how your practice data maps to Vitals AI KPIs and metrics"
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
            targetSystem="Vitals AI"
          />
        ))}
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Target Thresholds</h2>
        <p className="text-muted-foreground mb-6">Set target thresholds for your key performance indicators</p>
        
        {renderThresholdsSection()}
        
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

export default VitalsMapping;