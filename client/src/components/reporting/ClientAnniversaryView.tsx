import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExternalLink, User } from 'lucide-react';
import {
  getClientAnniversaryData,
  type ClientAnniversaryData,
  type AnniversaryClient,
  type GetClientAnniversaryParams
} from '@/lib/clientData';

// Import mock data
import mockData from '@/data/mockData.js';

// Grade badge colors
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
    Platinum: { badgeBg: 'bg-blue-700', badgeText: 'text-white' },
    Gold: { badgeBg: 'bg-blue-600', badgeText: 'text-white' },
    Silver: { badgeBg: 'bg-blue-500', badgeText: 'text-white' },
    Default: { badgeBg: 'bg-gray-500', badgeText: 'text-white' },
  };
  return GRADE_COLORS[grade] || GRADE_COLORS.Default;
};

interface ClientAnniversaryViewProps {
  globalSearch: string;
}

export default function ClientAnniversaryView({ globalSearch }: ClientAnniversaryViewProps) {
  const [anniversaryData, setAnniversaryData] = useState<ClientAnniversaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Filter states
  const [selectedSegment, setSelectedSegment] = useState('All Segments');
  const [selectedTenure, setSelectedTenure] = useState('Any Tenure');
  const [selectedAdvisor, setSelectedAdvisor] = useState('all');
  const [showUpcomingMilestones, setShowUpcomingMilestones] = useState(false);

  // Check if we should use mock data
  const useMock = process.env.REACT_APP_USE_MOCK_DATA !== 'false';

  const fetchAnniversaryData = async (params?: GetClientAnniversaryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        // Use mock data
        const mockAnniversaryData = mockData.ClientAnniversaryData as ClientAnniversaryData;
        setAnniversaryData(mockAnniversaryData);
      } else {
        // Try to fetch from API, fallback to mock data on error
        try {
          const data = await getClientAnniversaryData(params);
          setAnniversaryData(data);
        } catch (apiError) {
          console.warn('API fetch failed, falling back to mock data:', apiError);
          const mockAnniversaryData = mockData.ClientAnniversaryData as ClientAnniversaryData;
          setAnniversaryData(mockAnniversaryData);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load anniversary data';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnniversaryData(); // Initial fetch
  }, [useMock]);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetClientAnniversaryParams = {};
    if (globalSearch.trim()) params.search = globalSearch.trim();
    if (selectedSegment !== 'All Segments') params.segment = selectedSegment;
    if (selectedTenure !== 'Any Tenure') params.tenure = selectedTenure;
    if (selectedAdvisor !== 'all') params.advisorId = selectedAdvisor;
    params.upcomingMilestonesOnly = showUpcomingMilestones;
    
    const timer = setTimeout(() => {
      fetchAnniversaryData(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearch, selectedSegment, selectedTenure, selectedAdvisor, showUpcomingMilestones]);

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Client Anniversary Dates</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {anniversaryData ? `${anniversaryData.totalRecords} records` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="upcoming-milestones"
              checked={showUpcomingMilestones}
              onCheckedChange={setShowUpcomingMilestones}
            />
            <Label htmlFor="upcoming-milestones" className="text-sm">
              Show Upcoming Milestones
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger>
              <SelectValue placeholder="Select segment" />
            </SelectTrigger>
            <SelectContent>
              {anniversaryData?.filterOptions.segments.map(segment => (
                <SelectItem key={segment} value={segment}>{segment}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTenure} onValueChange={setSelectedTenure}>
            <SelectTrigger>
              <SelectValue placeholder="Select tenure" />
            </SelectTrigger>
            <SelectContent>
              {anniversaryData?.filterOptions.tenures.map(tenure => (
                <SelectItem key={tenure} value={tenure}>{tenure}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
            <SelectTrigger>
              <SelectValue placeholder="Select advisor" />
            </SelectTrigger>
            <SelectContent>
              {anniversaryData?.filterOptions.advisors.map(advisor => (
                <SelectItem key={advisor.id} value={advisor.id}>{advisor.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading && <div className="p-4 text-center text-muted-foreground">Loading anniversary data...</div>}
        {!isLoading && anniversaryData && anniversaryData.clients.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            No clients match the current filters.
          </div>
        )}
        {!isLoading && anniversaryData && anniversaryData.clients.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                {anniversaryData.clients.map((client) => {
                  const gradeClasses = getGradeBadgeClasses(client.segment);
                  const isHighlighted = highlightedRowId === client.id;
                  
                  return (
                    <TableRow 
                      key={client.id}
                      className={isHighlighted ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
                      onMouseEnter={() => setHighlightedRowId(client.id)}
                      onMouseLeave={() => setHighlightedRowId(null)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="font-medium">{client.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${gradeClasses.badgeBg} ${gradeClasses.badgeText}`}>
                          {client.segment}
                        </span>
                      </TableCell>
                      <TableCell>{client.nextAnniversaryDate}</TableCell>
                      <TableCell>
                        {client.daysUntilNextAnniversary === 1 ? '1 day' : `${client.daysUntilNextAnniversary} days`}
                      </TableCell>
                      <TableCell>
                        {client.yearsWithFirm === 1 ? '1 year' : `${client.yearsWithFirm} years`}
                      </TableCell>
                      <TableCell>{client.advisorName}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 text-white hover:bg-blue-700"
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
  );
}