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
    filteredClients = clients.filter((client) =>
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
      .filter((client) => determineSegment(client.aum || "0") === segment)
      .reduce((sum, client) => sum + parseFloat(client.aum || "0"), 0);
  };

  // Create age bracket data with real calculations
  const byAgeBracketData: AgeBracketDataEntry[] = ageBrackets.map((bracket) => {
    const bracketClients = clientsByAgeGroups[bracket] || [];
    const clientCount = bracketClients.length;
    const clientPercentage =
      totalClients > 0 ? (clientCount / totalClients) * 100 : 0;

    // Calculate AUM by segment for this bracket
    const segments = ["Platinum", "Gold", "Silver"];
    const detailedBreakdown: SegmentBreakdown[] = segments
      .map((segment) => {
        const segmentClients = bracketClients.filter(
          (client) => determineSegment(client.aum || "0") === segment
        );
        const segmentAum = calculateSegmentAum(bracketClients, segment);

        return {
          segment,
          clients: segmentClients.length,
          aum: Math.round(segmentAum),
        };
      })
      .filter((breakdown) => breakdown.clients > 0); // Only include segments with clients

    // Calculate total AUM for this bracket
    const totalBracketAum = bracketClients.reduce(
      (sum, client) => sum + parseFloat(client.aum || "0"),
      0
    );

    // Calculate total AUM across all clients for percentage calculation
    const totalAllClientsAum = filteredClients.reduce(
      (sum, client) => sum + parseFloat(client.aum || "0"),
      0
    );

    const aumPercentage =
      totalAllClientsAum > 0 ? (totalBracketAum / totalAllClientsAum) * 100 : 0;

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
  const totalAUM = filteredClients.reduce(
    (sum, client) => sum + parseFloat(client.aum || "0"),
    0
  );

  // Calculate average client age
  const clientsWithAge = filteredClients.filter((client) => client.age);
  const averageClientAge =
    clientsWithAge.length > 0
      ? parseFloat(
          (
            clientsWithAge.reduce((sum, client) => sum + (client.age || 0), 0) /
            clientsWithAge.length
          ).toFixed(1)
        )
      : 0;

  // Format client details
  const clientDetails: ClientReportDetail[] = filteredClients.map((client) => ({
    id: String(client.id),
    name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
    age: client.age || 0,
    segment: determineSegment(client.aum || "0"),
    joinDate: client.startDate
      ? client.startDate.toISOString().split("T")[0]
      : client.createdAt.toISOString().split("T")[0],
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

async function getClientDistributionReportData(
  organizationId: number,
  advisorIds?: number[]
): Promise<ClientDistributionReportData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);

  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Helper for state code to name mapping
  const stateCodeToNameMapping: { [key: string]: string } = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    AS: "American Samoa",
    DC: "District of Columbia",
    FM: "Federated States of Micronesia",
    GU: "Guam",
    MH: "Marshall Islands",
    MP: "Northern Mariana Islands",
    PW: "Palau",
    PR: "Puerto Rico",
    VI: "U.S. Virgin Islands",
  };

  // Helper function to determine segment based on AUM
  const determineSegment = (aumString: string): string => {
    const aum = parseFloat(aumString || "0");
    if (aum >= 1000000) return "Ultra High Net Worth";
    if (aum >= 500000) return "High Net Worth";
    if (aum >= 100000) return "Mass Affluent";
    if (aum >= 250000) return "Affluent";
    return "Emerging High Net Worth";
  };

  // Extract state from contact info and group clients by state
  const clientsByState = _.groupBy(filteredClients, (client) => {
    // Try to extract state from contactInfo
    const contactInfo = client.contactInfo as any;
    let state = "Unknown";

    if (contactInfo?.address?.state) {
      state = contactInfo.address.state.toUpperCase();
    } else if (contactInfo?.state) {
      state = contactInfo.state.toUpperCase();
    }

    return state;
  });

  const stateMetrics: any[] = [];
  const clientDetailsByStateProcessed: { [stateCode: string]: any[] } = {};

  let topStateByClientsSummary = {
    stateName: "N/A",
    value: 0,
    metricLabel: "clients" as const,
  };
  let topStateByAUMSummary = {
    stateName: "N/A",
    value: "$0",
    metricLabel: "AUM" as const,
  };
  let maxClients = 0;
  let maxAum = 0;

  for (const stateCode of Object.keys(clientsByState)) {
    if (stateCode === "Unknown") {
      continue;
    }

    const actualClientsInState = clientsByState[stateCode];
    const clientCount = actualClientsInState.length;

    if (clientCount === 0) {
      continue;
    }

    const stateName = stateCodeToNameMapping[stateCode] || stateCode;
    let currentTotalAumForState = 0;

    // Process client details for this state
    clientDetailsByStateProcessed[stateCode] = actualClientsInState.map(
      (client) => {
        const clientAum = parseFloat(client.aum || "0");
        currentTotalAumForState += clientAum;

        return {
          id: String(client.id),
          name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
          segment: determineSegment(client.aum || "0"),
          aum: Math.round(clientAum),
        };
      }
    );

    stateMetrics.push({
      stateCode: stateCode,
      stateName: stateName,
      clientCount: clientCount,
      totalAum: Math.round(currentTotalAumForState),
    });

    // Track top states
    if (clientCount > maxClients) {
      maxClients = clientCount;
      topStateByClientsSummary = {
        stateName,
        value: clientCount,
        metricLabel: "clients",
      };
    }
    if (currentTotalAumForState > maxAum) {
      maxAum = currentTotalAumForState;
      topStateByAUMSummary = {
        stateName,
        value: currentTotalAumForState.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        metricLabel: "AUM",
      };
    }
  }

  return {
    topStateByClients: topStateByClientsSummary,
    topStateByAUM: topStateByAUMSummary,
    stateMetrics: stateMetrics.sort((a, b) => b.clientCount - a.clientCount),
    clientDetailsByState: clientDetailsByStateProcessed,
  };
}

export async function getClientDistributionReportHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;
  const organizationId = user?.organizationId;

  try {
    // Use real data processing
    const reportData = await getClientDistributionReportData(
      organizationId,
      advisorId ? [advisorId] : undefined
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

async function getBookDevelopmentReportData(
  organizationId: number,
  advisorIds?: number[]
): Promise<BookDevelopmentReportData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);

  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Group clients by their actual segment property
  const clientsBySegment = _.groupBy(filteredClients, (client) => {
    // Use the client's actual segment, fallback to "Silver" if not set
    return client.segment || "Silver";
  });

  // Segment colors matching the mock data
  const SEGMENT_COLORS = {
    Platinum: {
      base: "hsl(222, 47%, 44%)",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700",
      badgeBorder: "border-blue-200",
    },
    Gold: {
      base: "hsl(216, 65%, 58%)",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-700",
      badgeBorder: "border-sky-200",
    },
    Silver: {
      base: "hsl(210, 55%, 78%)",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-600",
      badgeBorder: "border-slate-200",
    },
  };

  // Helper function to generate yearly historical data
  const generateYearlyData = (
    baseClients: any[],
    startValue: number,
    growthRate: number,
    isAUM: boolean
  ): any[] => {
    let currentVal = startValue;
    let prevVal: number | undefined = undefined;
    const data: any[] = [];

    for (let year = 2015; year <= 2025; year++) {
      const point = {
        year,
        value: Math.round(currentVal),
        previousYearValue:
          prevVal !== undefined ? Math.round(prevVal) : undefined,
      };
      data.push(point);
      prevVal = currentVal;

      // Calculate growth based on actual client join dates (use inceptionDate, fallback to createdAt)
      const clientsJoinedThisYear = baseClients.filter((client) => {
        const joinDate = client.inceptionDate
          ? new Date(client.inceptionDate)
          : new Date(client.createdAt);
        const joinYear = joinDate.getFullYear();
        return joinYear === year;
      }).length;

      const baseGrowth =
        Math.random() * growthRate * (isAUM ? 1 : 0.5) + (isAUM ? 0.02 : 0.01);
      const clientInfluencedGrowth = clientsJoinedThisYear * 0.01;

      currentVal *= 1 + baseGrowth + clientInfluencedGrowth;

      // Apply minimum thresholds
      if (isAUM && currentVal < 1000000) {
        currentVal = 1000000 * (1 + Math.random() * 0.1);
      } else if (!isAUM && currentVal < 5) {
        currentVal = 5 * (1 + Math.random() * 0.1);
      }
    }
    return data;
  };

  // Helper function to format clients for segment
  const formatClientsForSegment = (
    clients: any[],
    segment: "Platinum" | "Gold" | "Silver"
  ): any[] => {
    return clients.map((client) => {
      // Use inceptionDate if available, fallback to createdAt
      const joinDate = client.inceptionDate
        ? new Date(client.inceptionDate)
        : new Date(client.createdAt);
      const yearsWithFirm = Math.max(
        1,
        new Date().getFullYear() - joinDate.getFullYear()
      );
      const sinceDateText = `Since ${joinDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`;

      const clientAum = parseFloat(client.aum || "0");

      return {
        id: String(client.id),
        name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        segment,
        yearsWithFirm,
        yearsWithFirmText: `${yearsWithFirm} year${
          yearsWithFirm !== 1 ? "s" : ""
        }`,
        sinceDateText,
        aum: Math.round(clientAum),
      };
    });
  };

  // Calculate base values for each segment based on real data
  const calculateSegmentBaseValues = (
    segmentClients: any[],
    segment: "Platinum" | "Gold" | "Silver"
  ) => {
    const totalAum = segmentClients.reduce(
      (sum, client) => sum + parseFloat(client.aum || "0"),
      0
    );
    const clientCount = segmentClients.length;

    // Base AUM values scaled by actual data
    const baseAumMultiplier =
      segment === "Platinum"
        ? 70000000
        : segment === "Gold"
        ? 40000000
        : 20000000;
    const baseAum = Math.max(baseAumMultiplier, totalAum * 10); // Scale up for historical projection

    // Base client count scaled by actual data
    const baseClientMultiplier =
      segment === "Platinum" ? 10 : segment === "Gold" ? 25 : 40;
    const baseClientCount = Math.max(baseClientMultiplier, clientCount * 2); // Scale up for historical projection

    return { baseAum, baseClientCount };
  };

  // Generate data for all segments
  const allSegmentsData: any[] = ["Platinum", "Gold", "Silver"].map(
    (segmentName) => {
      const segment = segmentName as "Platinum" | "Gold" | "Silver";
      const segmentClients = clientsBySegment[segment] || [];
      const { baseAum, baseClientCount } = calculateSegmentBaseValues(
        segmentClients,
        segment
      );

      // Growth rates vary by segment
      const growthRate =
        segment === "Platinum" ? 0.08 : segment === "Gold" ? 0.06 : 0.05;

      return {
        name: segment,
        color: SEGMENT_COLORS[segment].base,
        fillColor: SEGMENT_COLORS[segment].base,
        dataAUM: generateYearlyData(segmentClients, baseAum, growthRate, true),
        dataClientCount: generateYearlyData(
          segmentClients,
          baseClientCount,
          growthRate,
          false
        ),
        clients: formatClientsForSegment(segmentClients, segment),
      };
    }
  );

  return { allSegmentsData };
}

export async function getBookDevelopmentReportHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;

  try {
    // Use real data processing
    const reportData = await getBookDevelopmentReportData(
      organizationId,
      advisorId ? [advisorId] : undefined
    );
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

async function getClientBirthdayReportData(
  organizationId: number,
  advisorIds?: number[]
): Promise<{ clients: any[]; filters: any }> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);

  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Get all users (advisors) for name lookup
  const allUsers = await storage.getUsersByOrganization(organizationId);
  const userLookup = allUsers.reduce((acc, user) => {
    acc[user.id] = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return acc;
  }, {} as { [key: number]: string });

  // Helper function to calculate days until next birthday
  const calculateDaysUntilBirthday = (
    dateOfBirth: string
  ): { days: number; nextBirthdayDate: string; turningAge: number } => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Parse the birth date
    const birthDate = new Date(dateOfBirth);
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();

    // Calculate next birthday this year
    let nextBirthday = new Date(currentYear, birthMonth, birthDay);

    // If birthday has passed this year, use next year
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
    }

    // Calculate days until birthday
    const timeDiff = nextBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Calculate turning age
    const turningAge = nextBirthday.getFullYear() - birthDate.getFullYear();

    return {
      days: daysDiff,
      nextBirthdayDate: nextBirthday.toISOString().split("T")[0],
      turningAge,
    };
  };

  // Helper function to calculate client tenure
  const calculateTenure = (
    client: any
  ): { years: number; tenureText: string } => {
    const joinDate = client.inceptionDate
      ? new Date(client.inceptionDate)
      : new Date(client.createdAt);
    const today = new Date();
    const years = Math.max(1, today.getFullYear() - joinDate.getFullYear());
    return {
      years,
      tenureText: `${years} year${years !== 1 ? "s" : ""}`,
    };
  };

  // Helper function to format birthday display
  const formatBirthdayDisplay = (
    days: number,
    nextBirthdayDate: string
  ): string => {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 30) return `In ${days} days`;

    const date = new Date(nextBirthdayDate);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Process clients and calculate birthday information
  const birthdayClients = filteredClients
    .filter((client) => client.dateOfBirth) // Only include clients with birth dates
    .map((client) => {
      const { days, nextBirthdayDate, turningAge } = calculateDaysUntilBirthday(
        client.dateOfBirth!
      ); // Non-null assertion since we filtered above
      const { years, tenureText } = calculateTenure(client);
      const advisorName =
        userLookup[client.primaryAdvisorId || 0] || "Unknown Advisor";

      return {
        id: String(client.id),
        clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        grade: client.segment || "Silver", // Use client segment as grade
        dateOfBirth: client.dateOfBirth!,
        nextBirthdayDisplay: formatBirthdayDisplay(days, nextBirthdayDate),
        nextBirthdayDate,
        turningAge,
        aum: Math.round(parseFloat(client.aum || "0")),
        clientTenure: tenureText,
        advisorName,
        daysUntilNextBirthday: days,
        _tenureYears: years,
        _nextBirthdayMonth: new Date(nextBirthdayDate).getMonth() + 1, // 1-based month
      };
    })
    .sort((a, b) => a.daysUntilNextBirthday - b.daysUntilNextBirthday);

  // Generate filter options from actual data
  const gradeSet = new Set(birthdayClients.map((c) => c.grade));
  const uniqueGrades = Array.from(gradeSet).sort();

  const advisorSet = new Set(birthdayClients.map((c) => c.advisorName));
  const uniqueAdvisors = Array.from(advisorSet).sort();

  return {
    clients: birthdayClients,
    filters: {
      grades: uniqueGrades,
      advisors: uniqueAdvisors,
    },
  };
}

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
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;

  try {
    // Get real data from the database
    const { clients: allClients, filters } = await getClientBirthdayReportData(
      organizationId,
      advisorId ? [advisorId] : undefined
    );

    let processedClients = allClients;

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

    // Sort by days until next birthday (ascending) - already sorted but re-sort after filtering
    processedClients.sort(
      (a, b) => a.daysUntilNextBirthday - b.daysUntilNextBirthday
    );

    const reportData = {
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

async function getClientSegmentationDashboardData(
  organizationId: number,
  selectedSegment: string = "Platinum",
  advisorIds?: number[]
): Promise<ClientSegmentationDashboardData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);

  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Get all users (advisors) for advisor options
  const allUsers = await storage.getUsersByOrganization(organizationId);
  const advisors = allUsers.filter((user) => user.roleId === 5); // Assuming roleId 5 is for advisors

  const advisorOptions = [
    { id: "firm_overview", name: "Firm Overview" },
    ...advisors.map((advisor) => ({
      id: String(advisor.id),
      name: `${advisor.firstName || ""} ${advisor.lastName || ""}`.trim(),
    })),
  ];

  // Group clients by segment
  const clientsBySegment = _.groupBy(filteredClients, (client) => {
    return client.segment || "Silver"; // Use actual segment, fallback to Silver
  });

  // Calculate segment counts and totals
  const segmentData = Object.keys(clientsBySegment).map((segment) => {
    const segmentClients = clientsBySegment[segment];
    const clientCount = segmentClients.length;
    const totalAum = segmentClients.reduce(
      (sum, client) => sum + parseFloat(client.aum || "0"),
      0
    );

    return {
      segment,
      clientCount,
      totalAum: Math.round(totalAum),
    };
  });

  // Calculate totals
  const totalClients = segmentData.reduce(
    (sum, data) => sum + data.clientCount,
    0
  );
  const totalAum = segmentData.reduce((sum, data) => sum + data.totalAum, 0);

  // Get current segment data
  const currentSegmentData = segmentData.find(
    (data) => data.segment === selectedSegment
  ) || {
    segment: selectedSegment,
    clientCount: 0,
    totalAum: 0,
  };

  const averageClientAum =
    currentSegmentData.clientCount > 0
      ? currentSegmentData.totalAum / currentSegmentData.clientCount
      : 0;

  // Generate KPIs
  const kpis = {
    clientCount: {
      value: currentSegmentData.clientCount,
      label: `Number of ${selectedSegment} clients`,
    },
    totalAUM: {
      value: `$${currentSegmentData.totalAum.toLocaleString()}`,
      label: `Total assets for ${selectedSegment} segment`,
    },
    averageClientAUM: {
      value: `$${Math.round(averageClientAum).toLocaleString()}`,
      label: `Average for ${selectedSegment} segment`,
    },
    currentSegmentFocus: selectedSegment,
  };

  // Generate donut chart data with predefined colors
  const segmentColors: { [key: string]: string } = {
    Platinum: "hsl(222, 47%, 44%)",
    Gold: "hsl(216, 65%, 58%)",
    Silver: "hsl(210, 55%, 78%)",
    Bronze: "hsl(30, 50%, 60%)",
    // Add more colors for additional segments if needed
  };

  const donutChartData = segmentData.map((data) => ({
    name: data.segment,
    count: data.clientCount,
    percentage:
      totalClients > 0
        ? Math.round((data.clientCount / totalClients) * 100 * 10) / 10
        : 0,
    color: segmentColors[data.segment] || "hsl(200, 50%, 50%)", // Default color
  }));

  // Format clients for the selected segment table
  const currentSegmentClients = clientsBySegment[selectedSegment] || [];
  const tableClients = currentSegmentClients.map((client) => {
    // Calculate years with firm
    const joinDate = client.inceptionDate
      ? new Date(client.inceptionDate)
      : new Date(client.createdAt);
    const yearsWithFirm = Math.max(
      1,
      new Date().getFullYear() - joinDate.getFullYear()
    );

    return {
      id: String(client.id),
      name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
      age: client.age || 0,
      yearsWithFirm,
      assets: Math.round(parseFloat(client.aum || "0")),
    };
  });

  return {
    kpis,
    donutChartData,
    tableData: {
      segmentName: selectedSegment,
      clients: tableClients,
    },
    advisorOptions,
    currentAdvisorOrFirmView: "Firm Overview",
  };
}

export async function getClientSegmentationDashboardHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  const advisorFilter = (req.query.advisorId as string) || "firm_overview";
  const selectedSegment = (req.query.segment as string) || "Platinum";

  try {
    // Determine advisor filtering
    let advisorIds: number[] | undefined;
    if (advisorFilter !== "firm_overview") {
      const advisorId = parseInt(advisorFilter, 10);
      if (!isNaN(advisorId)) {
        advisorIds = [advisorId];
      }
    }

    // Use real data processing
    const dashboardData = await getClientSegmentationDashboardData(
      organizationId,
      selectedSegment,
      advisorIds
    );

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching client segmentation dashboard data:", error);
    res.status(500).json({
      message: "Failed to fetch client segmentation dashboard data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- Client Anniversary ---

async function getClientAnniversaryData(
  organizationId: number,
  advisorIds?: number[]
): Promise<ClientAnniversaryData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);

  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Get all users (advisors) for name lookup
  const allUsers = await storage.getUsersByOrganization(organizationId);
  const userLookup = allUsers.reduce((acc, user) => {
    acc[user.id] = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return acc;
  }, {} as { [key: number]: string });

  // Helper function to calculate days until next anniversary
  const calculateDaysUntilAnniversary = (
    inceptionDate: string
  ): { days: number; nextAnniversaryDate: string; yearsWithFirm: number } => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Parse the inception date
    const startDate = new Date(inceptionDate);
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    // Calculate next anniversary this year
    let nextAnniversary = new Date(currentYear, startMonth, startDay);

    // If anniversary has passed this year, use next year
    if (nextAnniversary < today) {
      nextAnniversary = new Date(currentYear + 1, startMonth, startDay);
    }

    // Calculate days until anniversary
    const timeDiff = nextAnniversary.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Calculate years with firm
    const yearsWithFirm = Math.max(
      1,
      today.getFullYear() - startDate.getFullYear()
    );

    return {
      days: daysDiff,
      nextAnniversaryDate: nextAnniversary.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      yearsWithFirm,
    };
  };

  // Process clients and calculate anniversary information
  const anniversaryClients = filteredClients
    .filter((client) => client.inceptionDate) // Only include clients with inception dates
    .map((client) => {
      // Handle inceptionDate - convert to string format YYYY-MM-DD
      const inceptionDateString = new Date(client.inceptionDate!)
        .toISOString()
        .split("T")[0];

      const { days, nextAnniversaryDate, yearsWithFirm } =
        calculateDaysUntilAnniversary(inceptionDateString);
      const advisorName =
        userLookup[client.primaryAdvisorId || 0] || "Unknown Advisor";

      return {
        id: String(client.id),
        clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        segment: client.segment || "Silver",
        originalStartDate: inceptionDateString,
        nextAnniversaryDate,
        daysUntilNextAnniversary: days,
        yearsWithFirm,
        advisorName,
      };
    })
    .sort((a, b) => a.daysUntilNextAnniversary - b.daysUntilNextAnniversary);

  // Generate filter options from actual data
  const segmentSet = new Set(anniversaryClients.map((c) => c.segment));
  const uniqueSegments = ["All Segments", ...Array.from(segmentSet).sort()];

  const tenureOptions = ["Any Tenure", "1-5 years", "5-10 years", "10+ years"];

  const advisorSet = new Set(anniversaryClients.map((c) => c.advisorName));
  const uniqueAdvisors = [
    { id: "all", name: "All Advisors" },
    ...Array.from(advisorSet)
      .sort()
      .map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, "_"),
        name,
      })),
  ];

  return {
    clients: anniversaryClients,
    totalRecords: anniversaryClients.length,
    filterOptions: {
      segments: uniqueSegments,
      tenures: tenureOptions,
      advisors: uniqueAdvisors,
    },
  };
}

