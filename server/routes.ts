import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClientSchema,
  insertDataMappingSchema,
} from "@shared/schema";

import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { setupWealthboxOAuth } from "./oauth";
import { aiQueryHandler } from "./ai";
import { setupAuth } from "./auth";
import {
  testWealthboxConnectionHandler,
  importWealthboxDataHandler,
  getWealthboxUsersHandler,
  getActiveClientsByStateHandler,
  getActiveClientsByAgeHandler,
  getWealthboxUsers
} from "./wealthbox";
import {
  setupOrionConnectionHandler,
  testOrionConnectionHandler,
  getOrionStatusHandler,
  syncOrionClientsHandler,
  syncOrionAccountsHandler,
  syncOrionAumHistoryHandler,
  getOrionAumTimeSeriesHandler,
  getOrionSyncJobStatusHandler,
  getUserOrionSyncJobsHandler,
  getOrionAumChartDataHandler
} from "./orion";
import {
  getDataMappingsHandler,
  saveDataMappingsHandler
} from "./api/data-mapping";
import { synchronizeWealthboxData } from "./sync-service";
import {
  getOpportunitiesByPipelineHandler,
  getOpportunityStagesHandler,
} from "./opportunities";
import { getWealthboxTokenHandler } from "./api/wealthbox-token";
import { getWealthboxToken } from "./utils/wealthbox-token";

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { isDemoMode } from "./demo-data";
import {
  getDemoAdvisorMetrics,
  getDemoClientDemographics,
} from "./demo-analytics";
import _ from "lodash";
// Load environment variables
dotenv.config();

const WEALTHBOX_CLIENT_ID = process.env.WEALTHBOX_CLIENT_ID || "mock_client_id";
const WEALTHBOX_CLIENT_SECRET =
  process.env.WEALTHBOX_CLIENT_SECRET || "mock_client_secret";
const WEALTHBOX_REDIRECT_URI =
  process.env.WEALTHBOX_REDIRECT_URI ||
  "http://localhost:5000/api/wealthbox/callback";
const WEALTHBOX_AUTH_URL = "https://api.wealthbox.com/oauth/authorize";
const WEALTHBOX_TOKEN_URL = "https://api.wealthbox.com/oauth/token";

// Setup session store
const MemoryStoreSession = MemoryStore(session);

const userFetchQueue: (() => Promise<void>)[] = [];
const processQueue = async () => {
  console.log("processing queue");
  while (userFetchQueue.length > 0) {
    const fetchUserTask = userFetchQueue.shift();
    if (fetchUserTask) {
      try {
        await fetchUserTask();
      } catch (error) {
        console.error("Error processing user fetch task:", error);
      }
    }
  }
};
// Start processing the queue (You might want to set this up elsewhere in your app)
setInterval(processQueue, 10000); // adjust interval as needed

// --- START: Added for Age Demographics Report ---
// Define interfaces for the report data structure (can be moved to a shared types file)
interface SegmentBreakdown {
  segment: string;
  clients: number;
  aum: number;
}

interface AgeBracketDataEntry {
  bracket: string;
  clientCount: number;
  clientPercentage: number;
  aum: number;
  aumPercentage: number;
  detailedBreakdown: SegmentBreakdown[];
}

interface ClientReportDetail {
  id: string;
  name: string;
  age: number;
  segment: string;
  joinDate: string;
  aum: number;
}

interface AgeDemographicsData {
  overall: {
    totalClients: number;
    totalAUM: number;
    averageClientAge: number;
  };
  byAgeBracket: AgeBracketDataEntry[];
  clientDetails: ClientReportDetail[];
}

const getMockAgeDemographicsReportData = async (organizationId: number, advisorIds?: number[]): Promise<AgeDemographicsData> => {
  // This data should ideally be generated based on advisorId or fetched from a service

  // get all clients based on age
  const clients = await storage.getClientsByOrganization(organizationId);
  const clientsByAgeGroups = _.groupBy(clients, (client) => {
    const age = client.age;
    if (age < 20) return "<20";
    else if (age >= 20 && age <= 40) return "21-40";
    else if (age > 40 && age <= 60) return "41-60";
    else if (age > 60 && age <= 80) return "61-80";
    else return ">80";
  });

  const ageBrackets = ["<20", "21-40", "41-60", "61-80", ">80"];
  let totalClients = 0;
  ageBrackets.forEach(bracket => {
    totalClients += (clientsByAgeGroups[bracket]?.length || 0);
  });

  const byAgeBracketData: AgeBracketDataEntry[] = [
    {
      bracket: "<20", clientCount: 0, clientPercentage: 0, aum: 50000, aumPercentage: 0.67,
      detailedBreakdown: [{ segment: "Silver", clients: 1, aum: 50000 }]
    },
    {
      bracket: "21-40", clientCount: 0, clientPercentage: 0, aum: 740000, aumPercentage: 10.0,
      detailedBreakdown: [
        { segment: "Silver", clients: 5, aum: 300000 },
        { segment: "Gold", clients: 3, aum: 440000 },
      ]
    },
    {
      bracket: "41-60", clientCount: 0, clientPercentage: 0, aum: 2105000, aumPercentage: 28.4,
      detailedBreakdown: [
        { segment: "Silver", clients: 2, aum: 200000 },
        { segment: "Gold", clients: 6, aum: 1205000 },
        { segment: "Platinum", clients: 3, aum: 700000 },
      ]
    },
    {
      bracket: "61-80", clientCount: 0, clientPercentage: 0, aum: 3660000, aumPercentage: 49.4,
      detailedBreakdown: [
        { segment: "Gold", clients: 4, aum: 1000000 },
        { segment: "Platinum", clients: 6, aum: 2660000 },
      ]
    },
    {
      bracket: ">80", clientCount: 0, clientPercentage: 0, aum: 850000, aumPercentage: 11.5,
      detailedBreakdown: [
        { segment: "Gold", clients: 2, aum: 300000 },
        { segment: "Platinum", clients: 3, aum: 550000 },
      ]
    },
  ];

  const updatedByAgeBracket = byAgeBracketData.map(entry => {
    const count = clientsByAgeGroups[entry.bracket]?.length || 0;
    const percentage = totalClients > 0 ? (count / totalClients) * 100 : 0;
    const generatedDetailedBreakdown: SegmentBreakdown[] = [];
    // Assuming entry.detailedBreakdown (from byAgeBracketData) always has segment templates
    const predefinedSegmentTemplates = entry.detailedBreakdown; 
    const numSegments = predefinedSegmentTemplates.length;

    if (count > 0 && numSegments > 0) { // count is the actual number of clients in this age bracket
      const clientsPerSegmentBase = Math.floor(count / numSegments);
      let remainderClients = count % numSegments;

      predefinedSegmentTemplates.forEach((segmentTemplate) => {
        let segmentClientCount = clientsPerSegmentBase;
        if (remainderClients > 0) {
          segmentClientCount++;
          remainderClients--;
        }
        generatedDetailedBreakdown.push({
          segment: segmentTemplate.segment,
          clients: segmentClientCount,
          // Dummy AUM: if clients > 0, assign a random-ish AUM, otherwise 0.
          aum: segmentClientCount > 0 ? segmentClientCount * (40000 + Math.floor(Math.random() * 20000) * 1000) : 0,
        });
      });
    } else if (numSegments > 0) { // count is 0 for this bracket
      predefinedSegmentTemplates.forEach(segmentTemplate => {
        generatedDetailedBreakdown.push({
          segment: segmentTemplate.segment,
          clients: 0,
          aum: 0,
        });
      });
    }
    // If numSegments is 0 (i.e., entry.detailedBreakdown was empty), generatedDetailedBreakdown will be empty.

    return {
      ...entry, // This carries over other properties from the original entry,
          // including potentially outdated bracket-level 'aum' and 'aumPercentage'.
      clientCount: count,
      clientPercentage: parseFloat(percentage.toFixed(1)), // Keep one decimal place
      detailedBreakdown: generatedDetailedBreakdown,
    };
  });

  const averageClientAge = parseFloat((clients.reduce((sum, client) => sum + client.age, 0) / totalClients || 0).toFixed(1));

  return {
    overall: {
      totalClients: totalClients, // Use calculated total clients
      totalAUM: 7405000, // This should also be calculated in a real scenario
      averageClientAge, // Keep one decimal place
    },
    byAgeBracket: updatedByAgeBracket,
    clientDetails: clients.map((client: any, index: number) => {
      // Predefined list of mock segment, joinDate, and AUM details to cycle through
      const mockDetailsList = [
        { segment: 'Gold', joinDate: '2022-02-14', aum: 130000 },
        { segment: 'Platinum', joinDate: '2018-07-21', aum: 750000 },
        { segment: 'Silver', joinDate: '2023-01-10', aum: 80000 },
        { segment: 'Gold', joinDate: '2019-05-05', aum: 220000 },
        { segment: 'Platinum', joinDate: '2015-11-30', aum: 1200000 },
        { segment: 'Silver', joinDate: '2024-01-15', aum: 50000 },
        { segment: 'Silver', joinDate: '2023-08-22', aum: 60000 },
      ];
      const mockEntry = mockDetailsList[index % mockDetailsList.length];

      return {
        id: String(client.id), // Use actual client ID, converted to string
        name: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(), // Use actual client name or construct it
        age: client.age,       // Use actual client age
        segment: mockEntry.segment, // Keep mock segment
        joinDate: mockEntry.joinDate, // Keep mock joinDate
        aum: mockEntry.aum,         // Keep mock AUM
      };
    }),
  };
};

