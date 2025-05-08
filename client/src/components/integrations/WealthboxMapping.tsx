import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FieldOption, MappingSection } from '@/types/mapping';
import { SaveIcon, Plus, AlertCircle } from 'lucide-react';
import FieldMappingRow from '@/components/mapping/FieldMappingRow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWealthboxFields } from '@/hooks/use-wealthbox-fields';
import axios from 'axios';

const WealthboxMapping: React.FC = () => {
  const { toast } = useToast();
  const [wealthboxToken, setWealthboxToken] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState(false);
  const { isLoading, hasError, getOptions, searchOptions } = useWealthboxFields(wealthboxToken);
  
  // Fetch the Wealthbox token when the component mounts
  useEffect(() => {
    const fetchWealthboxToken = async () => {
      try {
        setTokenLoading(true);
        setTokenError(false);
        
        const response = await axios.get('/api/wealthbox/token');
        if (response.data.success && response.data.token) {
          setWealthboxToken(response.data.token);
        } else {
          console.error('No Wealthbox token available:', response.data);
          setTokenError(true);
        }
      } catch (error) {
        console.error('Error fetching Wealthbox token:', error);
        setTokenError(true);
      } finally {
        setTokenLoading(false);
      }
    };
    
    fetchWealthboxToken();
  }, []);
  
  // Callback to search for field options as user types
  const handleFieldSearch = useCallback(
    async (searchTerm: string): Promise<FieldOption[]> => {
      return searchOptions(searchTerm);
    },
    [searchOptions]
  );
  
  const [sections, setSections] = useState<MappingSection[]>([
    {
      title: 'Client Status & Relationships',
      description: 'Map client status and relationship fields',
      mappings: [
        {
          sourceField: 'activeClient',
          sourceLabel: 'Which field indicates an Active Client of the firm?',
          targetField: '',
          targetOptions: [],
        },
        {
          sourceField: 'prospectiveClient',
          sourceLabel: 'Which field indicates a Prospective Client of the firm?',
          targetField: '',
          targetOptions: [],
        },
        {
          sourceField: 'leadAdvisor',
          sourceLabel: 'Which field indicates the Lead Advisor for a client?',
          targetField: '',
          targetOptions: [],
        },
        {
          sourceField: 'clientSegmentation',
          sourceLabel: 'Which field indicates client segmentation for your clients?',
          targetField: '',
          targetOptions: [],
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
          targetField: '',
          targetOptions: [],
        },
        {
          sourceField: 'secondTier',
          sourceLabel: 'What indicates a second tier client?',
          targetField: '',
          targetOptions: [],
        },
        {
          sourceField: 'thirdTier',
          sourceLabel: 'What indicates a third tier client?',
          targetField: '',
          targetOptions: [],
        },
      ],
    },
  ]);
  
  // Load existing mappings from the database
  const [isMappingsLoading, setIsMappingsLoading] = useState(false);
  
  const loadSavedMappings = useCallback(async () => {
    if (!wealthboxToken) return;
    
    setIsMappingsLoading(true);
    try {
      const response = await axios.get('/api/data-mappings', {
        params: {
          integrationTypeId: 1, // Wealthbox integration ID
          entityType: 'client'
        }
      });
      
      if (response.data.success && response.data.mappings) {
        // Create a mapping of sourceField -> targetField for quick lookup
        const savedMappings = response.data.mappings.reduce((acc: Record<string, string>, mapping: { sourceField: string; targetField: string }) => {
          acc[mapping.sourceField] = mapping.targetField;
          return acc;
        }, {});
        
        // Update sections with saved mappings
        if (Object.keys(savedMappings).length > 0) {
          setSections(prevSections => 
            prevSections.map(section => ({
              ...section,
              mappings: section.mappings.map(mapping => ({
                ...mapping,
                targetField: savedMappings[mapping.sourceField] || mapping.targetField,
              }))
            }))
          );
          
          // Update segmentation sections with saved mappings
          setSegmentationSections(prevSections => 
            prevSections.map(section => ({
              ...section,
              mappings: section.mappings.map(mapping => ({
                ...mapping,
                targetField: savedMappings[mapping.sourceField] || mapping.targetField,
              }))
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading saved mappings:', error);
      // Don't show an error toast here to avoid disrupting the UX
    } finally {
      setIsMappingsLoading(false);
    }
  }, [wealthboxToken]);

  // Update sections with field options once they're loaded
  useEffect(() => {
    if (!isLoading && !hasError && wealthboxToken) {
      const allOptions = getOptions('all');
      
      // Update main sections
      const updatedSections = sections.map(section => ({
        ...section,
        mappings: section.mappings.map(mapping => ({
          ...mapping,
          targetOptions: allOptions,
        })),
      }));
      
      // Update segmentation sections
      const updatedSegmentationSections = segmentationSections.map(section => ({
        ...section,
        mappings: section.mappings.map(mapping => ({
          ...mapping,
          targetOptions: allOptions,
        })),
      }));
      
      setSections(updatedSections);
      setSegmentationSections(updatedSegmentationSections);
      
      // Load saved mappings after field options are ready
      loadSavedMappings();
    }
  }, [isLoading, hasError, wealthboxToken, getOptions, loadSavedMappings]);
  
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
    
    // Get current field options
    const allOptions = getOptions('all');
    
    newSections[0].mappings.push({
      sourceField: `tier${newTierCount}`,
      sourceLabel: `What indicates a tier ${newTierCount} client?`,
      targetField: '',
      targetOptions: allOptions,
    });
    
    setSegmentationSections(newSections);
    setTierCount(newTierCount);
    
    toast({
      title: "Tier added",
      description: `Added tier ${newTierCount} to your client segmentation.`,
    });
  };

  const handleSave = async () => {
    try {
      // Prepare the mappings data
      const allMappings: Array<{ sourceField: string; targetField: string }> = [];
      
      // Add main section mappings
      sections.forEach(section => {
        section.mappings.forEach(mapping => {
          if (mapping.targetField) {
            allMappings.push({
              sourceField: mapping.sourceField,
              targetField: mapping.targetField
            });
          }
        });
      });
      
      // Add segmentation section mappings
      segmentationSections.forEach(section => {
        section.mappings.forEach(mapping => {
          if (mapping.targetField) {
            allMappings.push({
              sourceField: mapping.sourceField,
              targetField: mapping.targetField
            });
          }
        });
      });
      
      // Save to backend
      const response = await axios.post('/api/data-mappings', {
        integrationTypeId: 1, // Wealthbox integration ID
        entityType: 'client',
        mappings: allMappings
      });
      
      if (response.data.success) {
        toast({
          title: "Mapping saved",
          description: "Your Wealthbox field mapping has been saved successfully.",
        });
      } else {
        throw new Error(response.data.message || 'Failed to save mappings');
      }
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: "Error",
        description: "Failed to save your field mappings. Please try again.",
        variant: "destructive",
      });
    }
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
                disabled={isLoading || hasError || tokenError}
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

  if (tokenError) {
    return (
      <div>
        <PageHeader 
          title="Wealthbox Integration"
          description="Map your firm's data fields to corresponding Wealthbox CRM fields"
          backLink="/settings"
          onBack={() => {
            window.history.pushState({}, "", "/settings?tab=data-mapping");
            window.dispatchEvent(new Event('popstate'));
          }}
        />
        
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to retrieve your Wealthbox authentication token. Please make sure you have connected your Wealthbox account in the integrations settings.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => {
              window.history.pushState({}, "", "/settings?tab=integrations");
              window.dispatchEvent(new Event('popstate'));
            }}
          >
            Go to Integrations Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Wealthbox Integration"
        description="Map your firm's data fields to corresponding Wealthbox CRM fields"
        backLink="/settings"
        onBack={() => {
          window.history.pushState({}, "", "/settings?tab=data-mapping");
          window.dispatchEvent(new Event('popstate'));
        }}
      />

      <div className="max-w-4xl mx-auto">
        {(isLoading || tokenLoading) ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Wealthbox field options...</p>
          </div>
        ) : hasError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Wealthbox field options. Please try again later or check your connection.
            </AlertDescription>
          </Alert>
        ) : (
          <>
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
                onSearch={handleFieldSearch}
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
          </>
        )}
      </div>
    </div>
  );
};

export default WealthboxMapping;