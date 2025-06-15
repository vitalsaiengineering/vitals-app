import React, { useState, useEffect, useMemo } from "react";
import {
  getClientDistributionReportData,
  type ClientDistributionReportData,
  type ClientInStateDetail,
  type StateMetric,
} from "@/lib/clientData";
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
import { Users, DollarSign, Search, Building } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useMockData } from "@/contexts/MockDataContext";

// Import mock data
import mockData from "@/data/mockData.js";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type MapViewType = "clientDensity" | "totalAssets";

const getSegmentClass = (segment: string) => {
  const s = segment.toLowerCase();
  if (s.includes("ultra high net worth"))
    return "bg-purple-100 text-purple-700 border-purple-300";
  if (s.includes("high net worth"))
    return "bg-blue-100 text-blue-700 border-blue-300";
  if (s.includes("mass affluent"))
    return "bg-green-100 text-green-700 border-green-300";
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
  const { useMock } = useMockData();
  const [reportData, setReportData] =
    useState<ClientDistributionReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStateMetric, setSelectedStateMetric] =
    useState<StateMetric | null>(null); // Null for "All Clients" view
  const [mapViewType, setMapViewType] = useState<MapViewType>("clientDensity");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (useMock) {
          // Use mock data
          const mockReportData =
            mockData.ClientDistributionByState as ClientDistributionReportData;
          setReportData(mockReportData);
        } else {
          // Try to fetch from API, fallback to mock data on error
          try {
            const data = await getClientDistributionReportData();
            setReportData(data);
          } catch (apiError) {
            console.warn(
              "API fetch failed, falling back to mock data:",
              apiError
            );
            const mockReportData =
              mockData.ClientDistributionByState as ClientDistributionReportData;
            setReportData(mockReportData);
          }
        }
        // Initially, selectedStateMetric is null, showing "All Clients"
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
  }, [useMock]);

  const allClientsFromReport = useMemo(() => {
    if (!reportData) return [];
    return Object.values(reportData.clientDetailsByState).flat();
  }, [reportData]);

  const clientsToDisplayPreSearch = useMemo(() => {
    if (!reportData) return [];
    if (selectedStateMetric) {
      // For real states, gets clients. For synthetic states, stateCode (geoId) won't match,
      // so reportData.clientDetailsByState[selectedStateMetric.stateCode] will be undefined,
      // correctly defaulting to [].
      return (
        reportData.clientDetailsByState[selectedStateMetric.stateCode] || []
      );
    }
    return allClientsFromReport; // "All Clients" view
  }, [reportData, selectedStateMetric, allClientsFromReport]);

  const clientsInSelectedState = useMemo(() => {
    if (clientsToDisplayPreSearch.length === 0) return [];
    if (!searchTerm) return clientsToDisplayPreSearch;

    return clientsToDisplayPreSearch.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.aum.toString().includes(searchTerm)
    );
  }, [clientsToDisplayPreSearch, searchTerm]);

  const handleStateSelectFromMap = (geoName: string, geoId: string) => {
    // geoName is already uppercased from map logic
    const stateData = reportData?.stateMetrics.find(
      (s) => s.stateName.toUpperCase() === geoName
    );

    if (stateData) {
      setSelectedStateMetric(stateData);
    } else {
      // Create a synthetic StateMetric for states not in our data
      setSelectedStateMetric({
        stateName: geoName, // Use the uppercased name from the map geography
        stateCode: geoId, // Use FIPS code from geo.id as a unique code
        clientCount: 0,
        totalAum: 0,
        // Ensure all fields of StateMetric are present if it has more
      });
    }
    setSearchTerm("");
  };

  const tableTitle = selectedStateMetric
    ? `${selectedStateMetric.stateName} CLIENTS` // Displaying state name in uppercase as per image
    : "ALL CLIENTS";

  const summaryClientCount = selectedStateMetric
    ? selectedStateMetric.clientCount // Will be 0 for synthetic states
    : allClientsFromReport.length;

  const summaryTotalAum = selectedStateMetric
    ? selectedStateMetric.totalAum // Will be 0 for synthetic states
    : allClientsFromReport.reduce((sum, client) => sum + client.aum, 0);

  let emptyTableMessage = "No data to display.";
  if (clientsInSelectedState.length === 0) {
    if (selectedStateMetric) {
      if (searchTerm) {
        emptyTableMessage = `No clients match your search in ${selectedStateMetric.stateName}.`;
      } else {
        // This covers real states with 0 clients and synthetic states (which have clientCount=0).
        emptyTableMessage = `No client data available for ${selectedStateMetric.stateName}.`;
      }
    } else {
      // All clients view
      emptyTableMessage = searchTerm
        ? "No clients match your search."
        : reportData && allClientsFromReport.length === 0
        ? "No clients found in the report."
        : "No clients match your search criteria.";
    }
  }

  if (isLoading)
    return (
      <div className="p-6 text-center">Loading client distribution data...</div>
    );
  if (error || !reportData)
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error || "Could not load data."}
      </div>
    );

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
              {reportData.topStateByAUM.value}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>Client Distribution Map</CardTitle>
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
        <CardContent className="aspect-[16/7]">
          <ComposableMap projection="geoAlbersUsa" className="w-full h-full">
            <ZoomableGroup center={[0, 0]} zoom={1}>
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
                        onMouseEnter={() => setHoveredStateName(geoMatchName)}
                        onMouseLeave={() => setHoveredStateName(null)}
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
            </ZoomableGroup>
          </ComposableMap>
        </CardContent>
      </Card>

      {/* Client List Table Card - Always rendered, content changes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>{tableTitle}</CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                <Users className="inline h-4 w-4 mr-1" /> {summaryClientCount}{" "}
                Clients
              </span>
              <span>
                <DollarSign className="inline h-4 w-4 mr-1" />{" "}
                {summaryTotalAum.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
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
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">AUM</TableHead>
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
                          className={`px-2 py-0.5 text-xs rounded-full border ${getSegmentClass(
                            client.segment
                          )}`}
                        >
                          {client.segment}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {client.aum.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDistributionByStateReport;
