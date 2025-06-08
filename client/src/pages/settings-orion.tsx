// Temporary file to fix the renderOrionIntegration function
// This is a cleaner approach to fix the function

const renderOrionIntegration = () => {
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-medium mb-2">Orion</h3>
      <div className="text-sm text-muted-foreground mb-4">
        Connect to Orion to access client portfolio data, AUM metrics, and investment information.
      </div>
      
      <div className="flex items-center gap-4">
        {orionStatus?.connected ? (
          <>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={handleConnectOrionClick}
              disabled={isConnectingOrion}
            >
              Reconnect
              {isConnectingOrion && (
                <Network className="ml-2 h-4 w-4 animate-spin" />
              )}
            </Button>
          </>
        ) : (
          <>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Not Connected
            </Badge>
            <Button
              variant="default"
              size="sm"
              className="ml-auto"
              onClick={handleConnectOrionClick}
              disabled={isConnectingOrion}
            >
              Connect to Orion
              {isConnectingOrion && (
                <Network className="ml-2 h-4 w-4 animate-spin" />
              )}
            </Button>
          </>
        )}
      </div>
      
      {orionConnectionStatus === "error" && (
        <div className="mt-4 text-sm text-red-600">
          Failed to connect to Orion. Please try again.
        </div>
      )}
      
      {orionStatus?.message && (
        <div className="mt-4 text-sm text-muted-foreground">
          {orionStatus.message}
        </div>
      )}
    </div>
  );
};