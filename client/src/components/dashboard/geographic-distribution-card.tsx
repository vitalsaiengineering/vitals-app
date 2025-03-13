import { useState, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { MetricCard } from './metric-card';
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

interface StateData {
  state: string;
  count: number;
  percentage: number;
}

interface GeographicDistributionCardProps {
  wealthboxUserId?: number | null;
}

export function GeographicDistributionCard({ wealthboxUserId }: GeographicDistributionCardProps) {
  const [clientsByState, setClientsByState] = useState<StateData[]>([]);
  const [totalActiveClients, setTotalActiveClients] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string>('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Fetch data when component mounts or wealthboxUserId changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getClientsByState(wealthboxUserId || undefined);
        console.log('Client state data:', response);
        
        if (response.success) {
          setClientsByState(response.data.clientsByState || []);
          setTotalActiveClients(response.data.totalActiveClients || 0);
        } else {
          setError(response.error || 'Failed to fetch client data by state');
        }
      } catch (err) {
        console.error('Error fetching client data by state:', err);
        setError('Failed to fetch geographic data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wealthboxUserId]);

  // Create a color scale based on client counts
  const getColorScale = () => {
    if (!clientsByState.length) return () => '#e6f2ff';

    const counts = clientsByState.map(d => d.count);
    return scaleQuantile<string>()
      .domain(counts)
      .range(colorScale);
  };

  // Handle tooltip display
  const handleMouseEnter = (geo: any, current: StateData | undefined) => {
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

  // Get the top states by client count
  const topStates = clientsByState
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <MetricCard 
      title="Geographic Distribution"
      subtitle={`${totalActiveClients} Active Clients`}
    >
      <div className="h-full">
        {loading ? (
          <div className="flex justify-center items-center h-72">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-72 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative">
            {/* US Map */}
            <div className="h-72">
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

            {/* Legend */}
            <div className="flex justify-between mt-4 mb-2 text-xs text-neutral-600 border-t pt-4">
              <div>Fewest Clients</div>
              <div className="flex space-x-1">
                {colorScale.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div>Most Clients</div>
            </div>

            {/* Top States */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Top States</h4>
              <div className="grid grid-cols-2 gap-2">
                {topStates.map((state) => (
                  <div key={state.state} className="flex justify-between text-sm">
                    <span className="font-medium">{state.state}</span>
                    <span className="text-neutral-600">{state.count} clients</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MetricCard>
  );
}