async function getAgeDemographicsReportData(organizationId: number, advisorIds?: number[]): Promise<AgeDemographicsData> {
  // This function should fetch and process the actual data from your database or API
  // For now, returning mock data:
  return await getMockAgeDemographicsReportData(organizationId, advisorIds);
}

async function getAgeDemographicsReportHandler(req: Request, res: Response) {
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
    res.status(500).json({ message: "Failed to fetch age demographics report data", error: error instanceof Error ? error.message : "Unknown error" });
  }
}
// --- END: Added for Age Demographics Report ---


// --- START: Interfaces for Client Distribution Report (can be shared) ---
interface TopStateSummary {
  stateName: string;
  value: number | string;
  metricLabel: 'clients' | 'AUM';
}

interface StateMetric {
  stateCode: string;
  stateName: string;
  clientCount: number;
  totalAum: number;
}

interface ClientInStateDetail {
  id: string;
  name: string;
  segment: string;
  aum: number;
}

interface ClientDistributionReportData {
  topStateByClients: TopStateSummary;
  topStateByAUM: TopStateSummary;
  stateMetrics: StateMetric[];
  clientDetailsByState: { [stateCode: string]: ClientInStateDetail[] };
}
// --- END: Interfaces for Client Distribution Report ---


// --- START: Mock Data and Handler for Client Distribution Report ---

// Helper for state code to name mapping (can be expanded)
const stateCodeToNameMapping: { [key: string]: string } = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
  "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
  "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
  "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
  "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
  "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
  "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
  "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
  "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
  // Optionally, include US territories if needed
  "AS": "American Samoa", "DC": "District of Columbia", "FM": "Federated States of Micronesia",
  "GU": "Guam", "MH": "Marshall Islands", "MP": "Northern Mariana Islands", "PW": "Palau",
  "PR": "Puerto Rico", "VI": "U.S. Virgin Islands"
};

// Generic templates for mocking client segment and AUM
const genericClientDetailsTemplates = [
  { segment: 'Ultra High Net Worth', baseAum: 2000000, randomAumRange: 10000000 },
  { segment: 'High Net Worth', baseAum: 500000, randomAumRange: 1500000 },
  { segment: 'Mass Affluent', baseAum: 100000, randomAumRange: 400000 },
  { segment: 'Affluent', baseAum: 250000, randomAumRange: 750000 },
  { segment: 'Emerging High Net Worth', baseAum: 750000, randomAumRange: 1250000 },
];

async function getMockClientDistributionReportData(organizationId: number): Promise<ClientDistributionReportData> {
  const clients = await storage.getClientsByOrganization(organizationId);
  
  const clientsByState = _.groupBy(clients, (client) => {
    return (client.contactInfo as any)?.address?.state?.toUpperCase() || "Unknown"; // Normalize state code
  });

  console.log("clientsByState", clientsByState);

  const stateMetrics: StateMetric[] = [];
  const clientDetailsByStateProcessed: { [stateCode: string]: ClientInStateDetail[] } = {};

  let topStateByClientsSummary: TopStateSummary = { stateName: "N/A", value: 0, metricLabel: 'clients' };
  let topStateByAUMSummary: TopStateSummary = { stateName: "N/A", value: "$0", metricLabel: 'AUM' };
  let maxClients = 0;
  let maxAum = 0;

  for (const stateCode of Object.keys(clientsByState)) {
    if (stateCode === "Unknown") { // Skip "Unknown" state category
      continue;
    }

    const actualClientsInState = clientsByState[stateCode];
    const clientCount = actualClientsInState.length;

    if (clientCount === 0) {
      continue;
    }

    const stateName = stateCodeToNameMapping[stateCode] || stateCode; // Use full name from mapping or state code itself
    let currentTotalAumForState = 0;

    clientDetailsByStateProcessed[stateCode] = actualClientsInState.map((client, index) => {
      const template = genericClientDetailsTemplates[index % genericClientDetailsTemplates.length];
      const clientAum = Math.floor(template.baseAum + Math.random() * template.randomAumRange);
      currentTotalAumForState += clientAum;
      return {
        id: String(client.id),
        name: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        segment: template.segment,
        aum: clientAum,
      };
    });

    stateMetrics.push({
      stateCode: stateCode,
      stateName: stateName,
      clientCount: clientCount,
      totalAum: currentTotalAumForState,
    });

    if (clientCount > maxClients) {
      maxClients = clientCount;
      topStateByClientsSummary = { stateName, value: clientCount, metricLabel: 'clients' };
    }
    if (currentTotalAumForState > maxAum) {
      maxAum = currentTotalAumForState;
      topStateByAUMSummary = {
        stateName,
        value: currentTotalAumForState.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0 }),
        metricLabel: 'AUM'
      };
    }
  }

  // If after processing all actual client data, no valid states were found,
  // top summaries will remain "N/A" / "$0".
  // This is more realistic than adding a default state if no data exists.

  return {
    topStateByClients: topStateByClientsSummary,
    topStateByAUM: topStateByAUMSummary,
    stateMetrics: stateMetrics.sort((a, b) => b.clientCount - a.clientCount),
    clientDetailsByState: clientDetailsByStateProcessed,
  };
}

