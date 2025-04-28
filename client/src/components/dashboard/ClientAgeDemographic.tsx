import React, { useState, useEffect, useMemo } from 'react';
import { fetchClientDemographicsData } from '@/lib/clientData';
// Import Recharts components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SEGMENTS = {
  PLATINUM: { name: 'Platinum', color: '#2563EB' }, // Darker Blue (e.g., blue-600)
  GOLD:     { name: 'Gold',     color: '#60A5FA' }, // Medium Blue (e.g., blue-400)
  SILVER:   { name: 'Silver',   color: '#BFDBFE' }, // Lighter Blue (e.g., blue-200)
  BRONZE:   { name: 'Bronze',   color: '#DBEAFE' }, // Very Light Blue (e.g., blue-100) - Added in case needed
};
// Order matters for stacking (bottom to top)
const SEGMENT_ORDER = [SEGMENTS.PLATINUM.name, SEGMENTS.GOLD.name, SEGMENTS.SILVER.name, SEGMENTS.BRONZE.name];

const calculateAgeGroups = (clients) => {
  if (!clients || clients.length === 0) return [];

  // Use distinct colors for the metric cards, not the chart bars
  const metricColors = {
    '<20': '#10B981', // Green
    '21-40': '#84CC16', // Lime
    '41-60': '#F59E0B', // Amber
    '61-80': '#F97316', // Orange
    '>80': '#EF4444', // Red
  };

  const groups = {
    '<20': { name: '<20', range: '<20', totalCount: 0, metricColor: metricColors['<20'] },
    '21-40': { name: '21-40', range: '21-40', totalCount: 0, metricColor: metricColors['21-40'] },
    '41-60': { name: '41-60', range: '41-60', totalCount: 0, metricColor: metricColors['41-60'] },
    '61-80': { name: '61-80', range: '61-80', totalCount: 0, metricColor: metricColors['61-80'] },
    '>80': { name: '>80', range: '>80', totalCount: 0, metricColor: metricColors['>80'] },
  };

  // Initialize segment counts in each group
  Object.values(groups).forEach(group => {
    SEGMENT_ORDER.forEach(segName => {
      group[`${segName.toLowerCase()}Count`] = 0; // e.g., platinumCount = 0
    });
  });

  // Aggregate counts per segment within each age group
  clients.forEach(client => {
    let groupKey = null;
    if (client.age < 20) groupKey = '<20';
    else if (client.age >= 21 && client.age <= 40) groupKey = '21-40';
    else if (client.age >= 41 && client.age <= 60) groupKey = '41-60';
    else if (client.age >= 61 && client.age <= 80) groupKey = '61-80';
    else if (client.age > 80) groupKey = '>80';

    if (groupKey) {
      groups[groupKey].totalCount++;
      const segmentKey = `${client.segment?.toLowerCase() || 'unknown'}Count`; // Handle potential missing segment
      if (groups[groupKey][segmentKey] !== undefined) {
        groups[groupKey][segmentKey]++;
      }
      // Optional: Handle unknown segments if necessary
      // else { groups[groupKey].unknownCount = (groups[groupKey].unknownCount || 0) + 1; }
    }
  });

  const totalClients = clients.length;
  return Object.values(groups).map(group => ({
    ...group,
    percentage: totalClients > 0 ? ((group.totalCount / totalClients) * 100).toFixed(1) : 0,
  }));
};

// ... existing calculateAverageAge, filterClientsByGroup ...
const calculateAverageAge = (clients) => {
  if (!clients || clients.length === 0) return 0;
  const totalAge = clients.reduce((sum, client) => sum + client.age, 0);
  return (totalAge / clients.length).toFixed(1);
};

const filterClientsByGroup = (clients, selectedGroup) => {
    if (!selectedGroup || !clients) return clients || []; // Show all if no group selected

    switch (selectedGroup.name) { // Uses the name property like '<20', '21-40', etc.
        case '<20': return clients.filter(c => c.age < 20);
        case '21-40': return clients.filter(c => c.age >= 21 && c.age <= 40);
        case '41-60': return clients.filter(c => c.age >= 41 && c.age <= 60);
        case '61-80': return clients.filter(c => c.age >= 61 && c.age <= 80);
        case '>80': return clients.filter(c => c.age > 80);
        default: return clients;
    }
};


// --- Placeholder Components ---
// ... existing Card, TablePlaceholder ...
const Card = ({ children, className = '', style = {}, ...props }) => (
  <div className={`border rounded-lg p-4 shadow ${className}`} style={style} {...props}>
    {children}
      
  </div>
);

const TablePlaceholder = ({ clients, groupName }) => (
    <Card>
        <h3 className="text-lg font-semibold mb-2">
            Clients {groupName ? `(${groupName})` : '(All)'}
        </h3>
        {clients.length > 0 ? (
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2 px-1">Name</th>
                        <th className="py-2 px-1">Age</th>
                        <th className="py-2 px-1">Segment</th>
                        <th className="py-2 px-1">Join Date</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.slice(0, 5).map(client => ( // Display first 5 for brevity
                        <tr key={client.id} className="border-b last:border-b-0">
                            <td className="py-2 px-1">{client.name}</td>
                            <td className="py-2 px-1">{client.age}</td>
                            <td className="py-2 px-1">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                    client.segment === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                    client.segment === 'Silver' ? 'bg-gray-200 text-gray-800' :
                                    client.segment === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                                    client.segment === 'Platinum' ? 'bg-blue-100 text-blue-800' : // Added Platinum style
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {client.segment}
                                </span>
                            </td>
                            <td className="py-2 px-1">{client.joinDate}</td>
                        </tr>
                    ))}
                    {clients.length > 5 && (
                        <tr>
                            <td colSpan="4" className="text-center py-2 text-gray-500">... and {clients.length - 5} more</td>
                        </tr>
                    )}
                </tbody>
            </table>
        ) : (
            <p className="text-gray-500">No clients found {groupName ? `in the ${groupName} group` : ''}.</p>
        )}
    </Card>
);


// Update AgeMetric to use metricColor from data
const AgeMetric = ({ data, isSelected, onSelect }) => {
    // *** Add a log inside the component function itself ***
    // console.log(`[AgeMetric] Rendering card for: ${data?.name}`);

    const handleClick = () => {
        // *** Add a log INSIDE the click handler ***
        console.log(`[AgeMetric onClick] Clicked! Calling onSelect for group:`, data);
        if (typeof onSelect === 'function') {
            onSelect(data); // Call the function passed via props
        } else {
            console.error("[AgeMetric onClick] Error: onSelect prop is not a function!", onSelect);
        }
    };

    return (
        <Card
            className={`text-center cursor-pointer ${isSelected ? 'border-2 border-blue-500' : ''}`}
            // *** Ensure onClick calls the local handleClick function ***
            onClick={handleClick}
        >
            <div className="flex items-center justify-center mb-1">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.metricColor }}></span>
                <span className="text-sm font-medium">{data.range === '>80' ? 'Over 80' : data.range === '<20' ? 'Under 20' : data.range}</span>
            </div>
            <div className="text-2xl font-bold">{data.totalCount}</div>
            <div className="text-xs text-gray-500">{data.percentage}% of clients</div>
        </Card>
    );
};


// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the data object for the hovered bar

    return (
      <div className="bg-white p-3 shadow-lg rounded border border-gray-200 text-sm">
        <p className="font-bold mb-1">{label}</p> {/* Label is the XAxis key (range) */}
        <p className="mb-2 text-gray-600">{data.totalCount} clients ({data.percentage}%)</p>
        {/* Iterate over segments to display breakdown */}
        {SEGMENT_ORDER.map(segName => {
          const countKey = `${segName.toLowerCase()}Count`;
          const count = data[countKey];
          const segmentInfo = SEGMENTS[segName.toUpperCase()]; // Get color info
          if (count > 0 && segmentInfo) { // Only display segments with clients
            return (
              <div key={segName} className="flex items-center mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: segmentInfo.color }}></span>
                <span>{segmentInfo.name}: {count}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return null;
};


// --- Main Dashboard Component ---

const ClientAgeDemographic = () => {
  // ... existing state (clients, isLoading, error, selectedAgeGroup) ...
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);

  // ... existing useEffect ...
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchClientDemographicsData();
        // Add Platinum segment randomly for demonstration if not present
        const dataWithPlatinum = data.map(client => {
            if (!client.segment && Math.random() < 0.15) { // Add Platinum to ~15% if segment missing
                return { ...client, segment: 'Platinum' };
            }
            // Randomly upgrade some existing segments to Platinum for demo
            if (client.segment !== 'Platinum' && Math.random() < 0.1) {
                 return { ...client, segment: 'Platinum' };
            }
            return client;
        });
        setClients(dataWithPlatinum);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);


  // ... existing useMemo for averageAge, ageGroupData, filteredClients ...
  const averageAge = useMemo(() => calculateAverageAge(clients), [clients]);
  const ageGroupData = useMemo(() => calculateAgeGroups(clients), [clients]);
    const filteredClients = useMemo(() => filterClientsByGroup(clients, selectedAgeGroup), [clients, selectedAgeGroup]);


  // ... existing handleSelectGroup ...
      const handleSelectGroup = (group) => {
        // More specific log: Include which group was clicked
        console.log(`[handleSelectGroup] Function called with group:`, group);

        setSelectedAgeGroup(prevSelectedGroup => {
            if (prevSelectedGroup && prevSelectedGroup.name === group.name) {
                console.log(`[handleSelectGroup] Deselecting group: ${group.name}`);
                return null; // Deselect
            } else {
                console.log(`[handleSelectGroup] Selecting group: ${group.name}`);
                return group; // Select new group
            }
        });
      };


  // ... existing loading/error rendering ...
  if (isLoading) {
    return <div className="p-4 text-center">Loading client data...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }


  const totalClients = clients.length;
  const maxCount = Math.max(...ageGroupData.map(g => g.totalCount), 0); // Use totalCount now
  const yAxisMax = Math.ceil((maxCount * 1.1) / 3) * 3;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* ... Title, Total Clients, Average Age Card ... */}
       <h1 className="text-2xl font-bold text-center mb-1">Client Age Demographics</h1>
       <p className="text-center text-gray-600 mb-6">Total Clients: {totalClients}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center">
          <h2 className="text-sm text-gray-500 mb-1">Average Client Age</h2>
          <div className="text-5xl font-bold">{averageAge} <span className="text-xl font-normal text-gray-600">years</span></div>
        </Card>

        {/* --- Updated Stacked Bar Chart --- */}
        <div>
           <h2 className="text-lg font-semibold mb-2 text-center md:text-left">Age Demographics</h2>
           <Card className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={ageGroupData}
                    margin={{ top: 5, right: 0, left: -25, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="range"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, yAxisMax]}
                        ticks={[0, 3, 6, 9, 12, 15].filter(t => t <= yAxisMax)}
                        allowDecimals={false}
                    />
                    {/* Use the Custom Tooltip */}
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,200,200,0.1)' }} />

                    {/* Render a <Bar> for each segment, using the same stackId */}
                    {SEGMENT_ORDER.map(segName => {
                        const segmentInfo = SEGMENTS[segName.toUpperCase()];
                        if (!segmentInfo) return null; // Skip if segment definition is missing
                        return (
                            <Bar
                                key={segName}
                                dataKey={`${segName.toLowerCase()}Count`} // e.g., platinumCount
                                stackId="a" // All bars share the same stack ID
                                fill={segmentInfo.color} // Use the defined blue shade
                                radius={segName === SEGMENTS.SILVER.name ? [4, 4, 0, 0] : [0, 0, 0, 0]} // Round only the top bar (adjust if Bronze is top)
                            />
                        );
                    })}
                </BarChart>
             </ResponsiveContainer>
           </Card>
        </div>
        {/* --- End Stacked Bar Chart --- */}

      </div>

      {/* ... Middle Row: Metric Cards (uses updated AgeMetric) ... */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {ageGroupData.map(group => (
              <AgeMetric
                key={group.name}
                data={group}
                isSelected={selectedAgeGroup?.name === group.name}
                // *** Double-check this line ***
                onSelect={handleSelectGroup}
              />
            ))}
          </div>


      {/* ... Bottom Row: Clients Table (added Platinum style) ... */}
       <div>
        <TablePlaceholder
            clients={filteredClients}
            groupName={selectedAgeGroup?.name}
        />
      </div>

    </div>
  );
};

export default ClientAgeDemographic;