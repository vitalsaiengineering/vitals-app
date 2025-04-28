import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetsCard } from "@/components/dashboard/assets-card";
import { OpportunitiesCard } from "@/components/dashboard/opportunities-card";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { AiQuery } from "@/components/dashboard/ai-query";
import {
  importWealthboxData,
  getWealthboxStatus,
  getCurrentUser
} from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import  ClientStateDistributionMap  from "@/components/dashboard/ClientStateDistributionMap"
import ClientAgeDemographic from "@/components/dashboard/ClientAgeDemographic";
import ReferralDashboard from 
  "@/components/dashboard/ReferralDashboard";
import HouseholdNetNewTable from "@/components/dashboard/AdvisorGrowthMetric";
// import AgeMetric from "@/components/dashboard/AgeMetric";
// Using extended User type that includes role and username fields
interface ExtendedUser {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  roleId: number | null;
  status: "active" | "inactive" | "pending" | "suspended";
  organizationId: number | null;
  role?: string;
  username?: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [lastSynced, setLastSynced] = useState<string>("Today at 9:30 AM");
  const [filters, setFilters] = useState<{
    firmId: number | null;
    advisorId: number | null;
    wealthboxUserId: number | null;
  }>({
    firmId: null,
    advisorId: null,
    wealthboxUserId: null,
  });

  // Handle filter changes from the filter bar
  const handleFilterChange = (newFilters: {
    firmId: number | null;
    advisorId: number | null;
    wealthboxUserId: number | null;
  }) => {
    setFilters(newFilters);
  };

  // Define types for metrics and demographics data
  interface AdvisorMetrics {
    totalAum: number;
    totalRevenue: number;
    totalClients: number;
    totalActivities: number;
    assetAllocation: {
      class: string;
      value: number;
      percentage: number;
    }[];
  }

  interface ClientDemographics {
    ageGroups: {
      range: string;
      count: number;
    }[];
    stateDistribution: {
      state: string;
      count: number;
      percentage: number;
    }[];
  }

  interface WealthboxStatus {
    connected: boolean;
    tokenExpiry: string | null;
  }

  // Fetch current user
  const { data: currentUser, isLoading: isLoadingUser } =
    useQuery<ExtendedUser>({
      queryKey: ["/api/me"],
    });

