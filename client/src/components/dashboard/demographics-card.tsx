import { MetricCard } from "./metric-card";
import { Button } from "@/components/ui/button";
import { BarChart } from "../charts/bar-chart";

interface DemographicsCardProps {
  ageDistribution: {
    range: string;
    count: number;
  }[];
  averageAge: number;
  largestAgeSegment: string;
  stateDistribution: {
    state: string;
    count: number;
    percentage: number;
  }[];
}

export function DemographicsCard({
  ageDistribution,
  averageAge,
  largestAgeSegment,
  stateDistribution
}: DemographicsCardProps) {
  const actions = (
    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
      <span className="material-icons">more_vert</span>
    </Button>
  );

  // Format age distribution data for bar chart
  const ageChartData = ageDistribution.map(age => ({
    range: age.range,
    count: age.count,
  }));

  const ageChartSeries = [
    {
      dataKey: "count",
      name: "Clients",
      color: "hsl(var(--primary-500))"
    }
  ];

  return (
    <MetricCard
      title="Client Demographics"
      subtitle="Age and Location"
      actions={actions}
      className="md:col-span-2 lg:col-span-3"
    >
      <div>
        {/* Age Distribution */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Age Distribution</h3>
          <div className="chart-container">
            <BarChart
              data={ageChartData}
              xAxisDataKey="range"
              series={ageChartSeries}
              height={250}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-neutral-500">Average Age</div>
              <div className="text-lg font-semibold">{averageAge} years</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">Largest Segment</div>
              <div className="text-lg font-semibold">{largestAgeSegment}</div>
            </div>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}
