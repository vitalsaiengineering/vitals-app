import { useState, useEffect } from "react";
import { MetricCard } from "./metric-card";
import { BarChart } from "../charts/bar-chart";
import { getClientsByAge } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AgeDistributionCardProps {
  wealthboxUserId?: number | null;
}

interface AgeGroup {
  range: string;
  count: number;
}

export function AgeDistributionCard({ wealthboxUserId }: AgeDistributionCardProps) {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [averageAge, setAverageAge] = useState<number>(0);
  const [largestAgeSegment, setLargestAgeSegment] = useState<string>('N/A');
  const [totalActiveClients, setTotalActiveClients] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when component mounts or wealthboxUserId changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getClientsByAge(wealthboxUserId || undefined);
        console.log('Client age data:', response);
        
        if (response.success) {
          setAgeGroups(response.data.ageGroups || []);
          setAverageAge(response.data.averageAge || 0);
          setLargestAgeSegment(response.data.largestAgeSegment || 'N/A');
          setTotalActiveClients(response.data.totalActiveClients || 0);
        } else {
          setError(response.error || 'Failed to fetch client age data');
        }
      } catch (err) {
        console.error('Error fetching client age data:', err);
        setError('Failed to fetch age distribution data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wealthboxUserId]);

  // Format age distribution data for bar chart
  const ageChartData = ageGroups.map(age => ({
    range: age.range,
    count: age.count,
  }));

  const ageChartSeries = [
    {
      dataKey: "count",
      name: "Clients",
      color: "hsl(var(--primary))"
    }
  ];

  const actions = (
    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
      <span className="sr-only">More options</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
    </Button>
  );

  if (loading) {
    return (
      <MetricCard
        title="Age Distribution"
        subtitle="Client Age Demographics"
        actions={actions}
      >
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full inline-block mb-4"></div>
            <p>Loading age distribution data...</p>
          </div>
        </div>
      </MetricCard>
    );
  }

  if (error) {
    return (
      <MetricCard
        title="Age Distribution"
        subtitle="Client Age Demographics"
        actions={actions}
      >
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Please check your Wealthbox connection.</p>
          </div>
        </div>
      </MetricCard>
    );
  }

  return (
    <MetricCard
      title="Age Distribution"
      subtitle="Client Age Demographics"
      actions={actions}
    >
      <div className="p-2">
        <div className="chart-container mb-4">
          <BarChart
            data={ageChartData}
            xAxisDataKey="range"
            series={ageChartSeries}
            height={200}
            showLegend={false}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="border rounded-lg p-3 text-center">
            <div className="text-sm text-muted-foreground">Average Age</div>
            <div className="text-2xl font-semibold">{averageAge} years</div>
          </div>
          
          <div className="border rounded-lg p-3 text-center">
            <div className="text-sm text-muted-foreground">Largest Segment</div>
            <div className="text-2xl font-semibold">{largestAgeSegment}</div>
          </div>
          
          <div className="border rounded-lg p-3 text-center">
            <div className="text-sm text-muted-foreground">Total Clients</div>
            <div className="text-2xl font-semibold">{totalActiveClients}</div>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}