export async function getClientAnniversaryHandler(req: Request, res: Response) {
  try {
    const { search, segment, tenure, advisorId, upcomingMilestonesOnly } =
      req.query;
    const user = req.user as any;
    const organizationId = user?.organizationId;

    // Determine advisor filtering
    let advisorIds: number[] | undefined;
    if (advisorId && typeof advisorId === "string" && advisorId !== "all") {
      // Try to find advisor by ID
      const allUsers = await storage.getUsersByOrganization(organizationId);
      const advisor = allUsers.find((u) => {
        const advisorName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        return (
          advisorName.toLowerCase().replace(/\s+/g, "_") === advisorId ||
          String(u.id) === advisorId
        );
      });

      if (advisor) {
        advisorIds = [advisor.id];
      }
    }

    // Get real data from the database
    const { clients: allClients, filterOptions } =
      await getClientAnniversaryData(organizationId, advisorIds);

    let filteredClients = allClients;

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
      filterOptions,
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

async function getClientInceptionData(
  organizationId: number,
  currentYear: number = 2024,
  advisorIds?: number[]
): Promise<ClientInceptionData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);

  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Group clients by their inception year
  const clientsByYear = _.groupBy(filteredClients, (client) => {
    let inceptionDate: Date;

    if (client.inceptionDate) {
      inceptionDate = new Date(client.inceptionDate);
    } else {
      inceptionDate = new Date(client.createdAt);
    }

    const year = inceptionDate.getFullYear();

    return year;
  });

  // Generate historical chart data from 2018 to 2025
  const chartData: any[] = [];
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  years.forEach((year) => {
    const yearClients = clientsByYear[year] || [];

    // Group by segment for this year
    const segmentCounts = {
      Platinum: yearClients.filter(
        (c) => (c.segment || "Silver") === "Platinum"
      ).length,
      Gold: yearClients.filter((c) => (c.segment || "Silver") === "Gold")
        .length,
      Silver: yearClients.filter((c) => (c.segment || "Silver") === "Silver")
        .length,
    };

    chartData.push({
      year: year.toString(),
      Platinum: segmentCounts.Platinum,
      Gold: segmentCounts.Gold,
      Silver: segmentCounts.Silver,
      Total: yearClients.length,
    });
  });

  // Calculate YTD new clients and percentage change
  const currentYearClients = clientsByYear[currentYear] || [];
  const previousYearClients = clientsByYear[currentYear - 1] || [];

  const ytdNewClients = currentYearClients.length;
  const previousYearCount = previousYearClients.length;
  const percentageChange =
    previousYearCount > 0
      ? Math.round(
          ((ytdNewClients - previousYearCount) / previousYearCount) * 100
        )
      : 0;

  // Generate KPI data
  const kpi = {
    ytdNewClients,
    percentageChangeVsPreviousYear: percentageChange,
  };

  // Generate legend data for selected year
  const legendDataForSelectedYear = chartData.find(
    (d) => d.year === String(currentYear)
  );
  const chartLegend = legendDataForSelectedYear
    ? [
        { segment: "Platinum", count: legendDataForSelectedYear.Platinum },
        { segment: "Gold", count: legendDataForSelectedYear.Gold },
        { segment: "Silver", count: legendDataForSelectedYear.Silver },
        { segment: "Total", count: legendDataForSelectedYear.Total },
      ]
    : [];

  // Generate table data for current year
  const tableClients = currentYearClients.map((client) => ({
    id: String(client.id),
    name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
    email: client.emailAddress || "",
    segment: client.segment || "Silver",
    inceptionDate: client.inceptionDate
      ? new Date(client.inceptionDate).toISOString().split("T")[0]
      : client.createdAt.toISOString().split("T")[0],
  }));

  return {
    kpi,
    chartData,
    chartLegend,
    tableClients,
    totalTableRecords: tableClients.length,
    availableYears: years,
    currentYear,
  };
}

