import type { Request, Response } from "express";
import type {
  AgeDemographicsData,
  ClientDistributionReportData,
  BookDevelopmentReportData,
  BirthdayClient,
  ClientBirthdayReportData,
  ClientSegmentationDashboardData,
  ClientAnniversaryData,
  ClientInceptionData,
  ReferralAnalyticsData,
  ClientReferralRateData,
  AdvisoryFirmDashboardData,
  AgeBracketDataEntry,
  SegmentBreakdown,
  ClientReportDetail,
} from "./types";

import { storage } from "./storage";
import _ from "lodash";

import {
  getMockAgeDemographicsReportData,
  getMockClientDistributionReportData,
  getMockBookDevelopmentReportData,
  getMockClientBirthdayReportData,
  getMockClientSegmentationDashboardData,
  getMockClientAnniversaryData,
  getMockClientInceptionData,
  getMockReferralAnalyticsData,
  getMockClientReferralRateData,
  getMockAdvisoryFirmDashboardData,
} from "./mockData";

// --- Age Demographics Report ---

async function getAgeDemographicsReportData(
  organizationId: number,
  advisorIds?: number[]
): Promise<AgeDemographicsData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);
  
  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter(client => 
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Group clients by age brackets
  const clientsByAgeGroups = _.groupBy(filteredClients, (client) => {
    const age = client.age;
    if (!age) return "Unknown";
    if (age < 20) return "<20";
    else if (age >= 20 && age <= 40) return "21-40";
    else if (age > 40 && age <= 60) return "41-60";
    else if (age > 60 && age <= 80) return "61-80";
    else return ">80";
  });

  const ageBrackets = ["<20", "21-40", "41-60", "61-80", ">80"];
  
  // Calculate total clients (excluding Unknown age)
  let totalClients = 0;
  ageBrackets.forEach((bracket) => {
    totalClients += clientsByAgeGroups[bracket]?.length || 0;
  });

  // Helper function to determine segment based on AUM
  const determineSegment = (aumString: string): string => {
    const aum = parseFloat(aumString || "0");
    if (aum >= 1000000) return "Platinum";
    if (aum >= 500000) return "Gold";
    return "Silver";
  };

  // Helper function to calculate total AUM for a segment
  const calculateSegmentAum = (clients: any[], segment: string): number => {
    return clients
      .filter(client => determineSegment(client.aum || "0") === segment)
      .reduce((sum, client) => sum + parseFloat(client.aum || "0"), 0);
  };

  // Create age bracket data with real calculations
  const byAgeBracketData: AgeBracketDataEntry[] = ageBrackets.map((bracket) => {
    const bracketClients = clientsByAgeGroups[bracket] || [];
    const clientCount = bracketClients.length;
    const clientPercentage = totalClients > 0 ? (clientCount / totalClients) * 100 : 0;

    // Calculate AUM by segment for this bracket
    const segments = ["Platinum", "Gold", "Silver"];
    const detailedBreakdown: SegmentBreakdown[] = segments.map(segment => {
      const segmentClients = bracketClients.filter(client => 
        determineSegment(client.aum || "0") === segment
      );
      const segmentAum = calculateSegmentAum(bracketClients, segment);
      
      return {
        segment,
        clients: segmentClients.length,
        aum: Math.round(segmentAum),
      };
    }).filter(breakdown => breakdown.clients > 0); // Only include segments with clients

    // Calculate total AUM for this bracket
    const totalBracketAum = bracketClients.reduce((sum, client) => 
      sum + parseFloat(client.aum || "0"), 0
    );

    // Calculate total AUM across all clients for percentage calculation
    const totalAllClientsAum = filteredClients.reduce((sum, client) => 
      sum + parseFloat(client.aum || "0"), 0
    );

    const aumPercentage = totalAllClientsAum > 0 ? (totalBracketAum / totalAllClientsAum) * 100 : 0;

    return {
      bracket,
      clientCount,
      clientPercentage: parseFloat(clientPercentage.toFixed(1)),
      aum: Math.round(totalBracketAum),
      aumPercentage: parseFloat(aumPercentage.toFixed(1)),
      detailedBreakdown,
    };
  });

  // Calculate total AUM across all clients
  const totalAUM = filteredClients.reduce((sum, client) => 
    sum + parseFloat(client.aum || "0"), 0
  );

  // Calculate average client age
  const clientsWithAge = filteredClients.filter(client => client.age);
  const averageClientAge = clientsWithAge.length > 0 
    ? parseFloat((
        clientsWithAge.reduce((sum, client) => sum + (client.age || 0), 0) / 
        clientsWithAge.length
      ).toFixed(1))
    : 0;

  // Format client details
  const clientDetails: ClientReportDetail[] = filteredClients.map((client) => ({
    id: String(client.id),
    name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
    age: client.age || 0,
    segment: determineSegment(client.aum || "0"),
    joinDate: client.startDate ? client.startDate.toISOString().split('T')[0] : client.createdAt.toISOString().split('T')[0],
    aum: Math.round(parseFloat(client.aum || "0")),
  }));

  return {
    overall: {
      totalClients: totalClients,
      totalAUM: Math.round(totalAUM),
      averageClientAge,
    },
    byAgeBracket: byAgeBracketData,
    clientDetails,
  };
}

