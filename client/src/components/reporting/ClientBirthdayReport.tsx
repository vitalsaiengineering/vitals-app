import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Search,
  CalendarDays,
  DollarSign,
  Users,
  ExternalLink,
  Star,
} from "lucide-react"; // Added Star icon for milestones
import {
  getClientBirthdayReportData,
  type ClientBirthdayReportData,
  type BirthdayClient,
  type GetClientBirthdayReportParams,
  type BirthdayReportFilters as ReportFilterOptions,
  filterClientsByAdvisor,
} from "@/lib/clientData";
import { useMockData } from "@/contexts/MockDataContext";
import { useAdvisor } from "@/contexts/AdvisorContext";

// Import mock data
import mockData from "@/data/mockData.js";

// Define Grade colors - Updated for blue backgrounds and white text
const GRADE_COLORS: Record<
  string,
  { badgeBg: string; badgeText: string; badgeBorder: string }
> = {
  Platinum: {
    badgeBg: "bg-blue-700",
    badgeText: "text-white",
    badgeBorder: "border-blue-700",
  }, // Darker blue
  Gold: {
    badgeBg: "bg-blue-600",
    badgeText: "text-white",
    badgeBorder: "border-blue-600",
  }, // Medium blue
  Silver: {
    badgeBg: "bg-blue-500",
    badgeText: "text-white",
    badgeBorder: "border-blue-500",
  }, // Lighter blue
  Bronze: {
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-200",
  }, // Kept for completeness
  Default: {
    badgeBg: "bg-gray-500",
    badgeText: "text-white",
    badgeBorder: "border-gray-500",
  }, // Default to a gray blue
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
const sortByUpcomingBirthday = (clients: BirthdayClient[]): BirthdayClient[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  return clients.sort((a, b) => {
    // Parse the date of birth to get month and day
    const dateA = new Date(a.dateOfBirth);
    const dateB = new Date(b.dateOfBirth);
    
    // Create this year's birthday dates
    const thisYearBirthdayA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
    const thisYearBirthdayB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
    
    // If birthday has passed this year, use next year's date
    const upcomingBirthdayA = thisYearBirthdayA >= today ? thisYearBirthdayA : 
      new Date(today.getFullYear() + 1, dateA.getMonth(), dateA.getDate());
    const upcomingBirthdayB = thisYearBirthdayB >= today ? thisYearBirthdayB : 
      new Date(today.getFullYear() + 1, dateB.getMonth(), dateB.getDate());
    
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
  const { useMock } = useMockData();
  const { selectedAdvisor } = useAdvisor();
  const [allReportData, setAllReportData] = useState<BirthdayClient[]>([]); // Store all data
  const [filteredReportData, setFilteredReportData] = useState<BirthdayClient[]>([]); // Store filtered data
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions>({
    grades: [],
    advisors: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [nameSearch, setNameSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [selectedMonth, setSelectedMonth] = useState("Any month");
  const [selectedTenure, setSelectedTenure] = useState("Any tenure");
  const [selectedReportAdvisor, setSelectedReportAdvisor] = useState("All Advisors");

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        // Use mock data
        const mockBirthdayData =
          mockData.ClientBirthdayReport as ClientBirthdayReportData;
        
        // If an advisor is selected from the header, filter the data
        let clients = mockBirthdayData.clients;
        if (selectedAdvisor !== 'All Advisors') {
          // Filter clients by the selected advisor from header
          clients = clients.filter(
            client => client.advisorName === selectedAdvisor
          );
        }
        
        setAllReportData(clients);
        setFilterOptions(mockBirthdayData.filters);
      } else {
        // Try to fetch from API, fallback to mock data on error
        try {
          const data = await getClientBirthdayReportData();
          
          // If an advisor is selected from the header, filter the data
          let clients = data.clients;
          if (selectedAdvisor !== 'All Advisors') {
            // Filter clients by the selected advisor from header
            clients = clients.filter(
              client => client.advisorName === selectedAdvisor
            );
          }
          
          setAllReportData(clients);
          setFilterOptions(data.filters);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockBirthdayData =
            mockData.ClientBirthdayReport as ClientBirthdayReportData;
          
          // If an advisor is selected from the header, filter the data
          let clients = mockBirthdayData.clients;
          if (selectedAdvisor !== 'All Advisors') {
            // Filter clients by the selected advisor from header
            clients = clients.filter(
              client => client.advisorName === selectedAdvisor
            );
          }
          
          setAllReportData(clients);
          setFilterOptions(mockBirthdayData.filters);
        }
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

  // Client-side filtering function
  const applyFilters = () => {
    let filtered = [...allReportData];

    // Apply name search filter
    if (nameSearch.trim()) {
      const searchLower = nameSearch.toLowerCase();
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchLower)
      );
    }

    // Apply grade filter
    if (selectedGrade !== "All Grades") {
      filtered = filtered.filter(client => client.grade === selectedGrade);
    }

    // Apply month filter
    if (selectedMonth !== "Any month") {
      const monthNumber = parseInt(selectedMonth);
      filtered = filtered.filter(client => {
        const birthMonth = new Date(client.dateOfBirth).getMonth() + 1; // getMonth() is 0-based
        return birthMonth === monthNumber;
      });
    }

    // Apply tenure filter
    if (selectedTenure !== "Any tenure") {
      filtered = filtered.filter(client => {
        const tenure = client.clientTenure;
        switch (selectedTenure) {
          case "1-2 years":
            return tenure.includes("1 year") || tenure.includes("2 year");
          case "2-5 years":
            return ["2", "3", "4", "5"].some(year => tenure.includes(`${year} year`));
          case "5-10 years":
            return ["5", "6", "7", "8", "9", "10"].some(year => tenure.includes(`${year} year`));
          case "10+ years":
            return ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"].some(year => 
              tenure.includes(`${year} year`) || parseInt(tenure) > 10
            );
          default:
            return true;
        }
      });
    }

    // Apply advisor filter (from the filter dropdown, not the header)
    if (selectedReportAdvisor !== "All Advisors") {
      filtered = filtered.filter(client => client.advisorName === selectedReportAdvisor);
    }

    setFilteredReportData(filtered);
  };

  useEffect(() => {
    fetchReportData(); // Initial fetch
  }, [useMock, selectedAdvisor]); // Re-fetch when selectedAdvisor changes

  // Apply filters whenever filter criteria or data changes
  useEffect(() => {
    applyFilters();
  }, [
    allReportData,
    nameSearch,
    selectedGrade,
    selectedMonth,
    selectedTenure,
    selectedReportAdvisor,
  ]);

  const handleResetFilters = () => {
    setNameSearch("");
    setSelectedGrade("All Grades");
    setSelectedMonth("Any month");
    setSelectedTenure("Any tenure");
    setSelectedReportAdvisor("All Advisors");
  };

  if (isLoading && allReportData.length === 0 && !error) {
    return <div className="p-6 text-center">Loading birthday report...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  const iconClasses = "mr-1.5 h-4 w-4 text-blue-600"; // Common class for blue icons

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Client Birthday Dashboard</CardTitle>
          <p className="text-muted-foreground">
            View your clients' upcoming birthdays in a sortable table format.
            Filter by client details to find the information you need.
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Filter Clients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-8"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Grades">All Grades</SelectItem>
                {filterOptions.grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
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
              <SelectTrigger>
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
            {/* <Select value={selectedReportAdvisor} onValueChange={setSelectedReportAdvisor}>
              <SelectTrigger>
                <SelectValue placeholder="All Advisors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Advisors">All Advisors</SelectItem>
                {filterOptions.advisors.map((adv) => (
                  <SelectItem key={adv} value={adv}>
                    {adv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Client Birthdays</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Updating results...
            </div>
          )}
          {!isLoading && filteredReportData.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No clients match the current filters or no birthday data
              available.
            </div>
          )}
          {!isLoading && filteredReportData.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Next Birthday</TableHead>
                    <TableHead className="text-center">Turning Age</TableHead>
                    <TableHead className="text-right">AUM</TableHead>
                    <TableHead>Client Tenure</TableHead>
                    <TableHead>Advisor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortByUpcomingBirthday(filteredReportData)
                    .map((client) => {
                    const gradeClasses = getGradeBadgeClasses(client.grade);
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.clientName}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md ${gradeClasses.badgeBg} ${gradeClasses.badgeText}`}
                          >
                            {" "}
                            {/* Removed border, adjusted padding */}
                            {client.grade}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarDays className={iconClasses} />
                            {new Date(client.dateOfBirth).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{client.nextBirthdayDisplay}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            {isMilestoneAge(client.turningAge) && (
                              <Star className="mr-1.5 h-4 w-4 text-yellow-500" />
                            )}
                            <span 
                              className={`font-medium ${
                                isMilestoneAge(client.turningAge) 
                                  ? 'text-yellow-600 font-bold' 
                                  : 'text-blue-600'
                              }`}
                            >
                              {client.turningAge}
                            </span>
                            {isMilestoneAge(client.turningAge) && (
                              <span className="ml-1.5 text-xs text-yellow-600 font-semibold">
                                MILESTONE
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <DollarSign className={iconClasses} />
                            {client.aum.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className={iconClasses} />{" "}
                            {/* People icon for tenure */}
                            {client.clientTenure}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className={iconClasses} />{" "}
                            {/* People icon for advisor */}
                            {client.advisorName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="default" size="sm">
                            View Contact
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
};

export default ClientBirthdayReport;
