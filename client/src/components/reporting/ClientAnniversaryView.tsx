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
import {
  ExternalLink,
  User,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { StandardClient } from "@/types/client";
import { getClients } from "@/lib/clientData";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { filtersToApiParams } from "@/utils/filter-utils";
import { getPrettyClientName, getSegmentName } from "@/utils/client-analytics";

import { useAdvisor } from "@/contexts/AdvisorContext";
import { ViewContactButton } from "@/components/ui/view-contact-button";

import { getAdvisorReportTitle } from "@/lib/utils";

// Define type for sort configuration
type SortConfig = {
  key: keyof AnniversaryClient | "";
  direction: "asc" | "desc";
};

// Define transformed interfaces for compatibility
interface AnniversaryClient {
  id: string;
  clientName: string;
  segment: string;
  anniversaryDate: string;
  daysUntilNextAnniversary: number;
  yearsWithFirm: number;
  advisorName: string;
  advisorId: string;
  wealthboxClientId?: string;
  orionClientId?: string;
}

interface AnniversaryFilterOptions {
  segments: string[];
  tenures: string[];
  advisors: { id: string; name: string }[];
}

// Data transformation utilities
const transformToAnniversaryClient = (
  client: StandardClient
): AnniversaryClient => {
  // Handle case where inception date is not available
  if (!client.inceptionDate) {
    return {
      id: client.id,
      clientName: getPrettyClientName(client),
      segment: getSegmentName(client.segment),
      anniversaryDate: "", // Empty for N/A
      daysUntilNextAnniversary: 0, // No meaningful anniversary
      yearsWithFirm: 0, // No meaningful tenure
      advisorName: client.advisor || "N/A",
      advisorId: client.primaryAdvisorId || "N/A",
    };
  }

  const inceptionDate = new Date(client.inceptionDate);
  const today = new Date();
  const currentYear = today.getFullYear();

  // Calculate anniversary date for this year
  const anniversaryThisYear = new Date(
    currentYear,
    inceptionDate.getMonth(),
    inceptionDate.getDate()
  );

  // If anniversary already passed this year, calculate for next year
  let nextAnniversary = anniversaryThisYear;
  if (anniversaryThisYear < today) {
    nextAnniversary = new Date(
      currentYear + 1,
      inceptionDate.getMonth(),
      inceptionDate.getDate()
    );
  }

  // Calculate days until next anniversary
  const daysUntil = Math.ceil(
    (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate years with firm
  const yearsWithFirm = Math.floor(
    (today.getTime() - inceptionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  return {
    id: client.id,
    clientName: getPrettyClientName(client),
    segment: getSegmentName(client.segment),
    anniversaryDate: client.inceptionDate,
    daysUntilNextAnniversary: daysUntil,
    yearsWithFirm: Math.max(yearsWithFirm, 1), // Minimum 1 year
    advisorName: client.advisor || "N/A",
    advisorId: client.primaryAdvisorId || "N/A",
    wealthboxClientId: client.wealthboxClientId,
    orionClientId: client.orionClientId,
  };
};

const generateFilterOptions = (
  clients: StandardClient[]
): AnniversaryFilterOptions => {
  const segments = Array.from(
    new Set(clients.map((c) => getSegmentName(c.segment)))
  );
  const advisors = Array.from(
    new Set(clients.map((c) => ({ id: c.primaryAdvisorId, name: c.advisor })))
  ).filter((a) => a.id && a.name);

  return {
    segments: ["All Segments", ...segments.sort()],
    tenures: [
      "Any Tenure",
      "1-2 years",
      "3-5 years",
      "6-10 years",
      "10+ years",
    ],
    advisors: [{ id: "all", name: "All Advisors" }, ...advisors],
  };
};

// Grade badge colors - updated to modern light backgrounds
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
    Platinum: { badgeBg: "bg-blue-50", badgeText: "text-blue-800" },
    Gold: { badgeBg: "bg-yellow-50", badgeText: "text-yellow-800" },
    Silver: { badgeBg: "bg-gray-50", badgeText: "text-gray-800" },
    Default: { badgeBg: "bg-gray-50", badgeText: "text-gray-800" },
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
      year: "numeric",
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
  const [allAnniversaryData, setAllAnniversaryData] = useState<
    AnniversaryClient[]
  >([]); // Store all data
  const [filteredAnniversaryData, setFilteredAnniversaryData] = useState<
    AnniversaryClient[]
  >([]); // Store filtered data
  const [localFilterOptions, setLocalFilterOptions] =
    useState<AnniversaryFilterOptions>({
      segments: [],
      tenures: [],
      advisors: [],
    });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "daysUntilNextAnniversary",
    direction: "asc",
  });

  // Filter states
  const [selectedSegment, setSelectedSegment] = useState("All Segments");
  const [selectedTenure, setSelectedTenure] = useState("Any Tenure");
  const [showUpcomingMilestones, setShowUpcomingMilestones] = useState(false);

  // Get contexts
  const { selectedAdvisor } = useAdvisor();
  const { filters, filterOptions } = useReportFilters();

  // Fetch data using centralized approach
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build API parameters with filters from context
        const params = filtersToApiParams(filters, selectedAdvisor);

        // Use the centralized getClients function
        const clients = await getClients(params);

        // Transform clients data into anniversary format
        const anniversaryClients = clients.map(transformToAnniversaryClient);
        setAllAnniversaryData(anniversaryClients);

        // Generate filter options from the client data
        const options = generateFilterOptions(clients);
        setLocalFilterOptions(options);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load anniversary data";
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters, selectedAdvisor]);

  // Function to handle column sorting
  const requestSort = (key: keyof AnniversaryClient) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: keyof AnniversaryClient) => {
    if (sortConfig.key !== columnName) {
      return null;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1 text-blue-600" />
    );
  };

  // Client-side filtering function (now for display filters only since server handles main filtering)
  const applyDisplayFilters = () => {
    let filtered = [...allAnniversaryData];

    // Apply global search filter
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.clientName.toLowerCase().includes(searchLower) ||
          client.advisorName.toLowerCase().includes(searchLower)
      );
    }

    // Apply segment filter
    if (selectedSegment !== "All Segments") {
      filtered = filtered.filter(
        (client) => client.segment === selectedSegment
      );
    }

    // Apply tenure filter
    if (selectedTenure !== "Any Tenure") {
      filtered = filtered.filter((client) => {
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

    // Apply upcoming milestones filter
    if (showUpcomingMilestones) {
      filtered = filtered.filter((client) =>
        isMilestoneAnniversary(client.yearsWithFirm)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const key = sortConfig.key as keyof AnniversaryClient;
        const direction = sortConfig.direction === "asc" ? 1 : -1;

        // Handle numeric fields
        if (key === "daysUntilNextAnniversary" || key === "yearsWithFirm") {
          return (a[key] - b[key]) * direction;
        }

        // Handle date fields
        if (key === "anniversaryDate") {
          // Handle empty dates
          if (!a[key] && !b[key]) return 0;
          if (!a[key]) return direction;
          if (!b[key]) return -direction;

          return (
            (new Date(a[key]).getTime() - new Date(b[key]).getTime()) *
            direction
          );
        }

        // Handle string fields
        const valueA = String(a[key] || "").toLowerCase();
        const valueB = String(b[key] || "").toLowerCase();
        return valueA.localeCompare(valueB) * direction;
      });
    }

    return filtered;
  };

  // Get filtered clients for display
  const displayClients = applyDisplayFilters();

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  // Use the properly filtered data from client-side filtering
  const filteredClients = displayClients;

  return (
    <div className="space-y-6">
      {/* Search bar at top - enhanced design */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main card with table - enhanced design */}
      <Card className="border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {getAdvisorReportTitle(
                  "Client Anniversary Dates",
                  filters,
                  filterOptions || undefined
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs border border-blue-200">
                  {displayClients.length} records
                </span>
                {showUpcomingMilestones && (
                  <span className="ml-2 text-yellow-700">
                    • Milestone anniversaries (5+ year increments)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Switch
                id="upcoming-milestones"
                checked={showUpcomingMilestones}
                onCheckedChange={setShowUpcomingMilestones}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label
                htmlFor="upcoming-milestones"
                className="text-sm whitespace-nowrap text-amber-700 font-medium"
              >
                Show Upcoming Milestones
              </Label>
            </div>
          </div>
        </CardHeader>

        {/* Filter row - enhanced design */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="p-1 bg-blue-50 rounded-md">
              <Filter className="h-4 w-4 text-blue-600" />
            </div>
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-36 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                {localFilterOptions?.segments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTenure} onValueChange={setSelectedTenure}>
              <SelectTrigger className="w-36 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Tenure" />
              </SelectTrigger>
              <SelectContent>
                {localFilterOptions?.tenures.map((tenure) => (
                  <SelectItem key={tenure} value={tenure}>
                    {tenure}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Table - enhanced design */}
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              Loading anniversary data...
            </div>
          )}
          {!isLoading && filteredClients.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No clients match the current filters.
            </div>
          )}
          {!isLoading && filteredClients.length > 0 && (
            <div className="rounded-lg border-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead
                      onClick={() => requestSort("clientName")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Client {getSortDirectionIcon("clientName")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("segment")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Segment {getSortDirectionIcon("segment")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("anniversaryDate")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Anniversary Date {getSortDirectionIcon("anniversaryDate")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("daysUntilNextAnniversary")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Days Until{" "}
                      {getSortDirectionIcon("daysUntilNextAnniversary")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("yearsWithFirm")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Years with Firm {getSortDirectionIcon("yearsWithFirm")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("advisorName")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Advisor {getSortDirectionIcon("advisorName")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients
                    .sort(
                      (a, b) =>
                        a.daysUntilNextAnniversary - b.daysUntilNextAnniversary
                    )
                    .map((client) => {
                      const gradeClasses = getGradeBadgeClasses(client.segment);
                      const isHighlighted = highlightedRowId === client.id;
                      const isMilestone = isMilestoneAnniversary(
                        client.yearsWithFirm
                      );

                      return (
                        <TableRow
                          key={client.id}
                          className={
                            isMilestone
                              ? "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 transition-all duration-200 group"
                              : isHighlighted
                              ? "bg-blue-50 hover:bg-blue-100 transition-all duration-200 group"
                              : "hover:bg-blue-50/50 transition-all duration-200 group"
                          }
                          onMouseEnter={() => setHighlightedRowId(client.id)}
                          onMouseLeave={() => setHighlightedRowId(null)}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900 group-hover:text-blue-900">
                                {client.clientName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full border ${gradeClasses.badgeBg} ${gradeClasses.badgeText}`}
                            >
                              {client.segment}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-gray-100 rounded-full">
                                <svg
                                  className="w-3.5 h-3.5 text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <span className="text-gray-700">
                                {client.anniversaryDate
                                  ? formatDateToUS(client.anniversaryDate)
                                  : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-900">
                              {client.anniversaryDate
                                ? client.daysUntilNextAnniversary === 1
                                  ? "1 day"
                                  : `${client.daysUntilNextAnniversary} days`
                                : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                isMilestone
                                  ? "font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full text-xs"
                                  : "font-medium text-gray-900"
                              }
                            >
                              {client.anniversaryDate
                                ? client.yearsWithFirm === 1
                                  ? "1 year"
                                  : `${client.yearsWithFirm} years`
                                : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-700">
                              {client.advisorName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="opacity-70 group-hover:opacity-100 transition-all duration-200">
                              <ViewContactButton
                                clientId={client.id}
                                wealthboxClientId={client.wealthboxClientId}
                                orionClientId={client.orionClientId}
                              />
                            </div>
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
