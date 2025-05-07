import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MappingSection } from '@/types/mapping';
import { SaveIcon, Plus } from 'lucide-react';
import FieldMappingRow from '@/components/mapping/FieldMappingRow';

const WealthboxMapping: React.FC = () => {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<MappingSection[]>([
    {
      title: 'Client Status & Relationships',
      description: 'Map client status and relationship fields',
      mappings: [
        {
          sourceField: 'activeClient',
          sourceLabel: 'Which field indicates an Active Client of the firm?',
          targetField: 'status_active',
          targetOptions: [
            { label: 'Status: Active', value: 'status_active' },
            { label: 'Client Status', value: 'client_status' },
            { label: 'Active Flag', value: 'active_flag' },
            { label: 'Current Client', value: 'current_client' },
          ],
        },
        {
          sourceField: 'prospectiveClient',
          sourceLabel: 'Which field indicates a Prospective Client of the firm?',
          targetField: 'status_prospect',
          targetOptions: [
            { label: 'Status: Prospect', value: 'status_prospect' },
            { label: 'Prospect Flag', value: 'prospect_flag' },
            { label: 'Lead Status', value: 'lead_status' },
            { label: 'Potential Client', value: 'potential_client' },
          ],
        },
        {
          sourceField: 'leadAdvisor',
          sourceLabel: 'Which field indicates the Lead Advisor for a client?',
          targetField: 'primary_advisor',
          targetOptions: [
            { label: 'Primary Advisor', value: 'primary_advisor' },
            { label: 'Lead Advisor', value: 'lead_advisor' },
            { label: 'Financial Advisor', value: 'financial_advisor' },
            { label: 'Relationship Manager', value: 'relationship_manager' },
          ],
        },
        {
          sourceField: 'clientSegmentation',
          sourceLabel: 'Which field indicates client segmentation for your clients?',
          targetField: 'client_tier',
          targetOptions: [
            { label: 'Client Tier', value: 'client_tier' },
            { label: 'Segmentation', value: 'segmentation' },
            { label: 'Client Category', value: 'client_category' },
            { label: 'Client Class', value: 'client_class' },
          ],
        },
      ],
    },
  ]);

  // Add client segmentation section
  const [segmentationSections, setSegmentationSections] = useState<MappingSection[]>([
    {
      title: 'Client Segmentation Definitions',
      description: 'Define your client tiers and map them to segmentation attributes',
      mappings: [
        {
          sourceField: 'topTier',
          sourceLabel: 'What indicates a top tier client?',
          targetField: 'tier_1',
          targetOptions: [
            { label: 'High Net Worth', value: 'tier_1' },
            { label: 'Strategic Relationship', value: 'strategic' },
            { label: 'Premium Client', value: 'premium' },
          ],
        },
        {
          sourceField: 'secondTier',
          sourceLabel: 'What indicates a second tier client?',
          targetField: 'tier_2',
          targetOptions: [
            { label: 'Mid-Level Client', value: 'tier_2' },
            { label: 'Core Client', value: 'core' },
            { label: 'Standard Client', value: 'standard' },
          ],
        },
        {
          sourceField: 'thirdTier',
          sourceLabel: 'What indicates a third tier client?',
          targetField: 'tier_3',
          targetOptions: [
            { label: 'Basic Client', value: 'tier_3' },
            { label: 'Entry-Level', value: 'entry' },
            { label: 'Starter Account', value: 'starter' },
          ],
        },
      ],
    },
  ]);
  
  const [tierCount, setTierCount] = useState(3);

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

  const handleSegmentationMappingChange = (sectionIndex: number, sourceField: string, targetField: string) => {
    const newSections = [...segmentationSections];
    const mappingIndex = newSections[sectionIndex].mappings.findIndex(
      m => m.sourceField === sourceField
    );
    
    if (mappingIndex !== -1) {
      newSections[sectionIndex].mappings[mappingIndex].targetField = targetField;
      setSegmentationSections(newSections);
    }
  };

  const handleAddTier = () => {
    const newTierCount = tierCount + 1;
    const newSections = [...segmentationSections];
    
    newSections[0].mappings.push({
      sourceField: `tier${newTierCount}`,
      sourceLabel: `What indicates a tier ${newTierCount} client?`,
      targetField: `tier_${newTierCount}`,
      targetOptions: [
        { label: `Tier ${newTierCount} Client`, value: `tier_${newTierCount}` },
        { label: `Level ${newTierCount}`, value: `level_${newTierCount}` },
        { label: `Group ${newTierCount}`, value: `group_${newTierCount}` },
      ],
    });
    
    setSegmentationSections(newSections);
    setTierCount(newTierCount);
    
    toast({
      title: "Tier added",
      description: `Added tier ${newTierCount} to your client segmentation.`,
    });
  };

  const handleSave = () => {
    // In a real application, we would save the mapping to the backend here
    console.log('Saving Wealthbox mapping:', sections);
    console.log('Saving Client Segmentation mapping:', segmentationSections);
    
    toast({
      title: "Mapping saved",
      description: "Your Wealthbox field mapping has been saved successfully.",
    });
  };

  const renderDefinitionsSection = () => {
    const section = segmentationSections[0];
    
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
                onMappingChange={(sourceField, targetField) => 
                  handleSegmentationMappingChange(0, sourceField, targetField)
                }
                sourceSystem="Firm"
                targetSystem="Segmentation Engine"
              />
            ))}
            <div className="border-t border-border p-4">
              <Button 
                variant="outline" 
                onClick={handleAddTier} 
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More Tiers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader 
        title="Wealthbox Integration"
        description="Map your firm's data fields to corresponding Wealthbox CRM fields"
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
            targetSystem="Wealthbox"
          />
        ))}
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Client Segmentation</h2>
        <p className="text-muted-foreground mb-6">Configure client segmentation settings for Wealthbox integration</p>
        
        {renderDefinitionsSection()}
        
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

export default WealthboxMapping;