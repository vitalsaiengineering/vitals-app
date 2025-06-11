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
} from "lucide-react"; // Updated imports
import {
  getClientBirthdayReportData,
  type ClientBirthdayReportData,
  type BirthdayClient,
  type GetClientBirthdayReportParams,
  type BirthdayReportFilters as ReportFilterOptions,
} from "@/lib/clientData";

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

export default function ClientBirthdayReport() {
  const [reportData, setReportData] = useState<BirthdayClient[]>([]);
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
  const [selectedAdvisor, setSelectedAdvisor] = useState("All Advisors");

  // Check if we should use mock data
  const useMock = import.meta.env.VITE_USE_MOCK_DATA !== "false";

  const fetchReportData = async (params?: GetClientBirthdayReportParams) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        // Use mock data
        const mockBirthdayData =
          mockData.ClientBirthdayReport as ClientBirthdayReportData;
        setReportData(mockBirthdayData.clients);
        setFilterOptions(mockBirthdayData.filters);
      } else {
        // Try to fetch from API, fallback to mock data on error
        try {
          const data = await getClientBirthdayReportData(params);
          setReportData(data.clients);
          setFilterOptions(data.filters);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockBirthdayData =
            mockData.ClientBirthdayReport as ClientBirthdayReportData;
          setReportData(mockBirthdayData.clients);
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

  useEffect(() => {
    fetchReportData(); // Initial fetch
  }, [useMock]);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetClientBirthdayReportParams = {};
    if (nameSearch.trim()) params.nameSearch = nameSearch.trim();
    if (selectedGrade !== "All Grades") params.grade = selectedGrade;
    if (selectedMonth !== "Any month") params.month = selectedMonth;
    if (selectedTenure !== "Any tenure") params.tenure = selectedTenure;
    if (selectedAdvisor !== "All Advisors") params.advisor = selectedAdvisor;

    // Debounce search input
    const timer = setTimeout(() => {
      fetchReportData(params);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    nameSearch,
    selectedGrade,
    selectedMonth,
    selectedTenure,
    selectedAdvisor,
  ]);

  const handleResetFilters = () => {
    setNameSearch("");
    setSelectedGrade("All Grades");
    setSelectedMonth("Any month");
    setSelectedTenure("Any tenure");
    setSelectedAdvisor("All Advisors");
  };

  if (isLoading && reportData.length === 0 && !error) {
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
            <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
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
            </Select>
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
          {!isLoading && reportData.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No clients match the current filters or no birthday data
              available.
            </div>
          )}
          {!isLoading && reportData.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Next Birthday</TableHead>
                    <TableHead className="text-center">Turning</TableHead>
                    <TableHead className="text-right">AUM</TableHead>
                    <TableHead>Client Tenure</TableHead>
                    <TableHead>Advisor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((client) => {
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
                        <TableCell className="text-center text-blue-600 font-medium">
                          {client.turningAge}
                        </TableCell>{" "}
                        {/* Turning age blue */}
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
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
}