export async function getAgeDemographicsReportHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any; // Assuming requireAuth middleware populates req.user
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : user?.id;
  const organizationId = user?.organizationId;

  try {
    // In a real application, you would fetch and process data based on advisorId
    // For example, using functions from storage or other services.
    // const reportData = await storage.getProcessedAgeDemographics(advisorId);

    // For now, returning mock data:
    const reportData = await getAgeDemographicsReportData(organizationId);
    // You might want to adjust the mock data if advisorId is present, or filter it.

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching age demographics report data:", error);
    res.status(500).json({
      message: "Failed to fetch age demographics report data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Distribution Report ---

export async function getClientDistributionReportHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  // const advisorId = user?.id; // Or from query/params
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;
  const organizationId = user?.organizationId;
  try {
    const reportData = await getMockClientDistributionReportData(
      organizationId
    );
    res.json(reportData);
  } catch (error) {
    console.error("Error fetching client distribution report data:", error);
    res.status(500).json({
      message: "Failed to fetch client distribution report data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Book Development Report ---

export async function getBookDevelopmentReportHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;

  try {
    const reportData = await getMockBookDevelopmentReportData(organizationId);
    res.json(reportData);
  } catch (error) {
    console.error("Error fetching book development report data:", error);
    res.status(500).json({
      message: "Failed to fetch book development report data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Birthday Report ---

// Helper function to calculate client tenure (numeric part for filtering)
function getTenureYears(tenureString: string): number {
  const match = tenureString.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper function to get month from YYYY-MM-DD
function getMonthFromDateString(dateString: string): number {
  return parseInt(dateString.split("-")[1], 10);
}

export async function getClientBirthdayReportHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;

  try {
    // Get mock data from dedicated function
    const mockData = await getMockClientBirthdayReportData(organizationId);
    const { clients: mockClients, filters } = mockData;

    // Populate internal fields for filtering/sorting
    let processedClients: BirthdayClient[] = mockClients.map((client) => ({
      ...client,
      _tenureYears: getTenureYears(client.clientTenure),
      _nextBirthdayMonth: getMonthFromDateString(client.nextBirthdayDate),
    }));

    // Extract filter query parameters
    const {
      nameSearch,
      grade: gradeFilter,
      month: monthFilter, // Expect month number 1-12
      tenure: tenureFilter, // Expect "1-2", "2-5", "5-10", "10+"
      advisor: advisorFilter,
    } = req.query;

    // Apply filters
    if (nameSearch && typeof nameSearch === "string") {
      processedClients = processedClients.filter((c) =>
        c.clientName.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }
    if (
      gradeFilter &&
      typeof gradeFilter === "string" &&
      gradeFilter !== "All Grades"
    ) {
      processedClients = processedClients.filter(
        (c) => c.grade === gradeFilter
      );
    }
    if (
      monthFilter &&
      typeof monthFilter === "string" &&
      monthFilter !== "Any month"
    ) {
      const monthNum = parseInt(monthFilter, 10);
      processedClients = processedClients.filter(
        (c) => c._nextBirthdayMonth === monthNum
      );
    }
    if (
      advisorFilter &&
      typeof advisorFilter === "string" &&
      advisorFilter !== "All Advisors"
    ) {
      processedClients = processedClients.filter(
        (c) => c.advisorName === advisorFilter
      );
    }
    if (
      tenureFilter &&
      typeof tenureFilter === "string" &&
      tenureFilter !== "Any tenure"
    ) {
      processedClients = processedClients.filter((c) => {
        const years = c._tenureYears;
        if (years === undefined) return false;
        if (tenureFilter === "1-2 years") return years >= 1 && years <= 2;
        if (tenureFilter === "2-5 years") return years > 2 && years <= 5;
        if (tenureFilter === "5-10 years") return years > 5 && years <= 10;
        if (tenureFilter === "10+ years") return years > 10;
        return true;
      });
    }

    // Sort by days until next birthday (ascending)
    processedClients.sort(
      (a, b) =>
        (a.daysUntilNextBirthday || Infinity) -
        (b.daysUntilNextBirthday || Infinity)
    );

    const reportData: ClientBirthdayReportData = {
      clients: processedClients.map(
        ({
          daysUntilNextBirthday,
          _tenureYears,
          _nextBirthdayMonth,
          ...client
        }) => client
      ), // Remove temporary fields
      filters,
    };

    res.json(reportData);
  } catch (error) {
    console.error("Error processing client birthday report data:", error);
    res.status(500).json({
      message: "Failed to process client birthday report data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Segmentation Dashboard ---

export async function getClientSegmentationDashboardHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  const advisorFilter = (req.query.advisorId as string) || "firm_overview";
  const selectedSegment = (req.query.segment as string) || "Platinum";

  try {
    const mockData = await getMockClientSegmentationDashboardData(
      organizationId,
      selectedSegment
    );
    res.json(mockData);
  } catch (error) {
    console.error("Error fetching client segmentation dashboard data:", error);
    res.status(500).json({
      message: "Failed to fetch client segmentation dashboard data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Anniversary ---

export async function getClientAnniversaryHandler(req: Request, res: Response) {
  try {
    const { search, segment, tenure, advisorId, upcomingMilestonesOnly } =
      req.query;
    const user = req.user as any;
    const organizationId = user?.organizationId;

    // Get mock data from dedicated function
    const mockData = await getMockClientAnniversaryData(organizationId);
    let filteredClients = mockData.clients;

    // Apply filters
    if (search && typeof search === "string") {
      filteredClients = filteredClients.filter((c) =>
        c.clientName.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (segment && typeof segment === "string" && segment !== "All Segments") {
      filteredClients = filteredClients.filter((c) => c.segment === segment);
    }

    if (tenure && typeof tenure === "string" && tenure !== "Any Tenure") {
      filteredClients = filteredClients.filter((c) => {
        const years = c.yearsWithFirm;
        if (tenure === "1-5 years") return years >= 1 && years <= 5;
        if (tenure === "5-10 years") return years > 5 && years <= 10;
        if (tenure === "10+ years") return years > 10;
        return true;
      });
    }

    if (advisorId && typeof advisorId === "string" && advisorId !== "all") {
      // Use the same advisor mapping from the mock data function
      const advisorName = mockData.filterOptions.advisors.find(
        (advisor) => advisor.id === advisorId
      )?.name;
      if (advisorName && advisorName !== "All Advisors") {
        filteredClients = filteredClients.filter(
          (c) => c.advisorName === advisorName
        );
      }
    }

    if (upcomingMilestonesOnly === "true") {
      // Consider milestones as anniversaries within 30 days
      filteredClients = filteredClients.filter(
        (c) => c.daysUntilNextAnniversary <= 30
      );
    }

    // Sort by days until next anniversary
    filteredClients.sort(
      (a, b) => a.daysUntilNextAnniversary - b.daysUntilNextAnniversary
    );

    const responseData: ClientAnniversaryData = {
      clients: filteredClients,
      totalRecords: filteredClients.length,
      filterOptions: mockData.filterOptions, // Use filter options from mock data function
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching client anniversary data:", error);
    res.status(500).json({
      message: "Failed to fetch client anniversary data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Inception ---

export async function getClientInceptionHandler(req: Request, res: Response) {
  try {
    const currentYear = req.query.year
      ? parseInt(req.query.year as string)
      : 2024;
    const segmentFilter = (req.query.segmentFilter as string) || "All Segments";
    const search = req.query.search as string;
    const user = req.user as any;
    const organizationId = user?.organizationId;

    // Get mock data from dedicated function
    const mockData = await getMockClientInceptionData(
      organizationId,
      currentYear
    );

    let filteredTableClients = mockData.tableClients;

    if (segmentFilter !== "All Segments") {
      filteredTableClients = filteredTableClients.filter(
        (c) => c.segment === segmentFilter
      );
    }

    if (search && typeof search === "string") {
      filteredTableClients = filteredTableClients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const responseData: ClientInceptionData = {
      ...mockData,
      tableClients: filteredTableClients,
      totalTableRecords: filteredTableClients.length,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching client inception data:", error);
    res.status(500).json({
      message: "Failed to fetch client inception data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Referral Analytics ---

export async function getReferralAnalyticsHandler(req: Request, res: Response) {
  try {
    const { search, referrer } = req.query;
    const user = req.user as any;
    const organizationId = user?.organizationId;

    // Get mock data from dedicated function
    const mockData = await getMockReferralAnalyticsData(organizationId);

    // Start with all referrals from the mock data
    let filteredReferrals = [...mockData.allReferrals];

    // Apply filters
    if (search && typeof search === "string") {
      filteredReferrals = filteredReferrals.filter(
        (referral) =>
          referral.clientName.toLowerCase().includes(search.toLowerCase()) ||
          referral.referredBy.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (referrer && typeof referrer === "string" && referrer !== "all") {
      // Use the same referrer mapping from the mock data function
      const referrerName = mockData.filterOptions.referrers.find(
        (ref) => ref.id === referrer
      )?.name;
      if (referrerName && referrerName !== "All Referrers") {
        filteredReferrals = filteredReferrals.filter(
          (r) => r.referredBy === referrerName
        );
      }
    }

    // Return the exact same structure as expected by the frontend
    const responseData: ReferralAnalyticsData = {
      totalReferrals: mockData.totalReferrals,
      allReferrals: filteredReferrals,
      referralSources: mockData.referralSources,
      filterOptions: mockData.filterOptions,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching referral analytics data:", error);
    res.status(500).json({
      message: "Failed to fetch referral analytics data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Referral Rate ---

export async function getClientReferralRateHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;

  try {
    const reportData = await getMockClientReferralRateData(organizationId);

    // You could filter or modify data based on advisorId if needed
    if (advisorId) {
      // Optionally adjust data for specific advisor
      // For now, returning the same data regardless of advisor
    }

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching client referral rate data:", error);
    res.status(500).json({
      message: "Failed to fetch client referral rate data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Advisory Firm Dashboard ---

export async function getAdvisoryFirmDashboardHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;

  try {
    const reportData = await getMockAdvisoryFirmDashboardData(organizationId);

    // You could filter or modify data based on advisorId if needed
    if (advisorId) {
      // Optionally adjust data for specific advisor
      // For now, returning the same data regardless of advisor
    }

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching advisory firm dashboard data:", error);
    res.status(500).json({
      message: "Failed to fetch advisory firm dashboard data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