export async function getClientInceptionHandler(req: Request, res: Response) {
  try {
    const currentYear = req.query.year
      ? parseInt(req.query.year as string)
      : 2024;
    const segmentFilter = (req.query.segmentFilter as string) || "All Segments";
    const search = req.query.search as string;
    const user = req.user as any;
    const organizationId = user?.organizationId;

    // Get real data from the database
    const data = await getClientInceptionData(organizationId, currentYear);

    let filteredTableClients = data.tableClients;

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
      ...data,
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

async function getReferralAnalyticsData(
  organizationId: number,
  advisorIds?: number[]
): Promise<ReferralAnalyticsData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);
  
  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Get all users for name lookup (both referrers and primary advisors)
  const allUsers = await storage.getUsersByOrganization(organizationId);
  const userLookup = allUsers.reduce((acc, user) => {
    acc[user.id] = {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email || "",
    };
    return acc;
  }, {} as { [key: number]: { name: string; email: string } });

  // Filter clients who have a referredBy value (were referred by someone)
  const referredClients = filteredClients.filter((client) => client.referredBy);

  // Group referred clients by referrer
  const clientsByReferrer = _.groupBy(referredClients, (client) => 
    client.referredBy
  );

  // Calculate total referrals
  const totalReferrals = referredClients.length;

  // Generate referral sources data
  const referralSources = Object.keys(clientsByReferrer).map((referrerId) => {
    const referrerClients = clientsByReferrer[referrerId];
    const referrerInfo = userLookup[parseInt(referrerId)] || {
      name: "Unknown Referrer",
      email: "",
    };
    
    const totalReferralsForSource = referrerClients.length;
    const percentage = totalReferrals > 0 
      ? Math.round((totalReferralsForSource / totalReferrals) * 100)
      : 0;
    
    // Calculate total AUM for this referrer's clients
    const totalAUM = referrerClients.reduce(
      (sum, client) => sum + parseFloat(client.aum || "0"),
      0
    );

    // Format clients referred by this source
    const formattedClients = referrerClients.map((client) => {
      const primaryAdvisorInfo = userLookup[client.primaryAdvisorId || 0] || {
        name: "Unknown Advisor",
        email: "",
      };

      return {
        id: String(client.id),
        clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        segment: (client.segment || "Silver") as "Platinum" | "Gold" | "Silver",
        referredBy: referrerInfo.name,
        primaryAdvisor: primaryAdvisorInfo.name,
        aum: Math.round(parseFloat(client.aum || "0")),
        referralDate: client.inceptionDate
          ? new Date(client.inceptionDate).toISOString().split("T")[0]
          : client.createdAt.toISOString().split("T")[0],
      };
    });

    return {
      id: referrerId,
      name: referrerInfo.name,
      company: "", // Could be added to user schema if needed
      totalReferrals: totalReferralsForSource,
      percentage,
      totalAUM: Math.round(totalAUM),
      clients: formattedClients,
    };
  }).sort((a, b) => b.totalReferrals - a.totalReferrals); // Sort by total referrals desc

  // Generate all referrals list
  const allReferrals = referralSources.flatMap((source) => source.clients);

  // Generate filter options
  const filterOptions = {
    referrers: [
      { id: "all", name: "All Referrers" },
      ...referralSources.map((source) => ({
        id: source.id,
        name: source.name,
      })),
    ],
  };

  return {
    totalReferrals,
    allReferrals,
    referralSources,
    filterOptions,
  };
}