  // Fetch advisor metrics with filter parameters
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useQuery<AdvisorMetrics>({
    queryKey: [
      "/api/analytics/advisor-metrics",
      filters.firmId,
      filters.advisorId,
    ],
    queryFn: async () => {
      const url = new URL(
        "/api/analytics/advisor-metrics",
        window.location.origin,
      );
      if (filters.firmId)
        url.searchParams.append("firmId", filters.firmId.toString());
      if (filters.advisorId)
        url.searchParams.append("advisorId", filters.advisorId.toString());

      const response = await fetch(url.toString(), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Fetch client demographics with filter parameters
  const {
    data: demographics,
    isLoading: isLoadingDemographics,
    refetch: refetchDemographics,
  } = useQuery<ClientDemographics>({
    queryKey: [
      "/api/analytics/client-demographics",
      filters.firmId,
      filters.advisorId,
    ],
    queryFn: async () => {
      const url = new URL(
        "/api/analytics/client-demographics",
        window.location.origin,
      );
      if (filters.firmId)
        url.searchParams.append("firmId", filters.firmId.toString());
      if (filters.advisorId)
        url.searchParams.append("advisorId", filters.advisorId.toString());

      const response = await fetch(url.toString(), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch demographics");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Fetch WealthBox connection status
  const { data: wealthboxStatus } = useQuery<WealthboxStatus>({
    queryKey: ["/api/wealthbox/status"],
    enabled: !!currentUser,
  });

  // Import data from WealthBox
  const importMutation = useMutation({
    mutationFn: () => importWealthboxData(),
    onSuccess: () => {
      toast({
        title: "Data imported successfully",
        description: "Your WealthBox data has been imported and synchronized.",
      });
      setLastSynced(new Date().toLocaleString());
      // Refresh metrics and demographics
      refetchMetrics();
      refetchDemographics();
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "There was a problem importing your WealthBox data.",
        variant: "destructive",
      });
    },
  });

  const handleRefreshData = () => {
    importMutation.mutate(undefined);
  };

  // Role-based dashboard display
  if (currentUser) {
    // For client admins, we'll show the advisor list with a filter bar AND the advisor dashboard
    if (currentUser.role === "firm_admin") {
      return (
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  Client Admin Dashboard
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Welcome, {currentUser.username}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <span className="material-icons text-sm mr-2">
                    file_download
                  </span>
                  Export
                </Button>
                <Button
                  size="sm"
                  className="flex items-center"
                  onClick={handleRefreshData}
                  disabled={importMutation.isPending}
                >
                  <span className="material-icons text-sm mr-2">refresh</span>
                  {importMutation.isPending ? "Refreshing..." : "Refresh Data"}
                </Button>
              </div>
            </div>

            {/* Add Filter Bar for client admin to filter by advisor */}
            <FilterBar user={currentUser} onFilterChange={handleFilterChange} />

            {/* Integration Status */}
            <div className="mt-3 bg-white p-3 rounded-lg border border-neutral-200 flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="material-icons text-green-600">link</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-neutral-900">
                  WealthBox{" "}
                  {wealthboxStatus?.connected ? "Connected" : "Not Connected"}
                </h3>
                <p className="text-xs text-neutral-500">
                  Last synced: {lastSynced}
                </p>
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary-700 bg-primary-100 hover:bg-primary-200 border-primary-200"
                  asChild
                >
                  <a href="/integrations">Manage</a>
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid - showing the same dashboard as advisors see */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>

          {/* AI Query Section */}
          <div className="mt-6">
            <AiQuery />
          </div>
        </div>
      );
    }

    if (currentUser.role === "firm_admin") {
      return (
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Firm Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Welcome, {currentUser.username}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Firm Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p>Firm performance metrics will be shown here</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary-700 bg-primary-100 hover:bg-primary-200 border-primary-200"
                    asChild
                  >
                    <a href="/integrations">Manage Integrations</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  // Default dashboard for financial advisors and other roles
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Advisor Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              View all your client and portfolio analytics in one place
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button variant="outline" size="sm" className="flex items-center">
              <span className="material-icons text-sm mr-2">file_download</span>
              Export
            </Button>
            <Button
              size="sm"
              className="flex items-center"
              onClick={handleRefreshData}
              disabled={importMutation.isPending}
            >
              <span className="material-icons text-sm mr-2">refresh</span>
              {importMutation.isPending ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </div>

        {/* Add Filter Bar */}
        {currentUser && (
          <FilterBar user={currentUser} onFilterChange={handleFilterChange} />
        )}

        {/* Integration Status */}
        <div className="mt-3 bg-white p-3 rounded-lg border border-neutral-200 flex items-center">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-icons text-green-600">link</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-neutral-900">
              WealthBox{" "}
              {wealthboxStatus?.connected ? "Connected" : "Not Connected"}
            </h3>
            <p className="text-xs text-neutral-500">
              Last synced: {lastSynced}
            </p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-primary-700 bg-primary-100 hover:bg-primary-200 border-primary-200"
              asChild
            >
              <a href="/integrations">Manage</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Average Client Age */}
        {/* <AgeMetric /> */}
        {/* Geographic Distribution */}
        {/* <GeographicDistributionCard wealthboxUserId={filters.wealthboxUserId} /> */}
      </div>

      {/* KPI Section */}

      <div className="mt-6">
        <HouseholdNetNewTable
          />
        </div>
      


      <div className="mt-6">
        <ClientAgeDemographic
          />
        </div>

      <div className="mt-6">
        <ReferralDashboard
          />
      </div>

      <div className="mt-6">
        <ClientStateDistributionMap
          />
      </div>
      

      {/* Opportunities Section - Full Width */}
      <div className="mt-6">
        <OpportunitiesCard
          wealthboxToken={
            wealthboxStatus?.connected
              ? "a362b9c57ca349e5af99a6d8d4af6b3a"
              : undefined
          }
          advisorId={currentUser?.id ?? null}
          wealthboxUserId={filters.wealthboxUserId}
          currentUser={currentUser}
        />
      </div>

      {/* AI Query Section */}
      <AiQuery />
    </div>
  );
}
