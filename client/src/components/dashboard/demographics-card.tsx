import { useState, useEffect } from 'react';
import { MetricCard } from "./metric-card";
import { Button } from "@/components/ui/button";
import { BarChart } from "../charts/bar-chart";
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { getClientsByState } from '@/lib/api';
import { Loader2 } from 'lucide-react';

// US States GeoJSON
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Color scale for map
const colorScale = [
  "#e6f2ff", // lightest blue - fewest clients
  "#c2e0ff",
  "#99ccff",
  "#66b3ff",
  "#3399ff",
  "#0080ff",
  "#0066cc", // darkest blue - most clients
];

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
  const [clientsByState, setClientsByState] = useState<any[]>([]);
  const [totalActiveClients, setTotalActiveClients] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string>('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getClientsByState();
        
        if (response.success) {
          setClientsByState(response.data.clientsByState || []);
          setTotalActiveClients(response.data.totalActiveClients || 0);
        } else {
          setError(response.error || 'Failed to fetch client data by state');
          // Use the provided stateDistribution as fallback
          const stateDataForMap = stateDistribution.map(state => ({
            state: state.state,
            count: state.count,
            percentage: state.percentage
          }));
          setClientsByState(stateDataForMap);
        }
      } catch (err) {
        console.error('Error fetching client data by state:', err);
        setError('Failed to fetch geographic data');
        // Use the provided stateDistribution as fallback
        const stateDataForMap = stateDistribution.map(state => ({
          state: state.state,
          count: state.count,
          percentage: state.percentage
        }));
        setClientsByState(stateDataForMap);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stateDistribution]);

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

  // Create a color scale based on client counts
  const getColorScale = () => {
    if (!clientsByState.length) return () => '#e6f2ff';

    const counts = clientsByState.map(d => d.count);
    return scaleQuantile<string>()
      .domain(counts)
      .range(colorScale);
  };

  // Handle tooltip display
  const handleMouseEnter = (geo: any, current: any | undefined) => {
    const { properties, centroid } = geo;
    const state = properties.name;
    const count = current ? current.count : 0;
    setTooltipContent(`${state}: ${count} clients`);
    setShowTooltip(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setTooltipContent('');
    setShowTooltip(false);
  };

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
          
          <div className="relative">
            {/* US Map */}
            <div className="h-[200px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-full">
                  <span className="material-icons text-5xl text-neutral-300">public</span>
                  <p className="text-sm text-neutral-400 ml-2">Map data unavailable</p>
                </div>
              ) : (
                <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 900 }}>
                  <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) => 
                        geographies.map(geo => {
                          const stateCode = geo.id;
                          const stateData = clientsByState.find(d => d.state === geo.properties.name);
                          const colorScale = getColorScale();
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={stateData ? colorScale(stateData.count) : '#EEE'}
                              stroke="#FFF"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: 'none' },
                                hover: { outline: 'none', fill: stateData ? '#2563EB' : '#F3F4F6' },
                                pressed: { outline: 'none' }
                              }}
                              onMouseEnter={() => handleMouseEnter(geo, stateData)}
                              onMouseMove={handleMouseMove}
                              onMouseLeave={handleMouseLeave}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              )}
            </div>

            {/* Tooltip */}
            {showTooltip && (
              <div
                className="absolute text-xs bg-black text-white p-2 rounded pointer-events-none z-10"
                style={{
                  top: tooltipPosition.y - 80,
                  left: tooltipPosition.x - 50,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                {tooltipContent}
              </div>
            )}
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
