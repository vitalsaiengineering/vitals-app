import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import {
  getClientBirthdayReportData,
  type ClientBirthdayReportData,
  type BirthdayClient,
  type GetClientBirthdayReportParams,
  type BirthdayReportFilters as ReportFilterOptions
} from '@/lib/clientData';

// Define Grade colors
const GRADE_COLORS: Record<string, { badgeBg: string; badgeText: string; badgeBorder: string }> = {
  Platinum: { badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', badgeBorder: 'border-blue-200' },
  Gold: { badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700', badgeBorder: 'border-yellow-200' },
  Silver: { badgeBg: 'bg-slate-100', badgeText: 'text-slate-600', badgeBorder: 'border-slate-200' },
  Bronze: { badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', badgeBorder: 'border-orange-200' },
  Default: { badgeBg: 'bg-gray-100', badgeText: 'text-gray-700', badgeBorder: 'border-gray-200' },
};

const getGradeBadgeClasses = (grade: string) => {
  return GRADE_COLORS[grade] || GRADE_COLORS.Default;
};

const MONTH_OPTIONS = [
  { value: "Any month", label: "Any month" },
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
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
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions>({ grades: [], advisors: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [nameSearch, setNameSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedMonth, setSelectedMonth] = useState('Any month');
  const [selectedTenure, setSelectedTenure] = useState('Any tenure');
  const [selectedAdvisor, setSelectedAdvisor] = useState('All Advisors');

  const fetchReportData = async (params?: GetClientBirthdayReportParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getClientBirthdayReportData(params);
      setReportData(data.clients);
      setFilterOptions(data.filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load birthday report data';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(); // Initial fetch
  }, []);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetClientBirthdayReportParams = {};
    if (nameSearch.trim()) params.nameSearch = nameSearch.trim();
    if (selectedGrade !== 'All Grades') params.grade = selectedGrade;
    if (selectedMonth !== 'Any month') params.month = selectedMonth;
    if (selectedTenure !== 'Any tenure') params.tenure = selectedTenure;
    if (selectedAdvisor !== 'All Advisors') params.advisor = selectedAdvisor;
    
    // Debounce search input
    const timer = setTimeout(() => {
        fetchReportData(params);
    }, 500);

    return () => clearTimeout(timer);
  }, [nameSearch, selectedGrade, selectedMonth, selectedTenure, selectedAdvisor]);

  const handleResetFilters = () => {
    setNameSearch('');
    setSelectedGrade('All Grades');
    setSelectedMonth('Any month');
    setSelectedTenure('Any tenure');
    setSelectedAdvisor('All Advisors');
  };

  if (isLoading && reportData.length === 0 && !error) {
    return <div className="p-6 text-center">Loading birthday report...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Client Birthday Dashboard</CardTitle>
          <p className="text-muted-foreground">
            View your clients' upcoming birthdays in a sortable table format. Filter by client details to find the information you need.
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
              <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Grades">All Grades</SelectItem>
                {filterOptions.grades.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger><SelectValue placeholder="Any month" /></SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedTenure} onValueChange={setSelectedTenure}>
              <SelectTrigger><SelectValue placeholder="Any tenure" /></SelectTrigger>
              <SelectContent>
                {TENURE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
              <SelectTrigger><SelectValue placeholder="All Advisors" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Advisors">All Advisors</SelectItem>
                {filterOptions.advisors.map(adv => <SelectItem key={adv} value={adv}>{adv}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Client Birthdays</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="p-4 text-center text-muted-foreground">Updating results...</div>}
          {!isLoading && reportData.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No clients match the current filters or no birthday data available.
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
                        <TableCell className="font-medium">{client.clientName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${gradeClasses.badgeBg} ${gradeClasses.badgeText} ${gradeClasses.badgeBorder}`}>
                            {client.grade}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(client.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                        <TableCell>{client.nextBirthdayDisplay}</TableCell>
                        <TableCell className="text-center">{client.turningAge}</TableCell>
                        <TableCell className="text-right">
                          {client.aum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell>{client.clientTenure}</TableCell>
                        <TableCell>{client.advisorName}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">View Contact</Button>
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