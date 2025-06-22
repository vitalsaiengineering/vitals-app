import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FieldOption, MappingSection } from '@/types/mapping';
import { SaveIcon, Plus, AlertCircle, Info } from 'lucide-react';
import FieldMappingRow from '@/components/mapping/FieldMappingRow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWealthboxFields } from '@/hooks/use-wealthbox-fields';
import { fieldHasOptions } from '@/services/wealthbox-api';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useMockData } from '@/contexts/MockDataContext';

// Mock data for Wealthbox fields
const mockWealthboxFields: FieldOption[] = [
  { label: 'Contact Type', value: 'contact_type', fieldType: 'select', documentType: 'contact' },
  { label: 'Client Status', value: 'client_status', fieldType: 'select', documentType: 'contact' },
  { label: 'Active Flag', value: 'active_flag', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Current Client', value: 'current_client', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Prospect Flag', value: 'prospect_flag', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Lead Status', value: 'lead_status', fieldType: 'select', documentType: 'contact' },
  { label: 'Potential Client', value: 'potential_client', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Former Client', value: 'former_client', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Terminated Status', value: 'terminated', fieldType: 'select', documentType: 'contact' },
  { label: 'Inactive Status', value: 'inactive_status', fieldType: 'select', documentType: 'contact' },
  { label: 'Deceased Flag', value: 'deceased_flag', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Death Date', value: 'death_date', fieldType: 'date', documentType: 'contact' },
  { label: 'Deceased Status', value: 'deceased_status', fieldType: 'boolean', documentType: 'contact' },
  { label: 'Primary Advisor', value: 'primary_advisor', fieldType: 'text', documentType: 'contact' },
  { label: 'Lead Advisor', value: 'lead_advisor', fieldType: 'text', documentType: 'contact' },
  { label: 'Financial Advisor', value: 'financial_advisor', fieldType: 'text', documentType: 'contact' },
  { label: 'Relationship Manager', value: 'relationship_manager', fieldType: 'text', documentType: 'contact' },
  { label: 'Client Start Date', value: 'client_start_date', fieldType: 'date', documentType: 'contact' },
  { label: 'Onboarding Date', value: 'onboarding_date', fieldType: 'date', documentType: 'contact' },
  { label: 'Relationship Start Date', value: 'relationship_start_date', fieldType: 'date', documentType: 'contact' },
  { label: 'Account Open Date', value: 'account_open_date', fieldType: 'date', documentType: 'contact' },
  { label: 'Client Since Date', value: 'client_since_date', fieldType: 'date', documentType: 'contact' },
  { label: 'Referral Source', value: 'referral_source', fieldType: 'text', documentType: 'contact' },
  { label: 'Lead Source', value: 'lead_source', fieldType: 'select', documentType: 'contact' },
  { label: 'How Did You Hear', value: 'how_did_you_hear', fieldType: 'text', documentType: 'contact' },
  { label: 'Marketing Source', value: 'marketing_source', fieldType: 'select', documentType: 'contact' },
  { label: 'Client Source', value: 'client_source', fieldType: 'text', documentType: 'contact' },
  { label: 'Tier Level', value: 'tier_level', fieldType: 'select', documentType: 'contact' },
  { label: 'Client Segment', value: 'client_segment', fieldType: 'select', documentType: 'contact' },
  { label: 'Investment Profile', value: 'investment_profile', fieldType: 'select', documentType: 'contact' },
  { label: 'Risk Tolerance', value: 'risk_tolerance', fieldType: 'select', documentType: 'contact' },
];

// Mock sections with empty mappings (no pre-selected values)
const mockWealthboxSections: MappingSection[] = [
  {
    title: 'Client Status & Relationships',
    description: 'Map client status and relationship fields',
    mappings: [
      {
        sourceField: 'activeClient',
        sourceLabel: (
          <>
            <strong>Active Clients</strong>
            <br />
            Which field indicates an Active Client of the firm?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'prospectiveClient',
        sourceLabel: (
          <>
            <strong>Prospects</strong>
            <br />
            Which field indicates a Prospective Client of the firm?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'lostClient',
        sourceLabel: (
          <>
            <strong>Past Clients</strong>
            <br />
            Which field indicates a Lost Client of the firm?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'deceasedClient',
        sourceLabel: (
          <>
            <strong>Deceased Clients</strong>
            <br />
            Which field indicates a Deceased Client of the firm?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'leadAdvisor',
        sourceLabel: (
          <>
            <strong>Primary Advisor</strong>
            <br />
            Which field indicates the Lead Advisor for a client?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'inceptionDate',
        sourceLabel: (
          <>
            <strong>Client Inception</strong>
            <br />
            Which field indicates the Inception Date for your clients?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'referralSource',
        sourceLabel: (
          <>
            <strong>Referral Source</strong>
            <br />
            Which field indicates the Referral Source for your clients?
          </>
        ),
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
    ],
  },
];

// Mock segmentation sections
const mockSegmentationSections: MappingSection[] = [
  {
    title: 'Client Segmentation Definitions',
    description: 'Define your client tiers and map them to segmentation attributes',
    mappings: [
      {
        sourceField: 'topTier',
        sourceLabel: 'What indicates a top tier client?',
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'secondTier',
        sourceLabel: 'What indicates a second tier client?',
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
      {
        sourceField: 'thirdTier',
        sourceLabel: 'What indicates a third tier client?',
        targetField: '',
        targetOptions: mockWealthboxFields,
      },
    ],
  },
];

interface WealthboxMappingProps {
  accessToken?: string;
}

const WealthboxMapping: React.FC<WealthboxMappingProps> = ({ accessToken = '' }) => {
  const { toast } = useToast();
  const { useMock } = useMockData();
  const [wealthboxToken, setWealthboxToken] = useState<string>(accessToken);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  const { isLoading, hasError, getOptions, searchOptions } = useWealthboxFields();

  // Fetch the Wealthbox token when the component mounts (only if not using mock data)
useEffect(() => {
  const fetchWealthboxToken = async () => {
    if (useMock) {
      // Skip token fetching for mock data
      setTokenLoading(false);
      setTokenError(false);
      return;
    }
    
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
}, [useMock]);
  
  
  // Callback to search for field options as user types
  const handleFieldSearch = useCallback(
    async (searchTerm: string): Promise<FieldOption[]> => {
      if (useMock) {
        // Filter mock fields based on search term
        return mockWealthboxFields.filter(field => 
          field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return searchOptions(searchTerm);
    },
    [searchOptions, useMock]
  );

  // Helper function to get field info for display
  const getFieldInfo = useCallback((fieldValue: string): { field: FieldOption | null; isNested: boolean; parentField?: FieldOption } => {
    if (useMock) {
      // Use mock data for field info
      const field = mockWealthboxFields.find(option => option.value === fieldValue);
      return { field: field || null, isNested: false };
    }
    
    const allOptions = getOptions('all');
    
    // First check if it's a direct field
    const directField = allOptions.find(option => option.value === fieldValue);
    if (directField) {
      return { field: directField, isNested: false };
    }
    
    // Check if it's a nested option
    for (const option of allOptions) {
      if (fieldHasOptions(option)) {
        const nestedOption = option.options!.find(nested => nested.value === fieldValue);
        if (nestedOption) {
          return { field: nestedOption, isNested: true, parentField: option };
        }
      }
    }
    
    return { field: null, isNested: false };
  }, [getOptions, useMock]);
  
  const [sections, setSections] = useState<MappingSection[]>(
    useMock ? mockWealthboxSections : [
    {
      title: 'Client Status & Relationships',
      description: 'Map client status and relationship fields',
      mappings: [
        {
          sourceField: 'activeClient',
          sourceLabel: (
            <>
              <strong>Active Clients</strong>
              <br />
              Which field indicates an Active Client of the firm?
            </>
          ),
          targetField: 'status_active',
          targetOptions: [
            { label: 'Contact Type: Active Client', value: 'status_active' },
            { label: 'Client Status: Active', value: 'client_status' },
            { label: 'Active Flag: Yes', value: 'active_flag' },
            { label: 'Current Client: True', value: 'current_client' },
          ],
        },
        {
          sourceField: 'prospectiveClient',
          sourceLabel: (
            <>
              <strong>Prospects</strong>
              <br />
              Which field indicates a Prospective Client of the firm?
            </>
          ),
          targetField: 'status_prospect',
          targetOptions: [
            { label: 'Contact Type: Prospect', value: 'status_prospect' },
            { label: 'Prospect Flag: Yes', value: 'prospect_flag' },
            { label: 'Lead Status: Qualified', value: 'lead_status' },
            { label: 'Potential Client: True', value: 'potential_client' },
          ],
        },
        {
          sourceField: 'lostClient',
          sourceLabel: (
            <>
              <strong>Past Clients</strong>
              <br />
              Which field indicates a Lost Client of the firm?
            </>
          ),
          targetField: 'status_lost',
          targetOptions: [
            { label: 'Contact Type: Former Client', value: 'status_lost' },
            { label: 'Former Client: True', value: 'former_client' },
            { label: 'Status: Terminated', value: 'terminated' },
            { label: 'Inactive Status: Lost', value: 'inactive_status' },
          ],
        },
        {
          sourceField: 'deceasedClient',
          sourceLabel: (
            <>
              <strong>Deceased Clients</strong>
              <br />
              Which field indicates a Deceased Client of the firm?
            </>
          ),
          targetField: 'status_deceased',
          targetOptions: [
            { label: 'Contact Type: Deceased', value: 'status_deceased' },
            { label: 'Deceased Flag: Yes', value: 'deceased_flag' },
            { label: 'Death Date: Present', value: 'death_date' },
            { label: 'Deceased Status: True', value: 'deceased_status' },
          ],
        },
        {
          sourceField: 'leadAdvisor',
          sourceLabel: (
            <>
              <strong>Primary Advisor</strong>
              <br />
              Which field indicates the Lead Advisor for a client?
            </>
          ),
          targetField: 'primary_advisor',
          targetOptions: [
            { label: 'Primary Advisor: Name', value: 'primary_advisor' },
            { label: 'Lead Advisor: Assigned', value: 'lead_advisor' },
            { label: 'Financial Advisor: Primary', value: 'financial_advisor' },
            { label: 'Relationship Manager: Lead', value: 'relationship_manager' },
          ],
        },
        {
          sourceField: 'inceptionDate',
          sourceLabel: (
            <>
              <strong>Client Inception</strong>
              <br />
              Which field indicates the Inception Date for your clients?
            </>
          ),
          targetField: 'client_inception_date',
          targetOptions: [
            { label: 'Start Date: Client', value: 'client_inception_date' },
            { label: 'Onboarding Date: Initial', value: 'onboarding_date' },
            { label: 'Relationship Start: Date', value: 'relationship_start' },
            { label: 'Account Open Date: First', value: 'account_open_date' },
            { label: 'Client Since: Date', value: 'client_since' },
          ],
        },
        {
          sourceField: 'referralSource',
          sourceLabel: (
            <>
              <strong>Referral Source</strong>
              <br />
              Which field indicates the Referral Source for your clients?
            </>
          ),
          targetField: 'referral_source',
          targetOptions: [
            { label: 'Referral Source: Primary', value: 'referral_source' },
            { label: 'Lead Source: Original', value: 'lead_source' },
            { label: 'How Did You Hear: Field', value: 'how_did_you_hear' },
            { label: 'Marketing Source: Channel', value: 'marketing_source' },
            { label: 'Client Source: Referrer', value: 'client_source' },
          ],
        },
      ],
    },
  ]);

  // Add client segmentation section
  const [segmentationSections, setSegmentationSections] = useState<MappingSection[]>(
    useMock ? mockSegmentationSections : [
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
      
      if (response.data.success && response.data.mappings && response.data.mappings.length > 0) {
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
    if (useMock) {
      // For mock data, sections are already initialized with mock fields
      // Just load saved mappings
      loadSavedMappings();
    } else if (!isLoading && !hasError && wealthboxToken) {
      const allOptions = getOptions('all');
      
      if(allOptions.length > 0) {
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
    }
  }, [isLoading, hasError, wealthboxToken, getOptions, loadSavedMappings, useMock]);
  
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
    const allOptions = useMock ? mockWealthboxFields : getOptions('all');
    
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

        // Redirect back to settings page with data-mapping tab
        setTimeout(() => {
          window.history.pushState({}, "", "/settings?tab=data-mapping");
          window.dispatchEvent(new Event('popstate'));
        }, 1000); // Small delay to let user see the success toast
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

  // Enhanced field info display component
  const FieldInfoDisplay: React.FC<{ fieldValue: string }> = ({ fieldValue }) => {
    if (!fieldValue) return null;
    
    const { field, isNested, parentField } = getFieldInfo(fieldValue);
    
    if (!field) return null;
    
    return (
      <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <div>
            {isNested && parentField && (
              <div className="text-muted-foreground">
                From field: <span className="font-medium">{parentField.label}</span>
              </div>
            )}
            <div className="font-medium">{field.label}</div>
            {field.fieldType && !isNested && (
              <div className="text-xs text-muted-foreground">
                {field.fieldType} • {field.documentType}
                {fieldHasOptions(field) && (
                  <span className="ml-2">• {field.options!.length} options available</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
              <div key={mapping.sourceField}>
                <FieldMappingRow
                  mapping={mapping}
                  onMappingChange={(sourceField, targetField) => 
                    handleSegmentationMappingChange(0, sourceField, targetField)
                  }
                  sourceSystem="Firm"
                  targetSystem="Segmentation Engine"
                />
                <FieldInfoDisplay fieldValue={mapping.targetField} />
              </div>
            ))}
            <div className="border-t border-border p-4">
              <Button 
                variant="outline" 
                onClick={handleAddTier} 
                className="w-full"
                disabled={useMock ? false : (isLoading || hasError || tokenError)}
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

  if (tokenError && !useMock) {
    return (
      <div className="animate-fade-in">
        <PageHeader 
          title="Wealthbox Integration"
          description="Map your firm's data fields to corresponding Wealthbox CRM fields"
          backLink="/settings"
          onBack={() => {
            window.history.pushState({}, "", "/settings?tab=data-mapping");
            window.dispatchEvent(new Event('popstate'));
          }}
        />
        
        <div className="mapping-container">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to retrieve your Wealthbox authentication token. Please make sure you have connected your Wealthbox account using the Connect Wealthbox button.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => {
              window.history.pushState({}, "", "/settings?tab=data-mapping");
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
    <div className="animate-fade-in">
      <PageHeader 
        title="Wealthbox Integration"
        description="Map your firm's data fields to corresponding Wealthbox CRM fields"
        backLink="/settings"
        onBack={() => {
          window.history.pushState({}, "", "/settings?tab=data-mapping");
          window.dispatchEvent(new Event('popstate'));
        }}
      />

      <div className="mapping-container">
        {(useMock ? false : (isLoading || tokenLoading)) ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Wealthbox field options...</p>
          </div>
        ) : (useMock ? false : hasError) ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Wealthbox field options. Please try again later or check your connection.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Info banner about field types */}
            {/* <div className="max-w-5xl mx-auto px-4">  
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Fields with dropdown options can be expanded to select specific values. Field types and available options are shown below each selection.
              </AlertDescription>
            </Alert>
            </div> */}

            {sections.map((section, index) => (
              <FieldMappingCard
                key={index}
                title={section.title}
                description={section.description}
                mappings={section.mappings}
                onMappingChange={(sourceField, targetField) => 
                  handleMappingChange(index, sourceField, targetField)
                }
                sourceSystem="Vitals"
                targetSystem="Wealthbox"
              />
            ))}
            
            {/* <h2 className="text-2xl font-semibold mt-8 mb-4">Client Segmentation</h2>
            <p className="text-muted-foreground mb-6">Configure client segmentation settings for Wealthbox integration</p>
            
            {renderDefinitionsSection()} */}
            
            <div className="max-w-5xl mx-auto px-4 mt-6">
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