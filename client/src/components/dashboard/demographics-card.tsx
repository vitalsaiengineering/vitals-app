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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Age Distribution</h3>
          <div className="chart-container">
            <BarChart
              data={ageChartData}
              xAxisDataKey="range"
              series={ageChartSeries}
              height={200}
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-4">
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

        {/* Geographic Distribution */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Geographic Distribution</h3>
          <div className="chart-container bg-neutral-50 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <span className="material-icons text-5xl text-neutral-300">public</span>
              <p className="text-sm text-neutral-400 mt-2">US Map Visualization</p>
              <p className="text-xs text-neutral-400 mt-1">Detailed state breakdown below</p>
            </div>
          </div>

          <div className="mt-2">
            <h4 className="text-sm font-medium text-neutral-700 mb-1">Top States</h4>
            <div className="grid grid-cols-2 gap-2">
              {stateDistribution.slice(0, 4).map((state, index) => (
                <div key={index} className="flex items-center">
                  <span 
                    className="h-2 w-2 rounded-full mr-1"
                    style={{ 
                      backgroundColor: `hsl(var(--primary-${700 - (index * 100)}))` 
                    }}
                  ></span>
                  <span className="text-sm">{state.state}</span>
                  <span className="ml-auto text-sm font-medium">{state.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}