export async function getReferralAnalyticsHandler(req: Request, res: Response) {
  try {
    const { search, referrer } = req.query;
    const user = req.user as any;
    const organizationId = user?.organizationId;

    // Get real data from the database
    const data = await getReferralAnalyticsData(organizationId);

    // Start with all referrals from the real data
    let filteredReferrals = [...data.allReferrals];

    // Apply filters
    if (search && typeof search === "string") {
      filteredReferrals = filteredReferrals.filter(
        (referral) =>
          referral.clientName.toLowerCase().includes(search.toLowerCase()) ||
          referral.referredBy.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (referrer && typeof referrer === "string" && referrer !== "all") {
      // Find referrer by ID
      const referrerInfo = data.filterOptions.referrers.find(
        (ref) => ref.id === referrer
      );
      if (referrerInfo && referrerInfo.name !== "All Referrers") {
        filteredReferrals = filteredReferrals.filter(
          (r) => r.referredBy === referrerInfo.name
        );
      }
    }

    // Return the exact same structure as expected by the frontend
    const responseData: ReferralAnalyticsData = {
      totalReferrals: data.totalReferrals,
      allReferrals: filteredReferrals,
      referralSources: data.referralSources,
      filterOptions: data.filterOptions,
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

async function getClientReferralRateData(
  organizationId: number,
  advisorIds?: number[]
): Promise<ClientReferralRateData> {
  // Fetch real clients from the database
  const clients = await storage.getClientsByOrganization(organizationId);
  
  // If advisorIds are specified, filter clients by those advisors
  let filteredClients = clients;
  if (advisorIds && advisorIds.length > 0) {
    filteredClients = clients.filter((client) =>
      advisorIds.includes(client.primaryAdvisorId || 0)
    );
  }

  // Generate last 12 months of data
  const chartData: any[] = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    
    // Filter clients who joined in this month
    const monthlyClients = filteredClients.filter((client) => {
      const inceptionDate = client.inceptionDate 
        ? new Date(client.inceptionDate)
        : new Date(client.createdAt);
      return inceptionDate.getFullYear() === year && inceptionDate.getMonth() === month;
    });

    // Count total new clients and referred clients for this month
    const totalNewClients = monthlyClients.length;
    const referredClients = monthlyClients.filter((client) => client.referredBy).length;
    
    // Calculate referral rate: (Number of referred clients / Total number of clients) x 100
    const referralRate = totalNewClients > 0 
      ? Math.round((referredClients / totalNewClients) * 100 * 10) / 10 // Round to 1 decimal
      : 0;

    // Format month name
    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const shortMonth = date.toLocaleDateString("en-US", { month: "short" });

    chartData.push({
      month: monthName,
      shortMonth: shortMonth,
      referralRate,
      referredClients,
      totalNewClients,
    });
  }

  // Get current month data (last in array)
  const currentMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];

  // Calculate KPIs
  const currentRate = currentMonth.referralRate;
  const rateChange = previousMonth 
    ? Math.round((currentRate - previousMonth.referralRate) * 10) / 10
    : 0;
  const newClientsThisMonth = currentMonth.totalNewClients;
  const referredClientsThisMonth = currentMonth.referredClients;

  return {
    kpi: {
      currentRate,
      rateChange,
      newClientsThisMonth,
      referredClientsThisMonth,
    },
    chartData,
  };
}

export async function getClientReferralRateHandler(
  req: Request,
  res: Response
) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;

  try {
    // Get real data from the database
    const reportData = await getClientReferralRateData(
      organizationId,
      advisorId ? [advisorId] : undefined
    );

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
