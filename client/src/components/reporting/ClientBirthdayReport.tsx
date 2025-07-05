import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateFormatter";
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
  Search,
  CalendarDays,
  DollarSign,
  Users,
  ExternalLink,
  Star,
  ChevronUp,
  ChevronDown,
} from "lucide-react"; // Added ChevronUp, ChevronDown for sorting indicators
import {
  getClients,
  type BirthdayClient,
  type BirthdayReportFilters as ReportFilterOptions,
} from "@/lib/clientData";
import { getBirthdayClients, formatAUM } from "@/utils/client-analytics";

import { useAdvisor } from "@/contexts/AdvisorContext";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { filtersToApiParams } from "@/utils/filter-utils";
import { FilteredReportSkeleton } from "@/components/ui/skeleton";
import { ViewContactButton } from "@/components/ui/view-contact-button";

// Define type for sort configuration
type SortConfig = {
  key: keyof BirthdayClient | "";
  direction: "asc" | "desc";
};

// Define Grade colors - Updated for light backgrounds and dark text
const GRADE_COLORS: Record<
  string,
  { badgeBg: string; badgeText: string; badgeBorder: string }
> = {
  Platinum: {
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800",
    badgeBorder: "border-blue-200",
  },
  Gold: {
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-800",
    badgeBorder: "border-yellow-200",
  },
  Silver: {
    badgeBg: "bg-gray-50",
    badgeText: "text-gray-800",
    badgeBorder: "border-gray-200",
  },
  Bronze: {
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-800",
    badgeBorder: "border-orange-200",
  },
  "N/A": {
    badgeBg: "bg-gray-50",
    badgeText: "text-gray-800",
    badgeBorder: "border-gray-200",
  },
  Default: {
    badgeBg: "bg-gray-50",
    badgeText: "text-gray-800",
    badgeBorder: "border-gray-200",
  },
};

const getGradeBadgeClasses = (grade: string) => {
  return GRADE_COLORS[grade] || GRADE_COLORS.Default;
};

