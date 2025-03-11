import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getWealthboxAuthUrl, getWealthboxStatus, importWealthboxData } from "@/lib/api";
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

export default function Integrations() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  // Get WealthBox status
  const { 
    data: wealthboxStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['/api/wealthbox/status'],
  });

  // Get WealthBox auth URL
  const authUrlQuery = useQuery({
    queryKey: ['/api/wealthbox/auth'],
    enabled: false
  });

  // Import WealthBox data
  const importMutation = useMutation({
    mutationFn: importWealthboxData,
    onSuccess: () => {
      toast({
        title: "Data imported successfully",
        description: "Your WealthBox data has been imported and synchronized.",
      });
      setIsImporting(false);
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "There was a problem importing your WealthBox data.",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  const handleConnect = async () => {
    try {
      const data = await authUrlQuery.refetch();
      if (data.data && data.data.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        toast({
          title: "Connection failed",
          description: "Unable to get authorization URL from WealthBox.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "An error occurred while connecting to WealthBox.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    setIsImporting(true);
    importMutation.mutate();
  };

  // Get connection status from URL query params (for OAuth callback)
  const urlParams = new URLSearchParams(window.location.search);
  const connectionStatus = urlParams.get('status');

  if (isLoadingStatus) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full inline-block mb-4"></div>
          <p>Loading integration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Integrations</h1>
        <p className="mt-1 text-sm text-neutral-500">Connect and manage your external data sources</p>
      </div>

      {connectionStatus === 'success' && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your WealthBox account has been successfully connected.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'error' && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            There was a problem connecting your WealthBox account. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            <div>
              <CardTitle>WealthBox Integration</CardTitle>
              <CardDescription>Connect to your WealthBox account to import client data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${wealthboxStatus?.connected ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
              <span className="font-medium">
                {wealthboxStatus?.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {wealthboxStatus?.connected && wealthboxStatus.expiresAt && (
              <div className="text-sm text-neutral-500">
                Token expires: {new Date(wealthboxStatus.expiresAt).toLocaleString()}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Integration Features</h3>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                <li>Import client profiles and contact information</li>
                <li>Sync client portfolios and holdings</li>
                <li>Track client activities and interactions</li>
                <li>Maintain up-to-date client demographics</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {wealthboxStatus?.connected ? (
            <>
              <Button variant="outline" onClick={handleConnect}>
                Reconnect Account
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">download</span>
                    Import Data
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={authUrlQuery.isLoading}
              className="ml-auto"
            >
              {authUrlQuery.isLoading ? 'Loading...' : 'Connect WealthBox'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <span className="material-icons w-8 h-8 mr-3 text-primary-600">help_outline</span>
            <div>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Resources for setting up your integrations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">WealthBox Integration Guide</h3>
              <p className="text-sm text-neutral-600">
                To connect your WealthBox account, click the Connect button above and follow the 
                authorization process. Once connected, you can import your client data and keep 
                it synchronized with regular imports.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex items-center" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <span className="material-icons mr-2 text-sm">description</span>
                  View Documentation
                </a>
              </Button>
              <Button variant="outline" className="flex items-center" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <span className="material-icons mr-2 text-sm">video_library</span>
                  Watch Tutorial
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
