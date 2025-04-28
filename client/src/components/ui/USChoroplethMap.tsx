import React, { memo } from 'react'; // Removed useState as it's no longer needed for tooltip content
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
// Change the import statement
import { Tooltip } from 'react-tooltip'; // Use named import
import { StateClientData } from '@/lib/clientData'; // Adjust path as needed

// ... (geoUrl and colorRange remain the same) ...
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const colorRange = [
  '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b',
];


interface USChoroplethMapProps {
  data: StateClientData[];
  onStateClick: (stateData: StateClientData | null, stateName: string) => void;
  valueField?: keyof StateClientData;
}

const USChoroplethMap: React.FC<USChoroplethMapProps> = ({ data, onStateClick, valueField = 'totalAssets' }) => {
  // Remove the useState for tooltipContent
  // const [tooltipContent, setTooltipContent] = useState('');

  const dataMap = new Map<string, StateClientData>();
  data.forEach(item => dataMap.set(item.stateName, item));

  const colorScale = scaleQuantile<string>()
    .domain(data.map(d => d[valueField] as number))
    .range(colorRange);

  // Define a unique ID for the tooltip
  const tooltipId = "map-tooltip";

  return (
    <>
      {/* Remove data-tip="" from ComposableMap */}
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => {
              const stateName = geo.properties.name;
              const cur = dataMap.get(stateName);
              const value = cur ? cur[valueField] : undefined;

              // Prepare tooltip content string here
              const currentTooltipContent = () => {
                  const stateData = dataMap.get(stateName);
                  const displayValue = stateData ? stateData[valueField] : 'No data';
                  return `${stateName}: ${valueField === 'totalAssets' && typeof displayValue === 'number' ? '$' + displayValue.toLocaleString() : displayValue}`;
              };

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  // Add tooltip attributes directly to the Geography element
                  data-tooltip-id={tooltipId}
                  data-tooltip-content={currentTooltipContent()} // Set content directly
                  // Remove mouse enter/leave handlers for tooltip state
                  // onMouseEnter={() => { ... }}
                  // onMouseLeave={() => { ... }}
                  onClick={() => {
                    const stateData = dataMap.get(stateName);
                    onStateClick(stateData || null, stateName);
                  }}
                  style={{
                    default: {
                      fill: cur && value !== undefined ? colorScale(value as number) : '#ECEFF1',
                      outline: 'none',
                      stroke: '#FFF',
                      strokeWidth: 0.5,
                    },
                    hover: {
                      fill: cur && value !== undefined ? colorScale(value as number) : '#ECEFF1',
                      outline: 'none',
                      stroke: '#666',
                      strokeWidth: 1,
                      cursor: 'pointer',
                    },
                    pressed: {
                      fill: '#08306b',
                      outline: 'none',
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {/* Render the Tooltip component, linking it by id */}
      <Tooltip id={tooltipId} />
    </>
  );
};

export default memo(USChoroplethMap);