// --- END: Mock Data and Handler for Client Distribution Report ---

async function getClientDistributionReportHandler(req: Request, res: Response) {
  const user = req.user as any;
  // const advisorId = user?.id; // Or from query/params
  const advisorIdQuery = req.query.advisorId as string | undefined;
  const advisorId = advisorIdQuery ? parseInt(advisorIdQuery, 10) : undefined;
  const organizationId = user?.organizationId;
  try {
    const reportData = await getMockClientDistributionReportData(organizationId);
    res.json(reportData);
  } catch (error) {
    console.error("Error fetching client distribution report data:", error);
    res.status(500).json({ message: "Failed to fetch client distribution report data", error: error instanceof Error ? error.message : "Unknown error" });
  }
}
// --- END: Mock Data and Handler ---

// Add after the existing report interfaces and before the export function

// --- START: Interfaces for Book Development Report ---
interface BookDevelopmentClient {
  id: string;
  name: string;
  segment: 'Platinum' | 'Gold' | 'Silver';
  yearsWithFirm: number;
  yearsWithFirmText: string;
  sinceDateText: string;
  aum: number;
}

interface YearlySegmentDataPoint {
  year: number;
  value: number;
  previousYearValue?: number;
}

interface BookDevelopmentSegmentData {
  name: 'Platinum' | 'Gold' | 'Silver';
  color: string;
  fillColor?: string;
  dataAUM: YearlySegmentDataPoint[];
  dataClientCount: YearlySegmentDataPoint[];
  clients: BookDevelopmentClient[];
}

interface BookDevelopmentReportData {
  allSegmentsData: BookDevelopmentSegmentData[];
}
// --- END: Interfaces for Book Development Report ---

