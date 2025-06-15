import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import FieldMappingCard from "../mapping/FieldMappingCard";
import { FieldMapping, MappingSection } from "@/types/mapping";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { exchangeWealthboxOAuthCode, importWealthboxData, exchangeOrionOAuthCode, syncOrionClients } from "@/lib/api";
import { getOAuthUrl } from "@/config/integrations";

// Import the image assets directly
// These paths assume the images are in the /public folder
const vitalsIcon = "/public/images/vitals.png";
const wealthboxIcon = "/public/images/wealthbox.png";
const orionIcon = "/public/images/orion.png";

interface IntegrationConfig {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  showConnect: boolean;
  connectText?: string;
  oauthUrl?: string;
  mappingSections: MappingSection[];
}

// Sample mapping data - in a real app, this would come from an API
const getIntegrationConfig = (integrationType: string): IntegrationConfig | null => {
  const configs: Record<string, IntegrationConfig> = {
    vitals: {
      name: "Vitals AI Inputs",
      description: "Configure Vital inputs to your practice KPIs",
      icon: <img src={vitalsIcon} alt="Vitals AI" className="w-8 h-8 object-contain" />,
      color: "bg-blue-50",
      showConnect: false,
      mappingSections: [
        {
          title: "Client Demographics",
          description: "Map basic client information fields",
          mappings: [
            {
              sourceField: "client_name",
              sourceLabel: "Client Full Name",
              targetField: "",
              targetOptions: [
                { label: "Primary Contact Name", value: "primary_name" },
                { label: "Account Holder", value: "account_holder" },
                { label: "Display Name", value: "display_name" }
              ]
            },
            {
              sourceField: "client_email",
              sourceLabel: "Email Address",
              targetField: "",
              targetOptions: [
                { label: "Primary Email", value: "primary_email" },
                { label: "Contact Email", value: "contact_email" },
                { label: "Billing Email", value: "billing_email" }
              ]
            }
          ]
        },
        {
          title: "Financial Metrics",
          description: "Map portfolio and financial data",
          mappings: [
            {
              sourceField: "portfolio_value",
              sourceLabel: "Total Portfolio Value",
              targetField: "",
              customInput: true,
              inputType: "currency",
              targetOptions: []
            },
            {
              sourceField: "annual_income",
              sourceLabel: "Annual Income",
              targetField: "",
              customInput: true,
              inputType: "currency",
              targetOptions: []
            }
          ]
        }
      ]
    },
    wealthbox: {
      name: "Wealthbox",
      description: "Integration and map your data from Wealthbox",
      icon: <img src={wealthboxIcon} alt="Wealthbox" className="w-8 h-8 object-contain" />,
      color: "bg-blue-50",
      showConnect: true,
      connectText: "Connect Wealthbox",
      oauthUrl: getOAuthUrl("wealthbox"),
      mappingSections: [
        {
          title: "Contact Information",
          description: "Map contact details to Wealthbox fields",
          mappings: [
            {
              sourceField: "first_name",
              sourceLabel: "First Name",
              targetField: "",
              targetOptions: [
                { label: "Contact First Name", value: "wealthbox_first_name" },
                { label: "Primary Contact", value: "wealthbox_primary" }
              ]
            },
            {
              sourceField: "last_name",
              sourceLabel: "Last Name",
              targetField: "",
              targetOptions: [
                { label: "Contact Last Name", value: "wealthbox_last_name" },
                { label: "Family Name", value: "wealthbox_family_name" }
              ]
            }
          ]
        },
        {
          title: "Account Details",
          description: "Map account information to Wealthbox",
          mappings: [
            {
              sourceField: "account_number",
              sourceLabel: "Account Number",
              targetField: "",
              targetOptions: [
                { label: "Wealthbox Account ID", value: "wealthbox_account_id" },
                { label: "External Account Number", value: "wealthbox_external_id" }
              ]
            }
          ]
        }
      ]
    },
    orion: {
      name: "Orion",
      description: "Integration and map your data from Orion",
      icon: <img src={orionIcon} alt="Orion" className="w-8 h-8 object-contain" />,
      color: "bg-violet-50",
      showConnect: true,
      connectText: "Connect Orion",
      oauthUrl: getOAuthUrl("orion"),
      mappingSections: [
        {
          title: "Portfolio Holdings",
          description: "Map investment holdings to Orion",
          mappings: [
            {
              sourceField: "symbol",
              sourceLabel: "Security Symbol",
              targetField: "",
              targetOptions: [
                { label: "Orion Security Symbol", value: "orion_symbol" },
                { label: "CUSIP", value: "orion_cusip" },
                { label: "Ticker", value: "orion_ticker" }
              ]
            },
            {
              sourceField: "quantity",
              sourceLabel: "Share Quantity",
              targetField: "",
              customInput: true,
              inputType: "number",
              targetOptions: []
            }
          ]
        },
        {
          title: "Performance Metrics",
          description: "Map performance data to Orion",
          mappings: [
            {
              sourceField: "return_ytd",
              sourceLabel: "Year-to-Date Return",
              targetField: "",
              customInput: true,
              inputType: "currency",
              targetOptions: []
            }
          ]
        }
      ]
    }
  };
  
  return configs[integrationType] || null;
};

