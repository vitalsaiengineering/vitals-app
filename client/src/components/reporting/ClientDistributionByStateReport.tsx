import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, DollarSign, Search, Building, ChevronUp, ChevronDown } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { StandardClient } from "@/types/client";
import { getClients } from "@/lib/clientData";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { filtersToApiParams } from "@/utils/filter-utils";
import { formatAUM, getPrettyClientName, getSegmentName } from "@/utils/client-analytics";
import { ReportSkeleton } from "@/components/ui/skeleton";

import { getAdvisorReportTitle, getAdvisorName } from '@/lib/utils';

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type MapViewType = "clientDensity" | "totalAssets";

type SortConfig = {
  key: string | null;
  direction: 'asc' | 'desc';
};

interface ClientInStateDetail {
  id: string;
  name: string;
  segment: string;
  aum: number;
}

interface StateMetric {
  stateCode: string;
  stateName: string;
  clientCount: number;
  totalAum: number;
}

interface TopStateSummary {
  stateName: string;
  value: number | string;
  metricLabel: 'clients' | 'AUM';
}

interface ClientDistributionReportData {
  topStateByClients: TopStateSummary;
  topStateByAUM: TopStateSummary;
  stateMetrics: StateMetric[];
  clientDetailsByState: { [stateCode: string]: ClientInStateDetail[] };
}

// Data transformation functions
const transformToClientInStateDetail = (client: StandardClient): ClientInStateDetail => ({
  id: client.id,
  name: getPrettyClientName(client),
  segment: getSegmentName(client.segment),
  aum: client.aum || 0
});

const generateDistributionReportFromClients = (clients: StandardClient[]): ClientDistributionReportData => {
  // Group clients by state
  const clientsByState = clients.reduce((acc, client) => {
    const stateCode = client.stateCode || 'N/A';
    const stateName = client.state || stateCode;
    
    if (!acc[stateCode]) {
      acc[stateCode] = {
        stateName,
        clients: []
      };
    }
    acc[stateCode].clients.push(transformToClientInStateDetail(client));
    return acc;
  }, {} as { [key: string]: { stateName: string; clients: ClientInStateDetail[] } });

  // Calculate state metrics
  const stateMetrics: StateMetric[] = Object.entries(clientsByState).map(([stateCode, stateData]) => {
    const totalAum = stateData.clients.reduce((sum, client) => {
      // Debug: Log each AUM addition
      const clientAum = Number(client.aum) || 0;
      return sum + clientAum;
    }, 0);
        
    return {
      stateCode,
      stateName: stateData.stateName,
      clientCount: stateData.clients.length,
      totalAum
    };
  });

  // Find top states
  const topStateByClients = stateMetrics.length > 0 
    ? stateMetrics.reduce((max, state) => state.clientCount > max.clientCount ? state : max, stateMetrics[0])
    : { stateName: 'N/A', clientCount: 0, totalAum: 0, stateCode: '' };

  const topStateByAUM = stateMetrics.length > 0
    ? stateMetrics.reduce((max, state) => state.totalAum > max.totalAum ? state : max, stateMetrics[0])
    : { stateName: 'N/A', clientCount: 0, totalAum: 0, stateCode: '' };

  // Create client details by state
  const clientDetailsByState = Object.entries(clientsByState).reduce((acc, [stateCode, stateData]) => {
    acc[stateCode] = stateData.clients;
    return acc;
  }, {} as { [stateCode: string]: ClientInStateDetail[] });

  return {
    topStateByClients: {
      stateName: topStateByClients.stateName,
      value: topStateByClients.clientCount,
      metricLabel: 'clients' as const
    },
    topStateByAUM: {
      stateName: topStateByAUM.stateName,
      value: topStateByAUM.totalAum,
      metricLabel: 'AUM' as const
    },
    stateMetrics,
    clientDetailsByState
  };
};

const getSegmentClass = (segment: string) => {
  const s = segment.toLowerCase();
  if (s.includes("ultra high net worth"))
    return "bg-purple-100 text-purple-700 border-purple-300";
  if (s.includes("high net worth"))
    return "bg-blue-100 text-blue-700 border-blue-300";
  if (s.includes("mass affluent"))
    return "bg-green-100 text-green-700 border-green-300";
  if (s.includes("platinum"))
    return "bg-blue-100 text-blue-700 border-blue-300";
  if (s.includes("gold"))
    return "bg-yellow-100 text-yellow-700 border-yellow-300";
  if (s.includes("silver"))
    return "bg-gray-100 text-gray-700 border-gray-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
};