// --- START: Mock Data and Handler for Book Development Report ---
const SEGMENT_COLORS = {
  Platinum: {
    base: 'hsl(222, 47%, 44%)',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  Gold: {
    base: 'hsl(216, 65%, 58%)',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
  },
  Silver: {
    base: 'hsl(210, 55%, 78%)',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
  },
};

async function getMockBookDevelopmentReportData(organizationId: number): Promise<BookDevelopmentReportData> {
  const clients = await storage.getClientsByOrganization(organizationId);
  
  // Group clients by segment
  const clientsBySegment = _.groupBy(clients, (client) => {
    // Mock segment assignment based on client data or use a default mapping
    const clientId = client.id;
    if (clientId % 3 === 0) return 'Platinum';
    if (clientId % 3 === 1) return 'Gold';
    return 'Silver';
  });

  console.log("clientsBySegment", clientsBySegment);

  // Generate historical data based on actual client join dates
  const generateYearlyData = (
    baseClients: any[],
    startValue: number,
    growthRate: number,
    isAUM: boolean
  ): YearlySegmentDataPoint[] => {
    let currentVal = startValue;
    let prevVal: number | undefined = undefined;
    const data: YearlySegmentDataPoint[] = [];
    
    for (let year = 2015; year <= 2025; year++) {
      const point: YearlySegmentDataPoint = {
        year,
        value: Math.round(currentVal),
        previousYearValue: prevVal !== undefined ? Math.round(prevVal) : undefined
      };
      data.push(point);
      prevVal = currentVal;
      
      // Calculate growth based on actual client data where possible
      const clientsJoinedThisYear = baseClients.filter(client => {
        const joinYear = new Date(client.createdAt).getFullYear();
        return joinYear === year;
      }).length;
      
      const baseGrowth = Math.random() * growthRate * (isAUM ? 1 : 0.5) + (isAUM ? 0.02 : 0.01);
      const clientInfluencedGrowth = clientsJoinedThisYear * 0.01; // Small boost for each new client
      
      currentVal *= (1 + baseGrowth + clientInfluencedGrowth);
      
      if (isAUM && currentVal < 1000000) currentVal = 1000000 * (1 + Math.random() * 0.1);
      else if (!isAUM && currentVal < 5) currentVal = 5 * (1 + Math.random() * 0.1);
    }
    return data;
  };

  // Create formatted client data for each segment
  const formatClientsForSegment = (clients: any[], segment: 'Platinum' | 'Gold' | 'Silver'): BookDevelopmentClient[] => {
    return clients.map((client, index) => {
      const yearsWithFirm = Math.max(1, new Date().getFullYear() - new Date(client.createdAt).getFullYear());
      const joinDate = new Date(client.createdAt);
      const sinceDateText = `Since ${joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      
      // Mock AUM based on segment
      const baseAUM = segment === 'Platinum' ? 30000000 : segment === 'Gold' ? 10000000 : 5000000;
      const mockAUM = baseAUM + (Math.random() * baseAUM * 0.5);

      return {
        id: String(client.id),
        name: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        segment,
        yearsWithFirm,
        yearsWithFirmText: `${yearsWithFirm} year${yearsWithFirm !== 1 ? 's' : ''}`,
        sinceDateText,
        aum: Math.round(mockAUM)
      };
    });
  };

  // Process each segment
  const allSegmentsData: BookDevelopmentSegmentData[] = [
    {
      name: 'Platinum',
      color: SEGMENT_COLORS.Platinum.base,
      fillColor: SEGMENT_COLORS.Platinum.base,
      dataAUM: generateYearlyData(clientsBySegment.Platinum || [], 70000000, 0.08, true),
      dataClientCount: generateYearlyData(clientsBySegment.Platinum || [], 10, 0.05, false),
      clients: formatClientsForSegment(clientsBySegment.Platinum || [], 'Platinum')
    },
    {
      name: 'Gold',
      color: SEGMENT_COLORS.Gold.base,
      fillColor: SEGMENT_COLORS.Gold.base,
      dataAUM: generateYearlyData(clientsBySegment.Gold || [], 40000000, 0.06, true),
      dataClientCount: generateYearlyData(clientsBySegment.Gold || [], 25, 0.04, false),
      clients: formatClientsForSegment(clientsBySegment.Gold || [], 'Gold')
    },
    {
      name: 'Silver',
      color: SEGMENT_COLORS.Silver.base,
      fillColor: SEGMENT_COLORS.Silver.base,
      dataAUM: generateYearlyData(clientsBySegment.Silver || [], 20000000, 0.05, true),
      dataClientCount: generateYearlyData(clientsBySegment.Silver || [], 40, 0.03, false),
      clients: formatClientsForSegment(clientsBySegment.Silver || [], 'Silver')
    }
  ];

  return { allSegmentsData };
}

async function getBookDevelopmentReportHandler(req: Request, res: Response) {
  const user = req.user as any;
  const organizationId = user?.organizationId;
  
  try {
    const reportData = await getMockBookDevelopmentReportData(organizationId);
    res.json(reportData);
  } catch (error) {
    console.error("Error fetching book development report data:", error);
    res.status(500).json({ 
      message: "Failed to fetch book development report data", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}
// --- END: Mock Data and Handler for Book Development Report ---

// Add this route registration in the registerRoutes function, after the existing report routes:
// Add this line after the other report route registrations:

// filepath: /home/runner/workspace/server/routes.ts
// ... existing code ...
// --- END: Mock Data and Handler for Book Development Report ---

// --- START: Interfaces for Client Birthday Report ---
interface BirthdayClient {
  id: string;
  clientName: string;
  grade: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | string; // Allow for other grades
  dateOfBirth: string; // YYYY-MM-DD
  nextBirthdayDisplay: string; // e.g., "In 5 days" or "Jan 15"
  nextBirthdayDate: string; // YYYY-MM-DD of the upcoming birthday
  turningAge: number;
  aum: number;
  clientTenure: string; // e.g., "5 years"
  advisorName: string;
}

interface BirthdayReportFilters {
  grades: string[];
  advisors: string[];
  // Months and Tenures are static, can be defined on frontend or sent if dynamic
}

interface ClientBirthdayReportData {
  clients: BirthdayClient[];
  filters: BirthdayReportFilters;
}
// --- END: Interfaces for Client Birthday Report ---

// --- START: Handler and Logic for Client Birthday Report ---

// Helper function to calculate next birthday and turning age
function calculateBirthdayDetails(dobString: string): { nextBirthdayDisplay: string, nextBirthdayDate: string, turningAge: number, daysUntilNextBirthday: number } {
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) {
    return { nextBirthdayDisplay: 'N/A', nextBirthdayDate: 'N/A', turningAge: 0, daysUntilNextBirthday: Infinity };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day

  let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const turningAge = nextBirthday.getFullYear() - dob.getFullYear();

  const timeDiff = nextBirthday.getTime() - today.getTime();
  const daysUntilNextBirthday = Math.ceil(timeDiff / (1000 * 3600 * 24));

  let nextBirthdayDisplay = '';
  if (daysUntilNextBirthday === 0) {
    nextBirthdayDisplay = 'Today!';
  } else if (daysUntilNextBirthday === 1) {
    nextBirthdayDisplay = 'Tomorrow';
  } else if (daysUntilNextBirthday <= 30) {
    nextBirthdayDisplay = `In ${daysUntilNextBirthday} days`;
  } else {
    nextBirthdayDisplay = nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Append the date for clarity if it's not "Today" or "Tomorrow"
  if (daysUntilNextBirthday > 1) {
      nextBirthdayDisplay += ` (${nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }

  return {
    nextBirthdayDisplay,
    nextBirthdayDate: nextBirthday.toISOString().split('T')[0],
    turningAge,
    daysUntilNextBirthday
  };
}

// Helper function to calculate client tenure
function calculateClientTenure(joinDateString: string): string {
  const joinDate = new Date(joinDateString);
  if (isNaN(joinDate.getTime())) return 'N/A';

  const today = new Date();
  let years = today.getFullYear() - joinDate.getFullYear();
  const months = today.getMonth() - joinDate.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < joinDate.getDate())) {
    years--;
  }
  return years <= 0 ? '<1 year' : `${years} year${years > 1 ? 's' : ''}`;
}

async function getClientBirthdayReportHandler(req: Request, res: Response) {
  const user = req.user as any;
  const organizationId = user?.organizationId;

  // Extract filter query parameters
  const {
    nameSearch,
    grade: gradeFilter,
    month: monthFilter, // Expect month number 1-12
    tenure: tenureFilter, // Expect "1-2", "2-5", "5-10", "10+"
    advisor: advisorFilter,
  } = req.query;

  try {
    const allClientsRaw = await storage.getClientsByOrganization(organizationId);
    const allAdvisorsRaw = await storage.getUsersByOrganization(organizationId, ['advisor']);

    const advisorMap = new Map(allAdvisorsRaw.map(adv => [adv.id, adv.name || `${adv.firstName} ${adv.lastName}`.trim()]));

    let processedClients: BirthdayClient[] = allClientsRaw.map(client => {
      // Assuming client.dateOfBirth and client.createdAt exist
      // If not, these will need to be mocked or sourced
      const dob = client.age ? new Date(new Date().getFullYear() - client.age, 0, 1).toISOString().split('T')[0] : '1970-01-01'; // Fallback if no DOB
      const joinDate = client.createdAt ? new Date(client.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; // Fallback
      
      const birthdayDetails = calculateBirthdayDetails(dob);
      const clientTenureYears = calculateClientTenure(joinDate);
      
      return {
        id: String(client.id),
        clientName: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        grade: client.segment || 'N/A',
        dateOfBirth: dob,
        nextBirthdayDisplay: birthdayDetails.nextBirthdayDisplay,
        nextBirthdayDate: birthdayDetails.nextBirthdayDate,
        turningAge: birthdayDetails.turningAge,
        daysUntilNextBirthday: birthdayDetails.daysUntilNextBirthday, // For sorting
        aum: (client as any).aum || Math.floor(Math.random() * 5000000) + 100000, // Mock AUM if not present
        clientTenure: clientTenureYears,
        advisorName: client.primaryAdvisorId ? advisorMap.get(client.primaryAdvisorId) || 'Unassigned' : 'Unassigned',
        // Raw tenure years for filtering
        _tenureYears: new Date().getFullYear() - new Date(joinDate).getFullYear(),
        _nextBirthdayMonth: new Date(birthdayDetails.nextBirthdayDate).getMonth() + 1 // 1-12 for month
      };
    });

    // Apply filters
    if (nameSearch && typeof nameSearch === 'string') {
      processedClients = processedClients.filter(c => c.clientName.toLowerCase().includes(nameSearch.toLowerCase()));
    }
    if (gradeFilter && typeof gradeFilter === 'string' && gradeFilter !== 'All Grades') {
      processedClients = processedClients.filter(c => c.grade === gradeFilter);
    }
    if (monthFilter && typeof monthFilter === 'string' && monthFilter !== 'Any month') {
      const monthNum = parseInt(monthFilter, 10);
      processedClients = processedClients.filter(c => c._nextBirthdayMonth === monthNum);
    }
    if (advisorFilter && typeof advisorFilter === 'string' && advisorFilter !== 'All Advisors') {
      processedClients = processedClients.filter(c => c.advisorName === advisorFilter);
    }
    if (tenureFilter && typeof tenureFilter === 'string' && tenureFilter !== 'Any tenure') {
      processedClients = processedClients.filter(c => {
        const years = c._tenureYears;
        if (tenureFilter === '1-2 years') return years >= 1 && years <= 2;
        if (tenureFilter === '2-5 years') return years > 2 && years <= 5;
        if (tenureFilter === '5-10 years') return years > 5 && years <= 10;
        if (tenureFilter === '10+ years') return years > 10;
        return true;
      });
    }

    // Sort by days until next birthday (ascending)
    processedClients.sort((a, b) => (a as any).daysUntilNextBirthday - (b as any).daysUntilNextBirthday);

    // Prepare filter options for frontend dropdowns
    const uniqueGrades = [...new Set(allClientsRaw.map(c => c.segment || 'N/A'))].sort();
    const uniqueAdvisors = [...advisorMap.values()].sort();

    const reportData: ClientBirthdayReportData = {
      clients: processedClients.map(({ daysUntilNextBirthday, _tenureYears, _nextBirthdayMonth, ...client }) => client), // Remove temporary fields
      filters: {
        grades: uniqueGrades,
        advisors: uniqueAdvisors,
      },
    };

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching client birthday report data:", error);
    res.status(500).json({
      message: "Failed to fetch client birthday report data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
// --- END: Handler and Logic for Client Birthday Report ---



export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(
    session({
      secret: process.env.AUTH_SECRET || "your-secret-key", // Use environment variable if available
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    }),
  );


  // Setup Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for Passport
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email field for the username
        passwordField: "password", // Use password field for the password
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }

          const validPassword = await bcrypt.compare(
            password,
            user.passwordHash,
          );
          if (!validPassword) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Setup OAuth routes
  setupWealthboxOAuth(app);

  // Setup Google OAuth
  setupAuth(app);

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // console.log("req.user",req.user);
      const user = req.user as any;
      let roleName: string;
      if (user.roleId) {
        const role = await storage.getRole(user.roleId);
        // console.log("role",role);
        roleName = role.name;
      }
      // console.log("roleName",roleName);

      if (!roles.includes(roleName)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    };
  };

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Incorrect username" });
      }
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      console.log({ validPassword });
      if (!validPassword) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Log the user in via Passport
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res
            .status(500)
            .json({ message: "Failed to establish session" });
        }
        // Return user without sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    res.json({
      ...req.user,
      role: req?.user?.roleId && storage.getRole(req.user.roleId).name,
    });
  });

  app.post("/api/signup", async (req, res) => {
    try {
      console.log("req.body", req.body);

      // Check if email already exists first - before creating any resources
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 1. Create an organization first
      const orgData = {
        name: `${req.body.organizationName}` || "ABD Org", // Create organization name based on user input
        type: "firm" as const, // Set as firm type
        // parentId is optional, can be null by default
      };

      // Create organization in database
      const newOrg = await storage.createOrganization(orgData);
      console.log("Created organization:", newOrg);

      // 2. Now prepare user data with the new organization ID
      const userData = {
        email: req.body.email,
        passwordHash: await bcrypt.hash(req.body.password, 10),
        firstName: req.body.name,
        lastName: "", // Add logic for last name if needed
        roleId: 1, // Firm owner/admin role
        organizationId: newOrg.id, // Use the newly created org ID
        status: "active",
      };

      const validatedData = insertUserSchema.parse(userData);
      console.log("validatedData", validatedData);

      // 3. Create the user with the organization context
      const newUser = await storage.createUser(validatedData);

      // Return success with both organization and user info
      return res.status(201).json({
        message: "Account created successfully",
        userId: newUser.id,
        organizationId: newOrg.id,
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(400).json({
        message:
          error instanceof z.ZodError
            ? "Invalid data provided"
            : "Failed to create account",
        details: error instanceof z.ZodError ? error.errors : undefined,
      });
    }
  });

  // User routes
  app.get(
    "/api/users",
    requireRole(["global_admin", "firm_admin", "home_office", "firm_admin"]),
    async (req, res) => {
      const user = req.user as any;
      let users;

      if (user.role === "firm_admin") {
        users = await storage.getUsersByOrganization(user.organizationId);
      } else if (user.role === "home_office") {
        // Home office can see users from all firms under them
        users = await storage.getUsersByHomeOffice(user.organizationId);
      } else {
        users = await storage.getUsersByOrganization(user.organizationId);
        // Filter out global_admin users for firm_admin and firm_admin
        users = users.filter((u) => u.role !== "global_admin");
      }

      res.json(users);
    },
  );

  app.get("/api/roles", requireAuth, async (req, res) => {
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.get("/api/statuses", requireAuth, async (req, res) => {
    const statuses = storage.getStatuses();
    res.json(statuses);
  });

  // Get financial advisors (filtered by firm if specified)
  app.get(
    "/api/users/advisors",
    requireRole(["home_office", "firm_admin", "firm_admin"]),
    async (req, res) => {
      const user = req.user as any;
      const firmId = req.query.firmId
        ? parseInt(req.query.firmId as string)
        : null;

      let advisors;

      if (user.role === "home_office" && firmId) {
        // Get advisors for a specific firm under this home office
        advisors = await storage.getAdvisorsByFirm(firmId);
      } else if (user.role === "home_office") {
        // Get all advisors across all firms under this home office
        advisors = await storage.getAdvisorsByHomeOffice(user.organizationId);
      } else {
        // Firm admin or client admin - get advisors in their organization
        advisors = await storage.getUsersByRoleAndOrganization(
          "advisor",
          user.organizationId,
        );
        console.log(
          `Found ${advisors.length} advisors for ${user.username} in organization ${user.organizationId}`,
        );
      }

      res.json(advisors);
    },
  );

  app.post(
    "/api/users",
    async (req, res) => {
      try {
        const user = req.user as any;
        const validatedData = insertUserSchema.parse(req.body);

        // Check if username or email already exists
        const existingUsername = await storage.getUserByUsername(
          validatedData.username,
        );
        if (existingUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }

        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }

        // Client admin can only create financial advisors for their org
        if (user.role === "firm_admin") {
          if (validatedData.role !== "advisor") {
            return res.status(403).json({
              message: "Client admins can only create financial advisor users",
            });
          }
          validatedData.organizationId = user.organizationId;
        }


        const newUser = await storage.createUser(validatedData);
        res.status(201).json(newUser);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  app.put("/api/users/:id", requireRole(["global_admin", "firm_admin"]), async (req, res) => {
    const user = req.user as any;
    const userId = parseInt(req.params.id);
    const userData = req.body;
    const updatedUser = await storage.updateUser(userId, userData);
    res.json(updatedUser);
  }
  );

  // Organization routes
  app.get(
    "/api/organizations",
    requireRole(["global_admin"]),
    async (req, res) => {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    },
  );

  app.get(
    "/api/organizations/firms",
    requireRole(["home_office", "global_admin"]),
    async (req, res) => {
      const user = req.user as any;
      let firms;

      if (user.role === "home_office") {
        // Get all firms associated with this home office organization
        firms = await storage.getFirmsByHomeOffice(user.organizationId);
      } else {
        // Global admin can see all firms
        firms = await storage.getOrganizationsByType("firm");
      }

      res.json(firms);
    },
  );

  app.post(
    "/api/organizations",
    requireRole(["global_admin", "home_office"]),
    async (req, res) => {
      try {
        const user = req.user as any;
        const orgData = req.body;

        // If home_office user is creating a firm, set parent ID
        if (user.role === "home_office" && orgData.type === "firm") {
          orgData.parentId = user.organizationId;
        }

        const newOrg = await storage.createOrganization(orgData);
        res.status(201).json(newOrg);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  // Client routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    const user = req.user as any;
    let clients;

    if (user.role === "advisor") {
      clients = await storage.getClientsByAdvisor(user.id);
    } else {
      clients = await storage.getClientsByOrganization(user.organizationId);
    }

    res.json(clients);
  });

  app.post(
    "/api/clients",
    requireRole(["advisor", "firm_admin"]),
    async (req, res) => {
      try {
        const user = req.user as any;
        const validatedData = insertClientSchema.parse(req.body);

        // Set organization and advisor ID based on the user
        validatedData.organizationId = user.organizationId;
        if (user.role === "advisor") {
          validatedData.advisorId = user.id;
        }

        const newClient = await storage.createClient(validatedData);
        res.status(201).json(newClient);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  // Data Mapping routes - firm_admin and advisor users can access
  app.get(
    "/api/mappings",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      const user = req.user as any;
      const mappings = await storage.getDataMappings(user.id);
      res.json(mappings);
    },
  );

  app.post(
    "/api/mappings",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      try {
        const user = req.user as any;
        const validatedData = insertDataMappingSchema.parse({
          ...req.body,
          userId: user.id,
        });

        const newMapping = await storage.createDataMapping(validatedData);
        res.status(201).json(newMapping);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  app.delete(
    "/api/mappings/:id",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      const id = parseInt(req.params.id);
      await storage.deleteDataMapping(id);
      res.status(204).send();
    },
  );

  // Analytics routes
  app.get("/api/analytics/advisor-metrics", requireAuth, async (req, res) => {
    const user = req.user as any;
    const firmId = req.query.firmId
      ? parseInt(req.query.firmId as string)
      : null;
    const advisorId = req.query.advisorId
      ? parseInt(req.query.advisorId as string)
      : null;

    try {
      let metrics;

      // Use demo data if demo mode is enabled
      if (isDemoMode) {
        const targetAdvisorId = advisorId || user.id;
        metrics = await getDemoAdvisorMetrics(targetAdvisorId);
      } else {
        // If specific advisor is selected, show their metrics
        if (advisorId) {
          metrics = await storage.getAdvisorMetrics(advisorId);
        }
        // If firm is selected but no specific advisor, aggregate metrics for all advisors in the firm
        else if (firmId) {
          // Get all advisors in the firm
          const advisors = await storage.getAdvisorsByFirm(firmId);

          // Placeholder for aggregated metrics
          let totalAum = 0;
          let totalRevenue = 0;
          let totalClients = 0;
          let totalActivities = 0;
          let assetAllocation = {
            Equities: 0,
            "Fixed Income": 0,
            Alternatives: 0,
            Cash: 0,
          };

          // Sum up metrics for all advisors
          for (const advisor of advisors) {
            const advisorMetrics = await storage.getAdvisorMetrics(advisor.id);
            totalAum += advisorMetrics.totalAum;
            totalRevenue += advisorMetrics.totalRevenue;
            totalClients += advisorMetrics.totalClients;
            totalActivities += advisorMetrics.totalActivities;

            // Add asset allocations
            advisorMetrics.assetAllocation.forEach((asset) => {
              const className = asset.class;
              if (className === "Equities") {
                assetAllocation.Equities += asset.value;
              } else if (className === "Fixed Income") {
                assetAllocation["Fixed Income"] += asset.value;
              } else if (className === "Alternatives") {
                assetAllocation.Alternatives += asset.value;
              } else if (className === "Cash") {
                assetAllocation.Cash += asset.value;
              }
            });
          }

          // Calculate percentages for asset allocation
          const assetAllocationArray = Object.entries(assetAllocation).map(
            ([className, value]) => ({
              class: className,
              value: value,
              percentage: totalAum > 0 ? (value / totalAum) * 100 : 0,
            }),
          );

          metrics = {
            totalAum,
            totalRevenue,
            totalClients,
            totalActivities,
            assetAllocation: assetAllocationArray,
          };
        }
        // Otherwise, show current user's metrics
        else {
          metrics = await storage.getAdvisorMetrics(user.id);
        }
      }

      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: "Could not fetch advisor metrics" });
    }
  });

  app.get(
    "/api/analytics/client-demographics",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const firmId = req.query.firmId
        ? parseInt(req.query.firmId as string)
        : null;
      const advisorId = req.query.advisorId
        ? parseInt(req.query.advisorId as string)
        : null;

      try {
        let demographics;

        // Use demo data if demo mode is enabled
        if (isDemoMode) {
          const targetAdvisorId = advisorId || user.id;
          demographics = await getDemoClientDemographics(targetAdvisorId);
        } else {
          // If specific advisor is selected, show their client demographics
          if (advisorId) {
            demographics = await storage.getClientDemographics(advisorId);
          }
          // Otherwise, show current user's demographics or aggregated firm demographics
          else if (firmId) {
            // Get all advisors in the firm
            const advisors = await storage.getAdvisorsByFirm(firmId);

            // Placeholder for aggregated age groups and state distribution
            const ageGroups: Record<string, number> = {};
            const stateDistribution: Record<string, number> = {};
            let totalClients = 0;

            // Aggregate demographics data
            for (const advisor of advisors) {
              const advisorDemographics = await storage.getClientDemographics(
                advisor.id,
              );

              // Aggregate age groups
              advisorDemographics.ageGroups.forEach((group) => {
                if (!ageGroups[group.range]) {
                  ageGroups[group.range] = 0;
                }
                ageGroups[group.range] += group.count;
                totalClients += group.count;
              });

              // Aggregate state distribution
              advisorDemographics.stateDistribution.forEach((state) => {
                if (!stateDistribution[state.state]) {
                  stateDistribution[state.state] = 0;
                }
                stateDistribution[state.state] += state.count;
              });
            }

            // Format the aggregated data
            const formattedAgeGroups = Object.entries(ageGroups).map(
              ([range, count]) => ({
                range,
                count: count as number,
              }),
            );

            const formattedStateDistribution = Object.entries(
              stateDistribution,
            ).map(([state, count]) => ({
              state,
              count: count as number,
              percentage:
                totalClients > 0 ? ((count as number) / totalClients) * 100 : 0,
            }));

            demographics = {
              ageGroups: formattedAgeGroups,
              stateDistribution: formattedStateDistribution,
            };
          }
          // Show current user's demographics
          else {
            demographics = await storage.getClientDemographics(user.id);
          }
        }

        res.json(demographics);
      } catch (err) {
        res.status(500).json({ error: "Could not fetch client demographics" });
      }
    },
  );

  // --- START: Register new route ---
  app.get("/api/analytics/age-demographics-report", requireAuth, getAgeDemographicsReportHandler);
  // --- END
  // :/} Register new route ---

  // --- START: Register new route for Client Distribution ---
  app.get("/api/analytics/client-distribution-report", requireAuth, getClientDistributionReportHandler);
  // --- END: Register new route ---

app.get("/api/analytics/book-development-report", requireAuth, getBookDevelopmentReportHandler);

// --- START: Register new route for Client Birthday Report ---
app.get("/api/analytics/birthday-report", requireAuth, getClientBirthdayReportHandler);
// --- END: Register new route for Client Birthday Report ---

  // Save WealthBox configuration
  app.get("/api/wealthbox/auth/setup", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const authUrl = `${WEALTHBOX_AUTH_URL}?client_id=${WEALTHBOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(WEALTHBOX_REDIRECT_URI)}&response_type=code&state=${req.user.id}`;
    res.json({ authUrl });
  });

  // Save WealthBox configuration and associated advisor tokens
  app.post("/api/wealthbox/save-config", async (req, res) => {
    try {
      const { accessToken, settings } = req.body;
      const user = req.user as any;
      console.log("Saving Wealthbox configuration for user:", user.id);
      console.log("accessToken:", accessToken);
      console.log("settings:", settings);

      if (!accessToken) {
        return res
          .status(400)
          .json({ success: false, message: "Access token is required" });
      }

      // Test connection before saving
      try {
        const isConnected = await testWealthboxConnectionHandler(req, res);
        console.log("Wealthbox connection status:", isConnected);
        if (!isConnected) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid access token" });
        }
      } catch (error) {
        console.error("Error testing Wealthbox connection:", error);
        if (!res.headersSent) {
          return res
            .status(500)
            .json({
              success: false,
              message: "Failed to test Wealthbox connection",
            });
        }
        return; // Prevent further execution if headers are already sent
      }

      console.log({ user });

      const integrationType =
        await storage.getIntegrationTypeByName("wealthbox");
      console.log("integrationType:", integrationType);

      // Get or create firm integration config
      let firmIntegration = await storage.getFirmIntegrationConfigByFirmId(
        user.organizationId,
      );
      console.log("Existing firm integration:", firmIntegration);
      if (!firmIntegration) {
        firmIntegration = await storage.createFirmIntegrationConfig({
          firmId: user.organizationId,
          integrationTypeId: integrationType?.id,
          credentials: { api_key: accessToken },
          settings: settings || { sync_frequency: "daily" },
          status: "active",
        });
        console.log("New firm integration created:", firmIntegration);
      }

      // Update firm integration config
      const updatedFirmIntegration = await storage.updateFirmIntegrationConfig(
        firmIntegration.id,
        {
          id: firmIntegration.id,
          integrationTypeId: integrationType?.id,
          firmId: user.organizationId,
          credentials: { api_key: accessToken },
          settings: settings || { sync_frequency: "daily" },
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      );
      console.log("Updated firm integration:", updatedFirmIntegration);

      // Get or create advisor auth token
      let advisorAuthToken = await storage.getAdvisorAuthTokenByUserId(
        user.id,
        user.organizationId,
      );
      console.log("Existing advisor auth token:", advisorAuthToken);
      if (!advisorAuthToken) {
        advisorAuthToken = await storage.createAdvisorAuthToken({
          advisorId: user.id,
          accessToken: accessToken,
          expiresAt: new Date(),
          firmIntegrationConfigId: updatedFirmIntegration.id,
          refreshToken: null,
          tokenType: null,
          scope: null,
          additionalData: {},
          integrationType: integrationType.id,
        });
        console.log("New advisor auth token created:", advisorAuthToken);
      }

      // Update advisor auth token
      await storage.updateAdvisorAuthToken(advisorAuthToken.id, {
        id: advisorAuthToken.id,
        createdAt: advisorAuthToken.createdAt,
        updatedAt: new Date(),
        firmIntegrationConfigId: updatedFirmIntegration.id,
        advisorId: user.id,
        accessToken: accessToken,
        refreshToken: advisorAuthToken.refreshToken,
        tokenType: advisorAuthToken.tokenType,
        expiresAt: advisorAuthToken.expiresAt,
        scope: advisorAuthToken.scope,
        additionalData: advisorAuthToken.additionalData,
        integrationType: integrationType.id,
      });
      console.log("Updated advisor auth token:", advisorAuthToken);

      // Push task to fetch Wealthbox users to the queue
      userFetchQueue.push(async () => {
        try {
          // console.log("Fetching Wealthbox users for firm:", user.organizationId);
          // try {
          const { users: wealthboxUsersData, success } = await getWealthboxUsers(user.id);

          if (!success) {
            throw new Error("Failed to fetch Wealthbox users");
          }
          console.log("Wealthbox users response:", wealthboxUsersData);
          // } catch (error) {
          //   console.error("Error fetching Wealthbox users:", error);
          //   throw new Error("Failed to fetch Wealthbox users");
          // }


          const saveUsersPromises = await Promise.all(wealthboxUsersData.map(async (wealthboxUser: any) => {
            const existingUser = await storage.getUserByEmail(wealthboxUser.email);
            if (!existingUser) {
              const userData = {
                // id: wealthboxUser.id,
                firstName: wealthboxUser.name.split(' ')[0],
                lastName: wealthboxUser.name.split(' ')[1] || '',
                email: wealthboxUser.email,
                roleId: '5',
                organizationId: user.organizationId,
                status: "inactive",
                wealthboxUserId: wealthboxUser.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              console.log(`Creating user: ${userData.email}`);
              return await storage.createUser(userData);
            }
            else {
              console.log(`Updating user: ${existingUser.email}`);
              return await storage.updateUser(existingUser.id, {
                wealthboxUserId: wealthboxUser.id,
                firstNmae: wealthboxUser.name.split(' ')[0],
                lastName: wealthboxUser.name.split(' ')[1] || '',
                updatedAt: new Date(),
              });
            }
            return null;
          })).then(results => results.filter(Boolean));
          await Promise.all(saveUsersPromises);
          console.log("Wealthbox users saved successfully.");
        } catch (error) {
          console.error("Error fetching or saving Wealthbox users:", error);
        }
      });

      // Send success response
      return res.json({ success: true, data: updatedFirmIntegration });
    } catch (error: any) {
      console.error("Error saving Wealthbox configuration:", error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to save configuration",
        });
      }
    }
  });

  // async function fetchWealthboxUsers(accessToken: string) {
  //   const wealthboxUsersResponse = await fetch(
  //     `/api/wealthbox/users?access_token=${accessToken}`,
  //   );
  //   if (!wealthboxUsersResponse.ok) {
  //     throw new Error("Failed to fetch Wealthbox users");
  //   }

  //   console.log("Wealthbox users response:", wealthboxUsersResponse);

  //   const wealthboxUsersData = await wealthboxUsersResponse.json();
  //   // Save users to your storage
  //   const saveUsersPromises = wealthboxUsersData.data.users.map(
  //     async (wealthboxUser: any) => {
  //       const userData = {
  //         id: wealthboxUser.id,
  //         name: wealthboxUser.name,
  //         email: wealthboxUser.email,
  //         // Map other properties as necessary
  //       };
  //       return await storage.createUser(userData); // Ensure createUser handles existing users
  //     },
  //   );
  //   await Promise.all(saveUsersPromises);
  //   console.log("Wealthbox users saved successfully.");
  // }

  // AI query route
  app.post("/api/ai/query", requireAuth, aiQueryHandler);

  // Wealthbox integration routes - firm_admin and advisor users can access
  app.post("/api/wealthbox/test-connection", testWealthboxConnectionHandler);
  app.post(
    "/api/wealthbox/import-data",
    requireRole(["firm_admin", "advisor"]),
    importWealthboxDataHandler,
  );
  app.get("/api/wealthbox/token", requireAuth, getWealthboxTokenHandler);
  app.get("/api/data-mappings", requireAuth, getDataMappingsHandler);
  app.post("/api/data-mappings", requireAuth, saveDataMappingsHandler);
  app.get("/api/wealthbox/status", requireAuth, (req, res) => {
    const user = req.user as any;

    // Check if user is authorized to see Wealthbox status
    const isAuthorized = user.role === "firm_admin" || user.role === "advisor";

    // For client admin users, we need to treat them as connected even if they personally don't have tokens
    // This is because they can use WealthBox on behalf of the organization
    const isConnected =
      user.role === "firm_admin" ? true : user?.wealthboxConnected || false;
    const tokenExpiry =
      user.role === "firm_admin"
        ? new Date(Date.now() + 86400000).toISOString()
        : user?.wealthboxTokenExpiry || null;

    res.json({
      connected: isAuthorized && isConnected,
      tokenExpiry: isAuthorized ? tokenExpiry : null,
      authorized: isAuthorized,
    });
  });

  // Orion API Routes
  app.get("/api/orion/status", requireAuth, getOrionStatus);
  app.get("/api/orion/token", requireRole(["firm_admin", "advisor"]), getOrionToken);
  app.get("/api/orion/client/:clientId/aum", requireRole(["firm_admin", "advisor"]), getClientAumOverTime);

  // Wealthbox Opportunities routes - Direct token-based access for dashboard widget
  app.get(
    "/api/wealthbox/opportunities/by-pipeline",
    getOpportunitiesByPipelineHandler,
  );
  app.get("/api/wealthbox/opportunities/by-stage", getOpportunityStagesHandler);

  // Wealthbox Clients by State route for geographic distribution
  app.get("/api/wealthbox/clients/by-state", getActiveClientsByStateHandler);

  // Wealthbox Clients by Age route for age distribution
  app.get("/api/wealthbox/clients/by-age", getActiveClientsByAgeHandler);

  // Wealthbox Users route - Direct token-based access for advisors dropdown
  app.get("/api/wealthbox/users", getWealthboxUsersHandler);

  // Orion integration routes - firm_admin and advisor users can access
app.post("/api/orion/setup-connection", setupOrionConnectionHandler);
app.post("/api/orion/test-connection", testOrionConnectionHandler);
app.get("/api/orion/status", requireAuth, getOrionStatusHandler);
app.post("/api/orion/sync-clients", requireAuth, syncOrionClientsHandler);
app.post("/api/orion/sync-accounts", requireAuth, syncOrionAccountsHandler);
app.post("/api/orion/sync-aum-history", requireAuth, syncOrionAumHistoryHandler);
app.get("/api/orion/aum-time-series", requireAuth, getOrionAumTimeSeriesHandler);
app.get("/api/orion/sync-jobs/:jobId", requireAuth, getOrionSyncJobStatusHandler);
app.get("/api/orion/sync-jobs", requireAuth, getUserOrionSyncJobsHandler);
app.get("/api/orion/aum-chart-data", requireAuth, getOrionAumChartDataHandler);

  // Wealthbox sync routes
  app.post(
    "/api/wealthbox/sync",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      const user = req.user as any;
      const { accessToken } = req.body;

      // Get token from user, request, or default configuration
      let token = accessToken || user.wealthboxToken;

      // If no token available, try to get from configuration
      if (!token) {
        token = await getWealthboxToken(user.id);
        if (!token) {
          return res.status(400).json({
            success: false,
            message: "Wealthbox access token required",
          });
        }
        console.log("Using configured Wealthbox token for sync");
      }

      // Start synchronization
      try {
        const syncResult = await synchronizeWealthboxData(
          token,
          user.id,
          user.organizationId,
        );

        res.json({
          success: true,
          message: "Synchronization completed",
          contacts: syncResult.results.contacts,
          activities: syncResult.results.activities,
          opportunities: syncResult.results.opportunities,
        });
      } catch (error: any) {
        console.error("Error during synchronization:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          success: false,
          message: "Synchronization failed",
          error: errorMessage,
        });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