interface DataMappingSectionProps {
  activeMapping: string | null;
  onSetActiveMapping: (mapping: string) => void;
}

const DataMappingSection: React.FC<DataMappingSectionProps> = ({
  activeMapping,
  onSetActiveMapping,
}) => {
  const [currentConfig, setCurrentConfig] = useState<IntegrationConfig | null>(null);
  const [mappingData, setMappingData] = useState<Record<string, string>>({});
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Import WealthBox data mutation
  const importMutation = useMutation({
    mutationFn: () => importWealthboxData(),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Data imported successfully",
          description: `Imported ${data.contacts?.imported || 0} contacts successfully.`,
        });
      } else {
        toast({
          title: "Import partially failed",
          description: data.message || "Some data could not be imported.",
          variant: "destructive",
        });
      }
      setIsImporting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "There was a problem importing your WealthBox data.",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  // Sync Orion data mutation
  const orionSyncMutation = useMutation({
    mutationFn: () => syncOrionClients(),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Orion sync started successfully",
          description: "Your Orion data sync has been initiated.",
        });
      } else {
        toast({
          title: "Sync initiation failed",
          description: data.message || "Failed to start Orion data sync.",
          variant: "destructive",
        });
      }
      setIsImporting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "There was a problem starting your Orion data sync.",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        toast({
          title: "OAuth Error",
          description: `OAuth authorization failed: ${error}`,
          variant: "destructive",
        });
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (code) {
        try {
          // Determine which integration based on state parameter or URL pattern
          const isOrionOAuth = state === 'Login' || window.location.href.includes('state=Login');
          
          if (isOrionOAuth) {
            // Handle Orion OAuth
            const tokenResponse = await exchangeOrionOAuthCode(code);
            
            if (tokenResponse.success) {
              toast({
                title: "Successfully Connected",
                description: "Your Orion account has been connected successfully.",
              });

              // Trigger Orion data sync automatically
              setIsImporting(true);
              orionSyncMutation.mutate();
            } else {
              toast({
                title: "Connection Failed",
                description: "Failed to complete Orion OAuth connection.",
                variant: "destructive",
              });
            }
          } else {
            // Handle Wealthbox OAuth (existing logic)
            const tokenResponse = await exchangeWealthboxOAuthCode(code);
            
            if (tokenResponse.success) {
              toast({
                title: "Successfully Connected",
                description: "Your Wealthbox account has been connected successfully.",
              });

              // Trigger data import automatically
              setIsImporting(true);
              importMutation.mutate();
            } else {
              toast({
                title: "Connection Failed",
                description: "Failed to complete OAuth connection.",
                variant: "destructive",
              });
            }
          }
        } catch (error: any) {
          const integrationName = (window.location.href.includes('state=Login')) ? 'Orion' : 'Wealthbox';
          toast({
            title: "Connection Error",
            description: error.message || `Failed to exchange ${integrationName} authorization code.`,
            variant: "destructive",
          });
        }
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, [toast, importMutation, orionSyncMutation]);

  useEffect(() => {
    if (activeMapping) {
      const config = getIntegrationConfig(activeMapping);
      setCurrentConfig(config);
    } else {
      setCurrentConfig(null);
    }
  }, [activeMapping]);

  const handleMappingChange = (sourceField: string, targetField: string) => {
    setMappingData(prev => ({
      ...prev,
      [sourceField]: targetField
    }));
  };

  const handleInputChange = (sourceField: string, value: string) => {
    setInputData(prev => ({
      ...prev,
      [sourceField]: value
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleBackToIntegrations = () => {
    onSetActiveMapping('');
  };

  const handleCardClick = (integrationKey: string, showConnect: boolean, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (showConnect) {
      // For connect integrations, toggle expansion
      if (expandedIntegration === integrationKey) {
        setExpandedIntegration(null);
      } else {
        setExpandedIntegration(integrationKey);
      }
    } else {
      // For non-connect integrations, navigate directly to mapping
      onSetActiveMapping(integrationKey);
    }
  };

  const handleConnectClick = (oauthUrl: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
      try {
        // Use the same OAuth URL as in settings.tsx
        window.location.href = oauthUrl;
      } catch (error) {
        // You would need to add toast functionality here if needed
        console.error("An error occurred while setting up WealthBox OAuth:", error);
        toast({
          title: "Error",
          description: "An error occurred while setting up WealthBox OAuth. Please try again later.",
          variant: "destructive"
        });
      }
  };

  const handleDataMappingClick = (integrationKey: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSetActiveMapping(integrationKey);
  };

  // Show integration selection if no active mapping
  if (!activeMapping || !currentConfig) {
    const integrations = [
      {
        name: "Vitals AI Inputs",
        description: "Configure Vital inputs to your practice KPIs",
        icon: <img src={vitalsIcon} alt="Vitals AI" className="w-8 h-8 object-contain" />,
        color: "bg-blue-50",
        key: "vitals",
        showConnect: false
      },
      {
        name: "Wealthbox",
        description: "Integration and map your data from Wealthbox",
        icon: <img src={wealthboxIcon} alt="Wealthbox" className="w-8 h-8 object-contain" />,
        color: "bg-blue-50",
        key: "wealthbox",
        showConnect: true,
        connectText: "Connect Wealthbox",
        oauthUrl: getOAuthUrl("wealthbox")
      },
      {
        name: "Orion",
        description: "Integration and map your data from Orion",
        icon: <img src={orionIcon} alt="Orion" className="w-8 h-8 object-contain" />,
        color: "bg-violet-50",
        key: "orion",
        showConnect: true,
        connectText: "Connect Orion",
        oauthUrl: getOAuthUrl("orion")
      }
    ];

    return (
      <div className="animate-fade-in">
        <PageHeader 
          title="Integration Settings"
          description="Connect to integration partners and configure data mapping from your firm's data"
        />

        <div className="max-w-3xl mx-auto grid gap-6 md:grid-cols-1">
          {integrations.map((integration) => (
            <div key={integration.key}>
              <Card className="p-6 h-full transition-all duration-300 hover:shadow-md border border-border">
                <div 
                  className="flex items-start cursor-pointer"
                  onClick={(e) => handleCardClick(integration.key, integration.showConnect, e)}
                >
                  <div className={`${integration.color} p-3 rounded-lg mr-4`}>
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{integration.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{integration.description}</p>
                  </div>
                  <div className="ml-4 text-muted-foreground">
                    <ArrowRight className={`w-5 h-5 transition-transform ${
                      integration.showConnect && expandedIntegration === integration.key ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>
                
                {integration.showConnect && expandedIntegration === integration.key && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Access client account information from {integration.name} in Vitals AI.
                    </p>
                    {isImporting && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                          <span className="text-sm text-blue-800">Importing data from {integration.name}...</span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button
                        onClick={(e) => handleConnectClick(integration.oauthUrl!, e)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isImporting}
                      >
                        {integration.connectText}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={(e) => handleDataMappingClick(integration.key, e)}
                        disabled={isImporting}
                      >
                        Data Mapping
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show the field mapping interface
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title={`${currentConfig.name} - Data Mapping`}
        description={currentConfig.description}
        backLink="/settings"
        onBack={handleBackToIntegrations}
      />

      <div className="mapping-container">
        {/* Save Button Header */}
        <div className="flex justify-end mb-6">
          <Button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2"
          >
            {saveStatus === 'saving' && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
            {saveStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
            {saveStatus === 'idle' && <Save className="w-4 h-4" />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Mapping'}
          </Button>
        </div>

        {/* Mapping Cards */}
        <div className="space-y-6">
          {currentConfig.mappingSections.map((section, index) => {
            // Update mappings with current values
            const updatedMappings = section.mappings.map(mapping => ({
              ...mapping,
              targetField: mapping.customInput 
                ? (inputData[mapping.sourceField] || mapping.targetField)
                : (mappingData[mapping.sourceField] || mapping.targetField)
            }));

            return (
              <FieldMappingCard
                key={index}
                title={section.title}
                description={section.description}
                mappings={updatedMappings}
                onMappingChange={handleMappingChange}
                onInputChange={handleInputChange}
                sourceSystem="Your System"
                targetSystem={currentConfig.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DataMappingSection;
