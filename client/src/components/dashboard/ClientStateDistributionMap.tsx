import React, { useState, useEffect, useCallback } from 'react';
import { getClientDistributionByState, StateClientData, ClientDetail } from '@/lib/clientData'; // Adjust path as needed
import USChoroplethMap from '@/components/ui/USChoroplethMap'; // Import the new map component

// Remove the old placeholder component
// const USAMapPlaceholder: React.FC<{ data: StateClientData[] }> = ({ data }) => { ... };

const ClientDistributionMap: React.FC = () => {
  const [distributionData, setDistributionData] = useState<StateClientData[]>([]);
  const [selectedStateData, setSelectedStateData] = useState<StateClientData | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string>('Florida'); // Keep track of selected state name
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getClientDistributionByState(); // Add advisorId if needed
        setDistributionData(data);

        // Set initial selected state (e.g., Florida) based on data fetched
        const initialSelected = data.find(state => state.stateName === selectedStateName);
        setSelectedStateData(initialSelected || null);

      } catch (err) {
        console.error("Error fetching client distribution:", err);
        setError("Failed to load client distribution data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStateName]); // Re-fetch isn't needed here unless advisorId changes, but keep selectedStateName for consistency if needed elsewhere

  // Callback function for map clicks
  const handleStateSelect = useCallback((stateData: StateClientData | null, stateName: string) => {
    setSelectedStateName(stateName); // Set the name of the clicked state
    setSelectedStateData(stateData); // Set the data object (or null if no data)
  }, []); // Empty dependency array means this function is created once

  // Function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return <div>Loading client distribution...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  // Determine the title for the client list section
  const clientListTitle = selectedStateData
    ? `${selectedStateData.stateName} Clients`
    : `${selectedStateName} Clients`; // Show name even if no data

  // Determine the client count for the badge
  const clientCount = selectedStateData ? selectedStateData.clientCount : 0;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        // color: '#0c5a9e',
        padding: '15px 20px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0'
      }}>
        <span style={{ marginRight: '10px', fontSize: '1.2em' }}></span>
        <h2 style={{ margin: 0, fontSize: '1.4em' }}>Client Distribution by State</h2>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>

        {/* Map Section */}
        <div style={{
          flex: 1,
          maxWidth: '50%',
          backgroundColor: 'white',
          padding: '10px', // Reduced padding slightly for map
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {/* Use the actual map component */}
          <USChoroplethMap
            data={distributionData}
            onStateClick={handleStateSelect}
            valueField="totalAssets" // Or "clientCount"
          />
        </div>

        {/* Client List Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {/* Always show the header, adjust based on selection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2em', color: '#333' }}>{clientListTitle}</h3>
            <span style={{
              backgroundColor: '#e0f2fe',
              color: '#0c5a9e',
              padding: '5px 10px',
              borderRadius: '12px',
              fontSize: '0.9em',
              fontWeight: 'bold'
            }}>
              👥 {clientCount}
            </span>
          </div>

          {selectedStateData && selectedStateData.clients.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {selectedStateData.clients.map((client, index) => (
                <li key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '15px 0',
                  borderBottom: index < selectedStateData.clients.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{client.name}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>{client.netWorthCategory}</div>
                  </div>
                  <div style={{ color: '#007bff', fontWeight: 'bold' }}>
                    {formatCurrency(client.assets)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            // Show message if state is selected but has no client data or no clients listed
            <div style={{ color: '#666', fontSize: '0.9em', textAlign: 'center', marginTop: '20px' }}>
              {clientCount > 0 ? 'Detailed client list not available.' : 'No clients in this state.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDistributionMap;