import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ExternalLink, User, Search, Filter } from "lucide-react";
import {
  getClientAnniversaryData,
  type ClientAnniversaryData,
  type AnniversaryClient,
  type GetClientAnniversaryParams,
} from "@/lib/clientData";
import { useMockData } from "@/contexts/MockDataContext";
import { useAdvisor } from "@/contexts/AdvisorContext";

// Import mock data
import mockData from "@/data/mockData.js";

// Grade badge colors
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
    Platinum: { badgeBg: "bg-blue-700", badgeText: "text-white" },
    Gold: { badgeBg: "bg-blue-600", badgeText: "text-white" },
    Silver: { badgeBg: "bg-blue-500", badgeText: "text-white" },
    Default: { badgeBg: "bg-gray-500", badgeText: "text-white" },
  };
  return GRADE_COLORS[grade] || GRADE_COLORS.Default;
};

/**
 * Determines if a client's years with firm represents a milestone anniversary
 * Milestone anniversaries are 5-year increments: 5, 10, 15, 20, 25, etc.
 */
const isMilestoneAnniversary = (yearsWithFirm: number): boolean => {
  return yearsWithFirm > 0 && yearsWithFirm % 5 === 0;
};

/**
 * Formats date to MM-DD-YYYY format for consistent US date display
 */
const formatDateToUS = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit", 
      year: "numeric"
    });
  } catch (error) {
    console.warn("Date formatting error:", error);
    return dateString;
  }
};

/**
 * Interface for ClientAnniversaryView component props
 */
interface ClientAnniversaryViewProps {
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

/**
 * ClientAnniversaryView Component
 * 
 * Displays client anniversary tracking with exact layout matching reference image
 * Features search bar at top, filter dropdowns, milestone toggle, and yellow highlighting
 * for milestone anniversaries using original data sources
 */
export default function ClientAnniversaryView({
  globalSearch,
  setGlobalSearch,
}: ClientAnniversaryViewProps) {
  const [allAnniversaryData, setAllAnniversaryData] = useState<AnniversaryClient[]>([]); // Store all data
  const [filteredAnniversaryData, setFilteredAnniversaryData] = useState<AnniversaryClient[]>([]); // Store filtered data
  const [filterOptions, setFilterOptions] = useState<{
    segments: string[];
    tenures: string[];
    advisors: { id: string; name: string }[];
  }>({
    segments: [],
    tenures: [],
    advisors: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Filter states
  const [selectedSegment, setSelectedSegment] = useState("All Segments");
  const [selectedTenure, setSelectedTenure] = useState("Any Tenure");
  const [showUpcomingMilestones, setShowUpcomingMilestones] = useState(false);

  // Get the selected advisor from context
  const { selectedAdvisor } = useAdvisor();

  const { useMock } = useMockData();

  /**
   * Fetches client anniversary data from API or mock data
   */
  const fetchAnniversaryData = async (params?: GetClientAnniversaryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        const mockAnniversaryData =
          mockData.ClientAnniversaryData as ClientAnniversaryData;
        
        // If an advisor is selected from the global context, filter the data
        let clients = mockAnniversaryData.clients;
        if (selectedAdvisor !== 'All Advisors') {
          // Filter clients by the selected advisor
          clients = clients.filter(
            (client) => {
              // Using advisorName field which should match the selectedAdvisor
              return client.advisorName === selectedAdvisor;
            }
          );
        }
        
        setAllAnniversaryData(clients);
        setFilterOptions(mockAnniversaryData.filterOptions);
      } else {
        try {
          const data = await getClientAnniversaryData();
          
          // If an advisor is selected from the global context, filter the data
          let clients = data.clients;
          if (selectedAdvisor !== 'All Advisors') {
            clients = clients.filter(
              (client) => client.advisorName === selectedAdvisor
            );
          }
          
          setAllAnniversaryData(clients);
          setFilterOptions(data.filterOptions);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockAnniversaryData =
            mockData.ClientAnniversaryData as ClientAnniversaryData;
          
          // If an advisor is selected from the global context, filter the data
          let clients = mockAnniversaryData.clients;
          if (selectedAdvisor !== 'All Advisors') {
            clients = clients.filter(
              (client) => client.advisorName === selectedAdvisor
            );
          }
          
          setAllAnniversaryData(clients);
          setFilterOptions(mockAnniversaryData.filterOptions);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load anniversary data";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering function
  const applyFilters = () => {
    let filtered = [...allAnniversaryData];

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("ClientAnniversaryView - Applying filters:", {
        totalClients: allAnniversaryData.length,
        globalSearch,
        selectedSegment,
        selectedTenure,
        showUpcomingMilestones,
      });
    }

    // Apply global search filter
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchLower) ||
        client.advisorName.toLowerCase().includes(searchLower)
      );
    }

    // Apply segment filter
    if (selectedSegment !== "All Segments") {
      filtered = filtered.filter(client => client.segment === selectedSegment);
    }

    // Apply tenure filter
    if (selectedTenure !== "Any Tenure") {
      filtered = filtered.filter(client => {
        // Implement tenure filtering logic based on the actual tenure options
        const years = client.yearsWithFirm;
        switch (selectedTenure) {
          case "1-2 years":
            return years >= 1 && years <= 2;
          case "3-5 years":
            return years >= 3 && years <= 5;
          case "6-10 years":
            return years >= 6 && years <= 10;
          case "10+ years":
            return years > 10;
          default:
            return true;
        }
      });
    }

    // Note: Advisor filtering is now handled at data fetch time using selectedAdvisor context

    // Apply upcoming milestones filter
    if (showUpcomingMilestones) {
      filtered = filtered.filter(client => isMilestoneAnniversary(client.yearsWithFirm));
    }

    // Debug logging for results
    if (process.env.NODE_ENV === "development") {
      console.log("ClientAnniversaryView - Filter results:", {
        filteredCount: filtered.length,
        sampleTenures: filtered.slice(0, 5).map(c => ({ name: c.clientName, tenure: c.yearsWithFirm, segment: c.segment })),
        selectedFilters: { selectedSegment, selectedTenure, showUpcomingMilestones }
      });
    }

    setFilteredAnniversaryData(filtered);
  };

  useEffect(() => {
    fetchAnniversaryData(); // Initial fetch
  }, [useMock, selectedAdvisor]);

  // Apply filters whenever filter criteria or data changes
  useEffect(() => {
    applyFilters();
  }, [
    allAnniversaryData,
    globalSearch,
    selectedSegment,
    selectedTenure,
    showUpcomingMilestones,
  ]);

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  // Use the properly filtered data from client-side filtering
  const filteredClients = filteredAnniversaryData;

  return (
    <div className="space-y-6">
      {/* Search bar at top - exact positioning from reference */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main card with table - exact layout match */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl">
                  {selectedAdvisor !== "All Advisors" 
                    ? `${selectedAdvisor}'s Client Anniversary Dates` 
                    : "Client Anniversary Dates"}
                </CardTitle>              
              <p className="text-sm text-muted-foreground mt-1">
                {filteredAnniversaryData.length} records
                {showUpcomingMilestones && " • Milestone anniversaries (5+ year increments)"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="upcoming-milestones"
                checked={showUpcomingMilestones}
                onCheckedChange={setShowUpcomingMilestones}
              />
              <Label htmlFor="upcoming-milestones" className="text-sm whitespace-nowrap">
                Show Upcoming Milestones
              </Label>
            </div>
          </div>
        </CardHeader>

        {/* Filter row */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.segments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTenure} onValueChange={setSelectedTenure}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tenure" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.tenures.map((tenure) => (
                  <SelectItem key={tenure} value={tenure}>
                    {tenure}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Advisor" />
              </SelectTrigger>
              <SelectContent>
                {anniversaryData?.filterOptions.advisors.map((advisor) => (
                  <SelectItem key={advisor.id} value={advisor.id}>
                    {advisor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>
        </div>

        <CardContent className="p-0">
          {/* Table */}
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Loading anniversary data...
            </div>
          )}
          {!isLoading && filteredClients.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No clients match the current filters.
            </div>
          )}
          {!isLoading && filteredClients.length > 0 && (
            <div className="rounded-md border-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Client</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Anniversary Date</TableHead>
                    <TableHead>Days Until</TableHead>
                    <TableHead>Years with Firm</TableHead>
                    <TableHead>Advisor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients
                    .sort((a, b) => a.daysUntilNextAnniversary - b.daysUntilNextAnniversary)
                    .map((client) => {
                    const gradeClasses = getGradeBadgeClasses(client.segment);
                    const isHighlighted = highlightedRowId === client.id;
                    const isMilestone = isMilestoneAnniversary(client.yearsWithFirm);

                    return (
                      <TableRow
                        key={client.id}
                        className={
                          isMilestone 
                            ? "bg-[#FEF7CD] hover:bg-[#FEF1A4] border-yellow-300" 
                            : isHighlighted
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "hover:bg-gray-50"
                        }
                        onMouseEnter={() => setHighlightedRowId(client.id)}
                        onMouseLeave={() => setHighlightedRowId(null)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">
                              {client.clientName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-sm"
                              style={{ 
                                backgroundColor: client.segment === 'Platinum' ? '#1e40af' : 
                                                client.segment === 'Gold' ? '#3b82f6' : '#93c5fd'
                              }}
                            />
                            <span>{client.segment}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDateToUS(client.nextAnniversaryDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {client.daysUntilNextAnniversary === 1
                              ? "1 day"
                              : `${client.daysUntilNextAnniversary} days`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={isMilestone ? "font-semibold text-yellow-700" : "font-medium"}>
                            {client.yearsWithFirm === 1
                              ? "1 year"
                              : `${client.yearsWithFirm} years`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{client.advisorName}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            className="gap-1 bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => window.open(`/crm/contact/${client.id}`, '_blank')}
                          >
                            View Contact
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
