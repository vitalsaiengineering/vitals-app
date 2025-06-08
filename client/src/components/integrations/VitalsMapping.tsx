import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FieldMappingCard from '@/components/mapping/FieldMappingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MappingSection } from '@/types/mapping';
import { SaveIcon, Plus, Trash2, Search } from 'lucide-react';

interface SegmentThreshold {
  id: string;
  name: string;
  crmField: string;
  minAUM: string;
  maxAUM: string;
}

const VitalsMapping: React.FC = () => {
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
        {
          sourceField: 'clientEmail',
          sourceLabel: 'Client E-Mail',
          targetField: '10_minutes',
          targetOptions: [
            { label: '60 minutes', value: '60_minutes' },
            { label: '45 minutes', value: '45_minutes' },
            { label: '30 minutes', value: '30_minutes' },
            { label: '15 minutes', value: '15_minutes' },
            { label: '10 minutes', value: '10_minutes' },
            { label: '5 minutes', value: '5_minutes' },
          ],
        },
      ],
    },
  ]);

  // Segment thresholds - now empty by default
  const [segments, setSegments] = useState<SegmentThreshold[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSegment, setNewSegment] = useState<SegmentThreshold>({
    id: '',
    name: '',
    crmField: '',
    minAUM: '',
    maxAUM: '',
  });

  // Combined CRM field options from both Orion and Wealthbox
  const segmentFieldOptions = [
    // Wealthbox fields
    { label: 'Client Tier: Level', value: 'client_tier', source: 'Wealthbox' },
    { label: 'Segmentation: Category', value: 'segmentation', source: 'Wealthbox' },
    { label: 'Client Category: Type', value: 'client_category', source: 'Wealthbox' },
    { label: 'Client Class: Tier', value: 'client_class', source: 'Wealthbox' },
    { label: 'Portfolio Type: Classification', value: 'portfolio_type', source: 'Wealthbox' },
    { label: 'Service Level: Tier', value: 'service_level', source: 'Wealthbox' },
    { label: 'Client Value: Ranking', value: 'client_value', source: 'Wealthbox' },
    // Orion fields
    { label: 'Investment Strategy: Primary', value: 'investment_strategy', source: 'Orion' },
    { label: 'Strategy Type: Classification', value: 'strategy_type', source: 'Orion' },
    { label: 'Portfolio Strategy: Method', value: 'portfolio_strategy', source: 'Orion' },
    { label: 'Platform: Custodian', value: 'platform', source: 'Orion' },
    { label: 'Custodian: Institution', value: 'custodian', source: 'Orion' },
    { label: 'Broker: Platform', value: 'broker', source: 'Orion' },
    { label: 'Partnerships: Business', value: 'partnerships', source: 'Orion' },
    { label: 'Business Partners: Entities', value: 'business_partners', source: 'Orion' },
    { label: 'Partner Firms: Collaborators', value: 'partner_firms', source: 'Orion' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // State for main segmentation field
  const [segmentationField, setSegmentationField] = useState('');
  const [segmentationSearchTerm, setSegmentationSearchTerm] = useState('');
  const [isSegmentationSearchFocused, setIsSegmentationSearchFocused] = useState(false);

  const [additionalNotes, setAdditionalNotes] = useState('');

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

  const formatCurrencyInput = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format with commas
    const number = parseInt(numericValue);
    return `$${number.toLocaleString()}`;
  };

  const parseCurrencyToNumber = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue) : 0;
  };

  const handleAddSegment = () => {
    setShowAddForm(true);
    
    // Calculate the next segment number and minimum AUM
    const nextSegmentNumber = segments.length + 1;
    let newMinAUM = '$0';
    
    if (segments.length > 0) {
      // Find the highest maximum AUM from existing segments
      const maxAUMs = segments.map(segment => {
        if (segment.maxAUM === 'No limit') return 0;
        return parseCurrencyToNumber(segment.maxAUM);
      });
      const highestMaxAUM = Math.max(...maxAUMs);
      newMinAUM = `$${(highestMaxAUM + 1).toLocaleString()}`;
    }
    
    setNewSegment({
      id: '',
      name: `Segment ${nextSegmentNumber}`,
      crmField: '',
      minAUM: newMinAUM,
      maxAUM: '',
    });
  };

  const handleSaveSegment = () => {
    if (newSegment.name && newSegment.crmField && newSegment.minAUM && newSegment.maxAUM) {
      const segment = {
        ...newSegment,
        id: Date.now().toString(),
      };
      setSegments([...segments, segment]);
      setShowAddForm(false);
      setNewSegment({
        id: '',
        name: '',
        crmField: '',
        minAUM: '',
        maxAUM: '',
      });
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewSegment({
      id: '',
      name: '',
      crmField: '',
      minAUM: '',
      maxAUM: '',
    });
  };

  const handleRemoveSegment = (id: string) => {
    setSegments(segments.filter(segment => segment.id !== id));
  };

  const handleSegmentChange = (id: string, field: keyof SegmentThreshold, value: string) => {
    let formattedValue = value;
    
    // Format currency fields
    if (field === 'minAUM' || field === 'maxAUM') {
      formattedValue = formatCurrencyInput(value);
    }
    
    setSegments(segments.map(segment => 
      segment.id === id ? { ...segment, [field]: formattedValue } : segment
    ));
  };

  const handleNewSegmentChange = (field: keyof SegmentThreshold, value: string) => {
    let formattedValue = value;
    
    // Format currency fields
    if (field === 'minAUM' || field === 'maxAUM') {
      formattedValue = formatCurrencyInput(value);
    }
    
    setNewSegment(prev => ({ ...prev, [field]: formattedValue }));
  };

  const filteredSegmentOptions = segmentFieldOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSegmentationOptions = segmentFieldOptions.filter(option =>
    option.label.toLowerCase().includes(segmentationSearchTerm.toLowerCase())
  );

  const handleSelectSegmentOption = (option: any) => {
    handleNewSegmentChange('crmField', option.value);
    setSearchTerm(option.label);
    setIsSearchFocused(false);
  };

  const handleSelectSegmentationOption = (option: any) => {
    setSegmentationField(option.value);
    setSegmentationSearchTerm(option.label);
    setIsSegmentationSearchFocused(false);
  };

  const formatCurrency = (value: string) => {
    if (value === 'No limit') return '∞';
    const num = parseInt(value.replace(/,/g, ''));
    return `$${num.toLocaleString()}`;
  };

  // Sort segments by maximum AUM in descending order (largest at top)
  const sortedSegments = [...segments].sort((a, b) => {
    const aMax = a.maxAUM === 'No limit' ? Infinity : parseCurrencyToNumber(a.maxAUM);
    const bMax = b.maxAUM === 'No limit' ? Infinity : parseCurrencyToNumber(b.maxAUM);
    return bMax - aMax;
  });

  const handleSave = () => {
    console.log('Saving Vitals mapping:', sections);
    console.log('Saving segment thresholds:', segments);
    console.log('Saving segmentation field:', segmentationField);
    console.log('Additional notes:', additionalNotes);
    
    toast({
      title: "Mapping saved",
      description: "Your Vitals field mapping has been saved successfully.",
    });
  };

  // Get selected option label for display
  const selectedSegmentOption = segmentFieldOptions.find(opt => opt.value === newSegment.crmField);
  const displayValue = selectedSegmentOption ? selectedSegmentOption.label : '';

  const selectedSegmentationOption = segmentFieldOptions.find(opt => opt.value === segmentationField);
  const segmentationDisplayValue = selectedSegmentationOption ? selectedSegmentationOption.label : '';

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Vitals AI Inputs"
        description="Configure your Vitals AI inputs for your practice reporting"
        backLink="/settings"
        onBack={() => {
          window.history.pushState({}, "", "/settings?tab=data-mapping");
          window.dispatchEvent(new Event('popstate'));
        }}
      />

      <div className="mapping-container">
        {/* Firm Practice Data Card */}
        <FieldMappingCard
          title={sections[0].title}
          description={sections[0].description}
          mappings={sections[0].mappings}
          onMappingChange={(sourceField, targetField) => 
            handleMappingChange(0, sourceField, targetField)
          }
          onInputChange={(sourceField, value) => 
            handleInputChange(0, sourceField, value)
          }
          sourceSystem="Firm"
          targetSystem="Vitals"
        />

        {/* Segmentation Card with matching header style */}
        <Card className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-visible mb-6">
          <CardHeader style={{ backgroundColor: '#001027' }} className="text-white px-8 py-6 rounded-t-2xl">
            <CardTitle className="text-xl font-semibold">Segmentation</CardTitle>
            <CardDescription className="text-slate-300 text-base mt-2 leading-relaxed">
              Define numerical thresholds for client segmentation based on AUM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {/* Client Segmentation Question */}
            <div className="mb-6">
              <label className="text-base font-medium mb-3 block text-slate-900 leading-relaxed">Which field indicates client segmentation for your clients?</label>
              <div className={`relative transition-all duration-200 ${isSegmentationSearchFocused ? 'w-full' : 'w-full'}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={isSegmentationSearchFocused ? segmentationSearchTerm : segmentationDisplayValue}
                    onChange={(e) => setSegmentationSearchTerm(e.target.value)}
                    onFocus={() => {
                      setIsSegmentationSearchFocused(true);
                      setSegmentationSearchTerm('');
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsSegmentationSearchFocused(false), 200);
                    }}
                    className={`pl-10 transition-all duration-200 text-base h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                      isSegmentationSearchFocused 
                        ? 'w-full min-w-[500px] shadow-md' 
                        : 'w-full'
                    }`}
                    placeholder="Search Orion and Wealthbox fields..."
                  />
                </div>
                
                {isSegmentationSearchFocused && (
                  <div className="absolute z-[9999] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto min-w-[500px] left-0 right-0">
                    {filteredSegmentationOptions.length > 0 ? (
                      filteredSegmentationOptions.map((option) => (
                        <div
                          key={option.value}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelectSegmentationOption(option)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                              ({option.source})
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No fields found matching "{segmentationSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Configure numerical thresholds below to define how you segment your clients based on Assets Under Management (AUM).
              </p>
            </div>

            <div className="flex justify-center mb-4">
              <Button onClick={handleAddSegment} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Segment
              </Button>
            </div>

            {segments.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No segments configured yet.</p>
                <p className="text-sm mb-4">Click "Add Segment" to define your client segmentation thresholds.</p>
              </div>
            )}

            {/* Add Segment Form */}
            {showAddForm && (
              <div className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                <div className="col-span-3">
                  <label className="text-sm font-medium mb-1 block">Segment Name</label>
                  <Input
                    value={newSegment.name}
                    onChange={(e) => handleNewSegmentChange('name', e.target.value)}
                    placeholder="e.g., Premium Tier"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-sm font-medium mb-1 block">Search CRM Segment Field</label>
                  <div className={`relative transition-all duration-200 ${isSearchFocused ? 'w-full' : 'w-full'}`}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={isSearchFocused ? searchTerm : displayValue}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => {
                          setIsSearchFocused(true);
                          setSearchTerm('');
                        }}
                        onBlur={() => {
                          setTimeout(() => setIsSearchFocused(false), 200);
                        }}
                        className={`pl-10 transition-all duration-200 ${
                          isSearchFocused 
                            ? 'w-full min-w-[400px] shadow-md ring-2 ring-blue-500/20' 
                            : 'w-full'
                        }`}
                        placeholder="Search Orion and Wealthbox fields..."
                      />
                    </div>
                    
                    {isSearchFocused && (
                      <div className="absolute z-[9999] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto min-w-[400px] left-0 right-0">
                        {filteredSegmentOptions.length > 0 ? (
                          filteredSegmentOptions.map((option) => (
                            <div
                              key={option.value}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleSelectSegmentOption(option)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{option.label}</span>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                                  ({option.source})
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No fields found matching "{searchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Minimum AUM</label>
                  <Input
                    value={newSegment.minAUM}
                    onChange={(e) => handleNewSegmentChange('minAUM', e.target.value)}
                    placeholder="e.g., $100,000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Maximum AUM</label>
                  <Input
                    value={newSegment.maxAUM}
                    onChange={(e) => handleNewSegmentChange('maxAUM', e.target.value)}
                    placeholder="e.g., $499,999"
                  />
                </div>
                <div className="col-span-2 flex gap-2">
                  <Button onClick={handleSaveSegment} size="sm">
                    Save
                  </Button>
                  <Button onClick={handleCancelAdd} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Segments - now sorted by AUM descending */}
            {sortedSegments.map((segment) => (
              <div key={segment.id} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                <div className="col-span-3">
                  <label className="text-sm font-medium mb-1 block">Segment Name</label>
                  <Input
                    value={segment.name}
                    onChange={(e) => handleSegmentChange(segment.id, 'name', e.target.value)}
                    placeholder="e.g., Premium Tier"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-sm font-medium mb-1 block">CRM Field</label>
                  <Input
                    value={segmentFieldOptions.find(opt => opt.value === segment.crmField)?.label || segment.crmField}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Minimum AUM</label>
                  <Input
                    value={segment.minAUM}
                    onChange={(e) => handleSegmentChange(segment.id, 'minAUM', e.target.value)}
                    placeholder="e.g., $100,000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Maximum AUM</label>
                  <Input
                    value={segment.maxAUM}
                    onChange={(e) => handleSegmentChange(segment.id, 'maxAUM', e.target.value)}
                    placeholder="e.g., $499,999"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSegment(segment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Additional Notes */}
            <div className="mt-6">
              <label className="text-base font-medium mb-3 block text-slate-900 leading-relaxed">Additional Notes</label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Describe any additional segmentation criteria, qualitative factors, or special considerations for your client classification..."
                className="min-h-[100px] text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Time Estimates Card */}
        <FieldMappingCard
          title={sections[1].title}
          description={sections[1].description}
          mappings={sections[1].mappings}
          onMappingChange={(sourceField, targetField) => 
            handleMappingChange(1, sourceField, targetField)
          }
          onInputChange={(sourceField, value) => 
            handleInputChange(1, sourceField, value)
          }
          sourceSystem="Firm"
          targetSystem="Vitals"
        />
        
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} className="px-6">
            <SaveIcon className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VitalsMapping;