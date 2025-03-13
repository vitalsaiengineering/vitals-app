import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { testWealthboxConnection, importWealthboxData, syncWealthboxData, getCurrentUser, getWealthboxStatus } from "@/lib/api";
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
import { Redirect } from "wouter";

interface WealthboxStatus {
  connected: boolean;
  tokenExpiry: string | null;
  authorized: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: number;
  wealthboxConnected?: boolean;
  wealthboxTokenExpiry?: string | null;
}

export default function Integrations() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accessToken, setAccessToken] = useState("a362b9c57ca349e5af99a6d8d4af6b3a"); // Default to provided token
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  
  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/me'],
    retry: false,
  });
  
  // Get WealthBox status
  const { data: wealthboxStatus, isLoading: isLoadingStatus } = useQuery<WealthboxStatus>({
    queryKey: ['/api/wealthbox/status'],
    retry: false,
  });

  // Test WealthBox connection
  const testConnectionMutation = useMutation({
    mutationFn: testWealthboxConnection,
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Connection successful",
          description: "Successfully connected to WealthBox API.",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection failed",
          description: data.message || "Failed to connect to WealthBox API.",
          variant: "destructive",
        });
      }
      setIsConnecting(false);
    },
    onError: (error: any) => {
      setConnectionStatus('error');
      toast({
        title: "Connection error",
        description: error.message || "An error occurred while connecting to WealthBox.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  // Import WealthBox data
  const importMutation = useMutation({
    mutationFn: () => importWealthboxData(),
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
        description: error.message || "There was a problem importing your WealthBox data.",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });
  
  // Sync WealthBox data
  const syncMutation = useMutation({
    mutationFn: () => syncWealthboxData(),
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
        description: error.message || "There was a problem synchronizing your WealthBox data.",
        variant: "destructive",
      });
      setIsSyncing(false);
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
    importMutation.mutate();
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
    syncMutation.mutate();
  };

  // Check if user is loading
  if (isLoadingUser || isLoadingStatus) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is authorized
  // Client admin users should always be authorized
  const isAuthorized = (user && (user as any).role === "client_admin") || (wealthboxStatus !== undefined && !!wealthboxStatus.authorized);
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">Connect and manage your external data sources</p>
      </div>
      
      {!isAuthorized && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Access Restricted</AlertTitle>
          <AlertDescription className="text-yellow-700">
            WealthBox integration is only available to client administrators. Please contact your client administrator for assistance.
          </AlertDescription>
        </Alert>
      )}
      
      {isAuthorized && connectionStatus === 'success' && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your WealthBox API connection was successful. You can now import your data.
          </AlertDescription>
        </Alert>
      )}

      {isAuthorized && connectionStatus === 'error' && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            There was a problem connecting to the WealthBox API. Please check your access token and try again.
          </AlertDescription>
        </Alert>
      )}

      {isAuthorized && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
              <div>
                <CardTitle>WealthBox Integration</CardTitle>
                <CardDescription>Connect to your WealthBox account using a Personal API Access Token</CardDescription>
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
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={isConnecting}
                    className="ml-2"
                  >
                    {isConnecting ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your personal API token can be found in your WealthBox account settings under API Access Tokens.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">About Personal API Tokens</h3>
                <p className="text-xs text-gray-600">
                  Personal API access tokens are used for building personal integrations and testing. 
                  The token should be passed as an HTTP Header with the name 'ACCESS_TOKEN' in all requests to the API.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Integration Features</h3>
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
                <span>Connected to WealthBox • {wealthboxStatus.tokenExpiry ? `Expires: ${new Date(wealthboxStatus.tokenExpiry).toLocaleDateString()}` : ''}</span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleSync}
                disabled={isSyncing || connectionStatus !== 'success'}
                variant="outline"
              >
                {isSyncing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Sync Data
                  </>
                )}
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isImporting || connectionStatus !== 'success'}
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Resources for setting up your WealthBox integration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">WealthBox API Integration Guide</h3>
              <p className="text-sm text-gray-600">
                {isAuthorized 
                  ? "To use this integration, you need a personal API access token from your WealthBox account. Enter your token in the field above, test the connection, and then import your data. This integration will synchronize your client data between WealthBox and FinAdvisor Pro."
                  : "WealthBox integration is only available to client administrators. As a client administrator, you can connect to your WealthBox account, import client data, and make it available to your advisors."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex items-center" asChild>
                <a href="https://api.crmworkspace.com/docs" target="_blank" rel="noopener noreferrer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  WealthBox API Docs
                </a>
              </Button>
              <Button variant="outline" className="flex items-center" asChild>
                <a href="https://help.wealthbox.com/en/articles/2344281-api-access-token" target="_blank" rel="noopener noreferrer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Access Token Guide
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
