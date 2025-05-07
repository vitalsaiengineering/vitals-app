import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  testWealthboxConnection,
  importWealthboxData,
  syncWealthboxData,
  getWealthboxStatus,
  setupWealthboxOAuth,
  getWealthboxToken,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Network, Plug, Building, Database } from "lucide-react";
import { useLocation } from "wouter";
import DataMappingSection from "@/components/integrations/DataMappingSection";
import WealthboxMapping from "@/components/integrations/WealthboxMapping";
import OrionMapping from "@/components/integrations/OrionMapping";
import VitalsMapping from "@/components/integrations/VitalsMapping";

export default function Settings() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [activeTab, setActiveTab] = useState("user-management");
  
  // State for data mapping
  const [location, setLocation] = useLocation();
  const [activeMapping, setActiveMapping] = useState<string | null>(null);
  
  // Parse the URL query parameters to initialize states
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    const mapping = searchParams.get('mapping');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    if (mapping) {
      setActiveMapping(mapping);
    }
  }, []);

  // Define interface for token response
  interface TokenResponse {
    token?: string;
    success?: boolean;
    message?: string;
  }

  // Get WealthBox token
  const {
    data: tokenData,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useQuery<TokenResponse>({
    queryKey: ["/api/wealthbox/token"],
    retry: false,
  });
  
  useEffect(() => {
    if (tokenData?.token) {
      setAccessToken(tokenData.token);
    }
  }, [tokenData]);

  const [connectionStatus, setConnectionStatus] = useState<
    "none" | "success" | "error"
  >("none");

  // Define interface for WealthBox status
  interface WealthboxStatus {
    connected?: boolean;
    tokenExpiry?: string;
    message?: string;
  }

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/me"],
    retry: false,
  });

  // Get WealthBox status
  const { data: wealthboxStatus, isLoading: isLoadingStatus } = useQuery<WealthboxStatus>({
    queryKey: ["/api/wealthbox/status"],
    retry: false,
  });

  // Test WealthBox connection
  const testConnectionMutation = useMutation({
    mutationFn: testWealthboxConnection,
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus("success");
        toast({
          title: "Connection successful",
          description: "Successfully connected to WealthBox API.",
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Connection failed",
          description: data.message || "Failed to connect to WealthBox API.",
          variant: "destructive",
        });
      }
      setIsConnecting(false);
    },
    onError: (error: any) => {
      setConnectionStatus("error");
      toast({
        title: "Connection error",
        description:
          error.message || "An error occurred while connecting to WealthBox.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  // Set initial connection status based on wealthboxStatus
  useEffect(() => {
    if (wealthboxStatus?.connected) {
      setConnectionStatus("success");
    }
  }, [wealthboxStatus]);

  // Import WealthBox data
  const importMutation = useMutation({
    mutationFn: (token: string) => importWealthboxData(token),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Data imported successfully",
          description: `Imported ${data.contacts.imported} contacts and ${data.activities.imported} activities.`,
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
        description:
          error.message || "There was a problem importing your WealthBox data.",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  // Sync WealthBox data
  const syncMutation = useMutation({
    mutationFn: (token: string) => syncWealthboxData(token),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Data synchronized successfully",
          description: `Updated ${data.contacts?.updated || 0} contacts and ${data.activities?.updated || 0} activities.`,
        });
      } else {
        toast({
          title: "Synchronization partially failed",
          description: data.message || "Some data could not be synchronized.",
          variant: "destructive",
        });
      }
      setIsSyncing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Synchronization failed",
        description:
          error.message ||
          "There was a problem synchronizing your WealthBox data.",
        variant: "destructive",
      });
      setIsSyncing(false);
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch("/api/wealthbox/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          settings: { sync_frequency: "daily" },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration saved",
        description: "WealthBox API configuration has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save WealthBox configuration",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "Access token required",
        description: "Please enter your WealthBox API access token.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    testConnectionMutation.mutate(accessToken);
  };

  const handleSaveConfig = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "Access token required",
        description: "Please enter your WealthBox API access token.",
        variant: "destructive",
      });
      return;
    }

    saveConfigMutation.mutate(accessToken);
  };

  const handleImport = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Access token required",
        description: "Please enter your WealthBox API access token.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    importMutation.mutate(accessToken);
  };

  const handleSync = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Access token required",
        description: "Please enter your WealthBox API access token.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    syncMutation.mutate(accessToken);
  };

  const handleOAuth = async () => {
    try {
      const authResponse = await setupWealthboxOAuth();
      if (authResponse.authUrl) {
        window.location.href = authResponse.authUrl; // Redirect to Wealthbox OAuth
      } else {
        toast({
          title: "Error",
          description: "Could not initiate OAuth process.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while setting up WealthBox OAuth.",
        variant: "destructive",
      });
    }
  };
  
  // Handle changing the active mapping type
  const handleSetActiveMapping = (mapping: string) => {
    setActiveMapping(mapping);
    
    // Update URL with the new mapping type
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'data-mapping');
    params.set('mapping', mapping);
    
    setLocation(`/settings?${params.toString()}`, {
      replace: true
    });
  };
  
  // Function to reset the active mapping
  const resetActiveMapping = () => {
    setActiveMapping(null);
  };
  
  // Listen to location changes to update state accordingly
  useEffect(() => {
    // Check if we're on the settings page with no query params or a different tab
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    const mapping = searchParams.get('mapping');
    
    // Reset active mapping if we're on the settings page without mapping query param
    if (location === '/settings' || (tab && tab !== 'data-mapping') || (tab === 'data-mapping' && !mapping)) {
      resetActiveMapping();
    }
  }, [location]);

  // Check if user is loading
  if (isLoadingUser || isLoadingStatus) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authorized
  // For now, everyone is authorized as per the original code
  const isAuthorized = true;

  const renderWealthboxIntegration = () => {
    return (
      <>
        {isAuthorized && connectionStatus === "success" && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your WealthBox API connection was successful. You can now import
              your data.
            </AlertDescription>
          </Alert>
        )}

        {isAuthorized && connectionStatus === "error" && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
            <AlertDescription className="text-red-700">
              There was a problem connecting to the WealthBox API. Please check
              your access token and try again.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center">
              <svg
                className="w-8 h-8 mr-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                ></path>
              </svg>
              <div>
                <CardTitle>WealthBox Integration</CardTitle>
                <CardDescription>
                  Connect to your WealthBox account using a Personal API Access
                  Token
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="api-token">WealthBox API Access Token</Label>
                <div className="mt-1 flex">
                  <Input
                    id="api-token"
                    type="text"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter your WealthBox API access token"
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTestConnection}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button
                      onClick={handleSaveConfig}
                      disabled={saveConfigMutation.isPending}
                      variant="secondary"
                    >
                      {saveConfigMutation.isPending
                        ? "Saving..."
                        : "Save Configuration"}
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your personal API token can be found in your WealthBox account
                  settings under API Access Tokens.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">
                  About Personal API Tokens
                </h3>
                <p className="text-xs text-gray-600">
                  Personal API access tokens are used for building personal
                  integrations and testing. The token should be passed as an
                  HTTP Header with the name 'ACCESS_TOKEN' in all requests to
                  the API.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Integration Features
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Import client profiles and contact information</li>
                  <li>Sync client activities and interactions</li>
                  <li>Maintain up-to-date client records</li>
                  <li>Get real-time financial advisor data</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {wealthboxStatus?.connected && (
                <span>
                  Connected to WealthBox •{" "}
                  {wealthboxStatus.tokenExpiry
                    ? `Expires: ${new Date(wealthboxStatus.tokenExpiry).toLocaleDateString()}`
                    : ""}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing || connectionStatus !== "success"}
                variant="outline"
              >
                {isSyncing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      ></path>
                    </svg>
                    Sync Data
                  </>
                )}
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || connectionStatus !== "success"}
                variant="default"
              >
                {isImporting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      ></path>
                    </svg>
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-md text-gray-500">
          Manage your account settings and integrations
        </p>
      </div>

      <Tabs 
        defaultValue="user-management" 
        className="space-y-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-4 gap-4 w-full">
          <TabsTrigger value="user-management" className="flex items-center gap-2">
            <UserCog size={18} />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="data-mapping" className="flex items-center gap-2">
            <Network size={18} />
            <span>Data Mapping</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug size={18} />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="firm-information" className="flex items-center gap-2">
            <Building size={18} />
            <span>Firm Information</span>
          </TabsTrigger>
        </TabsList>

        {/* User Management Content */}
        <TabsContent value="user-management">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users, permissions, and roles for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                User management is coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Mapping Content */}
        <TabsContent value="data-mapping">
          {activeMapping === 'vitals' ? (
            <VitalsMapping />
          ) : activeMapping === 'wealthbox' ? (
            <WealthboxMapping />
          ) : activeMapping === 'orion' ? (
            <OrionMapping />
          ) : (
            <DataMappingSection 
              activeMapping={activeMapping} 
              onSetActiveMapping={handleSetActiveMapping} 
            />
          )}
        </TabsContent>

        {/* Integrations Content */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect third-party services and tools to your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderWealthboxIntegration()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firm Information Content */}
        <TabsContent value="firm-information">
          <Card>
            <CardHeader>
              <CardTitle>Firm Information</CardTitle>
              <CardDescription>
                Manage your firm's profile and business details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Update company information, branding elements, and contact details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}