// Define milestone ages
const MILESTONE_AGES = [20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * Check if an age is a milestone age
 * @param age - The age to check
 * @returns boolean indicating if the age is a milestone
 */
const isMilestoneAge = (age: number): boolean => {
  return MILESTONE_AGES.includes(age);
};

/**
 * Sort clients by their next upcoming birthday
 * @param clients - Array of birthday clients
 * @returns Sorted array with upcoming birthdays first
 */
const sortByUpcomingBirthday = (
  clients: BirthdayClient[]
): BirthdayClient[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  return clients.sort((a, b) => {
    // Parse the date of birth to get month and day
    const dateA = new Date(a.dateOfBirth);
    const dateB = new Date(b.dateOfBirth);

    // Create this year's birthday dates
    const thisYearBirthdayA = new Date(
      today.getFullYear(),
      dateA.getMonth(),
      dateA.getDate()
    );
    const thisYearBirthdayB = new Date(
      today.getFullYear(),
      dateB.getMonth(),
      dateB.getDate()
    );

    // If birthday has passed this year, use next year's date
    const upcomingBirthdayA =
      thisYearBirthdayA >= today
        ? thisYearBirthdayA
        : new Date(today.getFullYear() + 1, dateA.getMonth(), dateA.getDate());
    const upcomingBirthdayB =
      thisYearBirthdayB >= today
        ? thisYearBirthdayB
        : new Date(today.getFullYear() + 1, dateB.getMonth(), dateB.getDate());

    return upcomingBirthdayA.getTime() - upcomingBirthdayB.getTime();
  });
};

const MONTH_OPTIONS = [
  { value: "Any month", label: "Any month" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const TENURE_OPTIONS = [
  { value: "Any tenure", label: "Any tenure" },
  { value: "1-2 years", label: "1-2 years" },
  { value: "2-5 years", label: "2-5 years" },
  { value: "5-10 years", label: "5-10 years" },
  { value: "10+ years", label: "10+ years" },
];

const ClientBirthdayReport = () => {
  const { selectedAdvisor } = useAdvisor();
  const { filters } = useReportFilters();

  const [allReportData, setAllReportData] = useState<BirthdayClient[]>([]); // Store all data
  const [filteredReportData, setFilteredReportData] = useState<
    BirthdayClient[]
  >([]); // Store filtered data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nextBirthdayDisplay",
    direction: "asc",
  });

  // Local filter states for birthday-specific filters ONLY
  // NOTE: Advisor and Segment filters are handled by the sidebar (useReportFilters)
  const [nameSearch, setNameSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Any month");
  const [selectedTenure, setSelectedTenure] = useState("Any tenure");
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);

  // Function to handle column sorting
  const requestSort = (key: keyof BirthdayClient) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: keyof BirthdayClient) => {
    if (sortConfig.key !== columnName) {
      return null;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1 text-blue-600" />
    );
  };

  // Note: Segment and Advisor filtering is handled by sidebar filters
  // No need for local dropdowns since they would conflict with global filters

  // Client-side filtering for birthday-specific filters ONLY
  // NOTE: Advisor and Segment filtering is handled by sidebar → server-side via API
  const applyFilters = () => {
    let filtered = [...allReportData];

    // Apply name search filter
    if (nameSearch.trim()) {
      const searchLower = nameSearch.toLowerCase();
      filtered = filtered.filter((client) =>
        client.clientName.toLowerCase().includes(searchLower)
      );
    }

    // Apply month filter (birthday-specific)
    if (selectedMonth !== "Any month") {
      const monthNumber = parseInt(selectedMonth);
      filtered = filtered.filter((client) => {
        const birthMonth = new Date(client.dateOfBirth).getMonth() + 1; // getMonth() is 0-based
        return birthMonth === monthNumber;
      });
    }

    // Apply tenure filter (birthday-specific)
    if (selectedTenure !== "Any tenure") {
      filtered = filtered.filter((client) => {
        const tenure = client.clientTenure;
        switch (selectedTenure) {
          case "1-2 years":
            return tenure.includes("1 year") || tenure.includes("2 year");
          case "2-5 years":
            return ["2", "3", "4", "5"].some((year) =>
              tenure.includes(`${year} year`)
            );
          case "5-10 years":
            return ["5", "6", "7", "8", "9", "10"].some((year) =>
              tenure.includes(`${year} year`)
            );
          case "10+ years":
            return [
              "10",
              "11",
              "12",
              "13",
              "14",
              "15",
              "16",
              "17",
              "18",
              "19",
              "20",
            ].some(
              (year) => tenure.includes(`${year} year`) || parseInt(tenure) > 10
            );
          default:
            return true;
        }
      });
    }

    // Apply milestone filter (birthday-specific)
    if (showMilestonesOnly) {
      filtered = filtered.filter(
        (client) => client.turningAge > 0 && isMilestoneAge(client.turningAge)
      );
    }

    // Apply sorting
    if (sortConfig.key !== "") {
      filtered.sort((a, b) => {
        const key = sortConfig.key as keyof BirthdayClient;
        const direction = sortConfig.direction === "asc" ? 1 : -1;

        // Handle date fields
        if (key === "dateOfBirth" || key === "nextBirthdayDisplay") {
          return (
            (new Date(a[key]).getTime() - new Date(b[key]).getTime()) *
            direction
          );
        }

        // Handle numeric fields
        if (typeof a[key] === "number" && typeof b[key] === "number") {
          return ((a[key] as number) - (b[key] as number)) * direction;
        }

        // Handle AUM which might need special formatting
        if (key === "aum") {
          return ((a.aum || 0) - (b.aum || 0)) * direction;
        }

        // Handle string fields
        const valueA = String(a[key] || "").toLowerCase();
        const valueB = String(b[key] || "").toLowerCase();
        return valueA.localeCompare(valueB) * direction;
      });
    } else {
      // Default sort by upcoming birthday if no sort specified
      filtered = sortByUpcomingBirthday(filtered);
    }

    setFilteredReportData(filtered);
  };

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build API parameters with global filters
        const params = filtersToApiParams(filters, selectedAdvisor);

        // Use the centralized getClients function
        const clients = await getClients(params);

        if (clients && clients.length > 0) {
          // Use the frontend analytics utility to calculate birthday data
          const birthdayClients = getBirthdayClients(clients);
          setAllReportData(birthdayClients);
        } else {
          console.warn("No clients data received, using empty array");
          setAllReportData([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load birthday report data";
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [selectedAdvisor, filters]); // Re-fetch when filters change

  console.log("allReportData", allReportData);
  // Apply filters whenever filter criteria or data changes
  useEffect(() => {
    applyFilters();
  }, [
    allReportData,
    nameSearch,
    selectedMonth,
    selectedTenure,
    showMilestonesOnly,
    sortConfig, // Re-apply filters when sort changes
  ]);

  const handleResetFilters = () => {
    setNameSearch("");
    setSelectedMonth("Any month");
    setSelectedTenure("Any tenure");
    setShowMilestonesOnly(false);
    setSortConfig({ key: "nextBirthdayDisplay", direction: "asc" }); // Reset sort to default
  };

  if (isLoading && allReportData.length === 0 && !error) {
    return <FilteredReportSkeleton />;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Client Birthday Dashboard
          </CardTitle>
          <p className="text-gray-600 mt-3 text-base">
            View your clients' upcoming birthdays in a sortable table format.
            Filter by client details to find the information you need.
          </p>
        </CardHeader>
      </Card>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Birthday-Specific Filters
          </CardTitle>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Use the sidebar for Advisor and Segment filters. Additional
              birthday-specific filters below:
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
                <Switch
                  id="show-milestones"
                  checked={showMilestonesOnly}
                  onCheckedChange={setShowMilestonesOnly}
                />
                <Label
                  htmlFor="show-milestones"
                  className="text-sm font-medium text-gray-700"
                >
                  Show Milestones
                </Label>
              </div>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
              <Input
                placeholder="Search by name..."
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200">
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTenure} onValueChange={setSelectedTenure}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200">
                <SelectValue placeholder="Any tenure" />
              </SelectTrigger>
              <SelectContent>
                {TENURE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Upcoming Client Birthdays
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            {filteredReportData.length} client
            {filteredReportData.length !== 1 ? "s" : ""} found
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 text-center text-gray-500">
              Updating results...
            </div>
          )}
          {!isLoading && filteredReportData.length === 0 && (
            <div className="text-center text-gray-500 py-12 px-6">
              No clients match the current filters or no birthday data
              available.
            </div>
          )}
          {!isLoading && filteredReportData.length > 0 && (
            <div className="border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => requestSort("clientName")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Client {getSortDirectionIcon("clientName")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("grade")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Grade {getSortDirectionIcon("grade")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("dateOfBirth")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Date of Birth {getSortDirectionIcon("dateOfBirth")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("nextBirthdayDisplay")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Next Birthday{" "}
                      {getSortDirectionIcon("nextBirthdayDisplay")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("turningAge")}
                      className="cursor-pointer hover:bg-muted/80 text-center"
                    >
                      Turning Age {getSortDirectionIcon("turningAge")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("aum")}
                      className="cursor-pointer hover:bg-muted/80 text-right"
                    >
                      AUM {getSortDirectionIcon("aum")}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("clientTenure")}
                      className="cursor-pointer hover:bg-muted/80"
                    >
                      Client Tenure {getSortDirectionIcon("clientTenure")}
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
                  {sortByUpcomingBirthday(filteredReportData).map((client) => {
                    const gradeClasses = getGradeBadgeClasses(client.grade);
                    return (
                      <TableRow
                        key={client.id}
                        className="hover:bg-blue-50 border-b border-gray-100 transition-all duration-200 hover:shadow-sm group cursor-pointer"
                      >
                        <TableCell className="font-medium text-gray-900 py-4 group-hover:text-blue-700 transition-colors duration-200">
                          {client.clientName}
                        </TableCell>
                        <TableCell className="py-4">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${gradeClasses.badgeBg} ${gradeClasses.badgeText} ${gradeClasses.badgeBorder}`}
                          >
                            {client.grade}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                            <CalendarDays className="mr-2 h-4 w-4 text-blue-600" />
                            {formatDate(client.dateOfBirth)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                              {client.nextBirthdayDisplay}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                client.nextBirthdayDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center">
                            {client.turningAge === 0 ? (
                              <span className="text-gray-500 font-medium">
                                N/A
                              </span>
                            ) : (
                              <>
                                {client.turningAge > 0 &&
                                  isMilestoneAge(client.turningAge) && (
                                    <Star className="mr-1.5 h-4 w-4 text-yellow-500" />
                                  )}
                                <span
                                  className={`font-medium ${
                                    client.turningAge > 0 &&
                                    isMilestoneAge(client.turningAge)
                                      ? "text-yellow-600 font-bold"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {client.turningAge}
                                </span>
                                {client.turningAge > 0 &&
                                  isMilestoneAge(client.turningAge) && (
                                    <span className="ml-1.5 text-xs text-yellow-600 font-semibold">
                                      MILESTONE
                                    </span>
                                  )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                            <DollarSign className="mr-2 h-4 w-4 text-blue-600" />
                            {formatAUM(client.aum)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                            <Users className="mr-2 h-4 w-4 text-blue-600" />
                            {client.clientTenure}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                            <Users className="mr-2 h-4 w-4 text-blue-600" />
                            {client.advisorName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <ViewContactButton
                            clientId={client.id}
                            wealthboxClientId={client.wealthboxClientId}
                            orionClientId={client.orionClientId}
                          />
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
};

export default ClientBirthdayReport;