const getMapFillColor = (
  value: number,
  viewType: MapViewType,
  themeColors: any
): string => {
  const colors = {
    darkest: "hsl(220, 88.60%, 36.00%)",
    dark: "hsl(220, 83.90%, 48.70%)",
    medium: "hsl(220, 72.90%, 55.80%)",
    light: "hsl(220, 75.70%, 59.90%)",
    lightest: "hsl(220, 70.00%, 69.70%)",
    default: "hsl(220, 10.00%, 88.00%)",
  };
  if (viewType === "clientDensity") {
    if (value > 10) return colors.darkest;
    if (value > 7) return colors.dark;
    if (value > 4) return colors.medium;
    if (value >= 1) return colors.light;
    if (value === 0) return colors.lightest;
  } else {
    if (value > 20000000) return colors.darkest;
    if (value > 10000000) return colors.dark;
    if (value > 5000000) return colors.medium;
    if (value > 1000000) return colors.light;
    if (value >= 0) return colors.lightest;
  }
  return colors.default;
};

const ClientDistributionByStateReport = () => {
  const { filters, filterOptions } = useReportFilters();
  const [reportData, setReportData] = useState<ClientDistributionReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStateMetric, setSelectedStateMetric] = useState<StateMetric | null>(null);
  const [mapViewType, setMapViewType] = useState<MapViewType>("clientDensity");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'aum', direction: 'desc' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use centralized getClients function
        const apiParams = filtersToApiParams(filters);
        const clients = await getClients(apiParams);
        const transformedData = generateDistributionReportFromClients(clients);
        setReportData(transformedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch report data"
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const allClientsFromReport = useMemo(() => {
    if (!reportData) return [];
    return Object.values(reportData.clientDetailsByState).flat();
  }, [reportData]);

  const clientsToDisplayPreSearch = useMemo(() => {
    if (!reportData) return [];
    if (selectedStateMetric) {
      return (
        reportData.clientDetailsByState[selectedStateMetric.stateCode] || []
      );
    }
    return allClientsFromReport;
  }, [reportData, selectedStateMetric, allClientsFromReport]);

  const clientsInSelectedState = useMemo(() => {
    if (clientsToDisplayPreSearch.length === 0) return [];
    
    let filteredClients = clientsToDisplayPreSearch;
    
    // Apply search filter
    if (searchTerm) {
      filteredClients = clientsToDisplayPreSearch.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.aum.toString().includes(searchTerm)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredClients = [...filteredClients].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        if (sortConfig.key === 'aum') {
          return sortConfig.direction === 'asc' 
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        } else {
          const aString = String(aValue).toLowerCase();
          const bString = String(bValue).toLowerCase();
          if (sortConfig.direction === 'asc') {
            return aString < bString ? -1 : aString > bString ? 1 : 0;
          } else {
            return bString < aString ? -1 : bString > aString ? 1 : 0;
          }
        }
      });
    }

    return filteredClients;
  }, [clientsToDisplayPreSearch, searchTerm, sortConfig]);

  const handleStateSelectFromMap = (geoName: string, geoId: string) => {
    const stateData = reportData?.stateMetrics.find(
      (s) => s.stateName.toUpperCase() === geoName
    );

    if (stateData) {
      setSelectedStateMetric(stateData);
    } else {
      setSelectedStateMetric({
        stateName: geoName,
        stateCode: geoId,
        clientCount: 0,
        totalAum: 0,
      });
    }
    setSearchTerm("");
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getHoveredStateData = () => {
    if (!hoveredStateName || !reportData) return null;
    
    const stateData = reportData.stateMetrics.find(
      (s) => s.stateName.toUpperCase() === hoveredStateName.toUpperCase()
    );
    
    return {
      stateName: hoveredStateName,
      clientCount: stateData?.clientCount || 0,
      totalAum: stateData?.totalAum || 0
    };
  };

      const advisorName = getAdvisorName(filters.advisorIds[0], filterOptions || undefined);
    const tableTitle = selectedStateMetric
      ? `${selectedStateMetric.stateName} CLIENTS${advisorName ? ` - ${advisorName.toUpperCase()}` : ""}`
      : advisorName ? `${advisorName.toUpperCase()}'S CLIENTS` : "ALL CLIENTS";

  const summaryClientCount = selectedStateMetric
    ? selectedStateMetric.clientCount
    : allClientsFromReport.length;

  const summaryTotalAum = selectedStateMetric
    ? selectedStateMetric.totalAum
    : allClientsFromReport.reduce((sum, client) => sum + client.aum, 0);

  let emptyTableMessage = "No data to display.";
  if (clientsInSelectedState.length === 0) {
    if (selectedStateMetric) {
      if (searchTerm) {
        emptyTableMessage = `No clients match your search in ${selectedStateMetric.stateName}.`;
      } else {
        emptyTableMessage = `No client data available for ${selectedStateMetric.stateName}.`;
      }
    } else {
      emptyTableMessage = searchTerm
        ? "No clients match your search."
        : reportData && allClientsFromReport.length === 0
        ? "No clients found in the report."
        : "No clients match your search criteria.";
    }
  }

  if (isLoading) {
    return <ReportSkeleton />;
  }
  
  if (error || !reportData) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error || "Could not load data."}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Top Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top State by Clients
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.topStateByClients.stateName}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.topStateByClients.value} clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top State by AUM
            </CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.topStateByAUM.stateName}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatAUM(reportData.topStateByAUM.value)}
            </p>
          </CardContent>
        </Card>
      </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Map Card */}
      <Card className="flex flex-col h-[calc(100vh-300px)]">
      <CardHeader className="flex-shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle>
                {getAdvisorReportTitle("Client Distribution Map", filters, filterOptions || undefined)}
              </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={
                  mapViewType === "clientDensity" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setMapViewType("clientDensity")}
              >
                <Users className="mr-2 h-4 w-4" /> Client Density
              </Button>
              <Button
                variant={mapViewType === "totalAssets" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapViewType("totalAssets")}
              >
                <DollarSign className="mr-2 h-4 w-4" /> Total Assets
              </Button>
            </div>
          </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <ComposableMap projection="geoAlbersUsa" className="w-full h-full">
              <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoDisplayName = geo.properties.name; // Original case for potential display needs
                      const geoMatchName = geoDisplayName.toUpperCase(); // For matching
                      const geoId = geo.id; // FIPS code

                      const currentStateData = reportData.stateMetrics.find(
                        (s) => s.stateName.toUpperCase() === geoMatchName
                      );

                      let fillValue: number | undefined;
                      if (currentStateData) {
                        fillValue =
                          mapViewType === "clientDensity"
                            ? currentStateData.clientCount
                            : currentStateData.totalAum;
                      }

                      const fillColor = getMapFillColor(
                        fillValue ?? -1,
                        mapViewType,
                        {}
                      );

                      const isSelected =
                        selectedStateMetric?.stateName.toUpperCase() ===
                        geoMatchName;
                      const isHovered =
                        hoveredStateName?.toUpperCase() === geoMatchName;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() =>
                            handleStateSelectFromMap(geoMatchName, geoId)
                          }
                          onMouseEnter={(event) => {
                            setHoveredStateName(geoMatchName);
                            setMousePosition({ x: event.clientX, y: event.clientY });
                          }}
                          onMouseMove={(event) => {
                            setMousePosition({ x: event.clientX, y: event.clientY });
                          }}
                          onMouseLeave={() => {
                            setHoveredStateName(null);
                            setMousePosition(null);
                          }}
                          style={{
                            default: {
                              fill: fillColor,
                              stroke: isSelected
                                ? "hsl(210, 100%, 30%)"
                                : "hsl(210, 10%, 70%)",
                              strokeWidth: isSelected ? 1.5 : 0.75,
                              outline: "none",
                              transition:
                                "fill 0.2s ease-in-out, stroke 0.2s ease-in-out",
                            },
                            hover: {
                              fill: fillColor,
                              stroke: "hsl(210, 100%, 40%)",
                              strokeWidth: 1.5,
                              outline: "none",
                              cursor: "pointer",
                              filter: "brightness(1.1)",
                            },
                            pressed: {
                              fill: fillColor,
                              stroke: "hsl(210, 100%, 20%)",
                              strokeWidth: 1.75,
                              outline: "none",
                              filter: "brightness(0.9)",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
            </ComposableMap>
            
            {/* State Hover Tooltip */}
            {hoveredStateName && mousePosition && (() => {
              const stateData = getHoveredStateData();
              return stateData ? (
                <div
                  className="fixed z-50 pointer-events-none bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs"
                  style={{
                    left: mousePosition.x + 10,
                    top: mousePosition.y - 10,
                    transform: mousePosition.x > window.innerWidth - 200 ? 'translateX(-100%)' : undefined
                  }}
                >
                  <div className="font-semibold text-sm mb-1">{stateData.stateName}</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{stateData.clientCount} clients</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        {formatAUM(stateData.totalAum)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>

        {/* Client List Table Card - Always rendered, content changes */}
        <Card className="flex flex-col h-[calc(100vh-300px)]">
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>{tableTitle}</CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                <Users className="inline h-4 w-4 mr-1" /> {summaryClientCount}{" "}
                Clients
              </span>
              <span>
                <DollarSign className="inline h-4 w-4 mr-1" />{" "}
                {formatAUM(summaryTotalAum)}
              </span>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, segment, or AUM..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-auto">
            <div className="rounded-md border m-6">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('aum')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        AUM
                        {sortConfig.key === 'aum' && (
                          sortConfig.direction === 'desc' ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronUp className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {clientsInSelectedState.length > 0 ? (
                  clientsInSelectedState.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border whitespace-nowrap ${getSegmentClass(
                            client.segment
                          )}`}
                        >
                          {client.segment}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAUM(client.aum)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm">
                          View Client
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      {emptyTableMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ClientDistributionByStateReport;
