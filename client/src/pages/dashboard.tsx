import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetsCard } from "@/components/dashboard/assets-card";
import { RevenueCard } from "@/components/dashboard/revenue-card";
import { ActivitiesCard } from "@/components/dashboard/activities-card";
import { PortfolioCard } from "@/components/dashboard/portfolio-card";
import { DemographicsCard } from "@/components/dashboard/demographics-card";
import { AiQuery } from "@/components/dashboard/ai-query";
import { importWealthboxData, getWealthboxStatus } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [lastSynced, setLastSynced] = useState<string>("Today at 9:30 AM");
  
  // Fetch advisor metrics
  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/analytics/advisor-metrics'],
  });
  
  // Fetch client demographics
  const { data: demographics, isLoading: isLoadingDemographics, refetch: refetchDemographics } = useQuery({
    queryKey: ['/api/analytics/client-demographics'],
  });
  
  // Fetch WealthBox connection status
  const { data: wealthboxStatus } = useQuery({
    queryKey: ['/api/wealthbox/status'],
  });
  
  // Import data from WealthBox
  const importMutation = useMutation({
    mutationFn: importWealthboxData,
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
    importMutation.mutate();
  };
  
  // Data for Assets Under Management card
  const assetsData = {
    totalAum: metrics?.totalAum || 0,
    aumChange: 5.2, // Example change percentage
    aumByClientType: [
      { name: "Enterprise Clients", value: metrics?.totalAum * 0.5 || 0, color: "hsl(var(--primary-500))" },
      { name: "Mid-size Clients", value: metrics?.totalAum * 0.35 || 0, color: "hsl(var(--secondary-400))" },
      { name: "Small Clients", value: metrics?.totalAum * 0.15 || 0, color: "hsl(var(--chart-3))" },
    ]
  };
  
  // Data for Revenue card
  const revenueData = {
    totalRevenue: metrics?.totalRevenue || 0,
    revenueChange: 3.8, // Example change percentage
    revenueByQuarter: [
      { quarter: "Q1", revenue: metrics?.totalRevenue * 0.2 || 0 },
      { quarter: "Q2", revenue: metrics?.totalRevenue * 0.25 || 0 },
      { quarter: "Q3", revenue: metrics?.totalRevenue * 0.15 || 0 },
      { quarter: "Q4", revenue: metrics?.totalRevenue * 0.4 || 0 },
    ],
    topClient: {
      name: "GlobalTech Inc.",
      revenue: metrics?.totalRevenue * 0.3 || 0,
      percentage: 30,
    },
    averageRevenue: metrics?.totalRevenue / (metrics?.totalClients || 1) || 0,
  };
  
  // Data for Activities card
  const activitiesData = {
    totalActivities: metrics?.totalActivities || 0,
    activityChange: 12.4, // Example change percentage
    activityTrend: [
      { date: "Mon", emails: 42, calls: 24 },
      { date: "Tue", emails: 38, calls: 28 },
      { date: "Wed", emails: 45, calls: 32 },
      { date: "Thu", emails: 35, calls: 24 },
      { date: "Fri", emails: 30, calls: 18 },
      { date: "Sat", emails: 15, calls: 8 },
      { date: "Sun", emails: 10, calls: 5 },
    ],
    activityBreakdown: [
      { type: "Emails", count: Math.round(metrics?.totalActivities * 0.42) || 0 },
      { type: "Calls", count: Math.round(metrics?.totalActivities * 0.25) || 0 },
      { type: "Meetings", count: Math.round(metrics?.totalActivities * 0.33) || 0 },
    ],
  };
  
  // Data for Portfolio Allocation card
  const portfolioData = {
    assetAllocation: [
      { 
        assetClass: "Equities", 
        allocation: 45, 
        value: metrics?.totalAum * 0.45 || 0, 
        performance: 8.2,
        color: "hsl(var(--primary-500))"
      },
      { 
        assetClass: "Fixed Income", 
        allocation: 30, 
        value: metrics?.totalAum * 0.3 || 0, 
        performance: 2.5,
        color: "hsl(var(--secondary-400))"
      },
      { 
        assetClass: "Alternatives", 
        allocation: 15, 
        value: metrics?.totalAum * 0.15 || 0, 
        performance: -1.3,
        color: "hsl(var(--chart-3))"
      },
      { 
        assetClass: "Cash", 
        allocation: 10, 
        value: metrics?.totalAum * 0.1 || 0, 
        performance: 0.3,
        color: "hsl(var(--chart-4))"
      },
    ]
  };
  
  // Data for Demographics card
  const demographicsData = {
    ageDistribution: demographics?.ageGroups || [
      { range: "18-30", count: 15 },
      { range: "31-40", count: 42 },
      { range: "41-50", count: 63 },
      { range: "51-60", count: 85 },
      { range: "61-70", count: 53 },
      { range: "71+", count: 28 },
    ],
    averageAge: 53,
    largestAgeSegment: "51-60 years",
    stateDistribution: demographics?.stateDistribution || [
      { state: "Texas", count: 28, percentage: 28 },
      { state: "California", count: 22, percentage: 22 },
      { state: "New York", count: 15, percentage: 15 },
      { state: "Florida", count: 12, percentage: 12 },
    ],
  };
  
  if (isLoadingMetrics || isLoadingDemographics) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full inline-block mb-4"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Advisor Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-500">View all your client and portfolio analytics in one place</p>
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
        
        {/* Integration Status */}
        <div className="mt-3 bg-white p-3 rounded-lg border border-neutral-200 flex items-center">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-icons text-green-600">link</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-neutral-900">
              WealthBox {wealthboxStatus?.connected ? "Connected" : "Not Connected"}
            </h3>
            <p className="text-xs text-neutral-500">Last synced: {lastSynced}</p>
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
        {/* AUM by Client */}
        <AssetsCard {...assetsData} />
        
        {/* Revenue by Client */}
        <RevenueCard {...revenueData} />
        
        {/* Total Activities by Client */}
        <ActivitiesCard {...activitiesData} />
        
        {/* Portfolio Allocation & Holdings */}
        <PortfolioCard {...portfolioData} />
        
        {/* Client Demographics */}
        <DemographicsCard {...demographicsData} />
      </div>
      
      {/* AI Query Section */}
      <AiQuery />
    </div>
  );
}
