import { storage } from "./storage";
import _ from "lodash";
import type {
  AgeDemographicsData,
  AgeBracketDataEntry,
  ClientReportDetail,
  SegmentBreakdown,
  ClientDistributionReportData,
  TopStateSummary,
  StateMetric,
  ClientInStateDetail,
  BookDevelopmentReportData,
  BookDevelopmentSegmentData,
  BookDevelopmentClient,
  YearlySegmentDataPoint,
  BirthdayClient,
  BirthdayReportFilters,
  ClientBirthdayReportData,
  SegmentationKPI,
  SegmentationKpiSet,
  DonutSegmentData,
  SegmentClient,
  ClientSegmentationDashboardData,
  AnniversaryClient,
  ClientAnniversaryData,
  InceptionKPI,
  InceptionChartDataPoint,
  InceptionChartLegendItem,
  InceptionClientDetail,
  ClientInceptionData,
  ReferralClient,
  ReferralSource,
  ReferralAnalyticsData,
  ClientReferralRateData,
  ReferralRateKPI,
  ReferralRateDataPoint,
  AdvisoryFirmDashboardData,
  StaffMember,
  ActivitySummary,
  StaffDetail,
  MonthlyData,
  WeeklyData,
  ActivityBreakdown,
} from "./types";

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

// Generic templates for mocking client segment and AUM
const genericClientDetailsTemplates = [
  {
    segment: "Ultra High Net Worth",
    baseAum: 2000000,
    randomAumRange: 10000000,
  },
  { segment: "High Net Worth", baseAum: 500000, randomAumRange: 1500000 },
  { segment: "Mass Affluent", baseAum: 100000, randomAumRange: 400000 },
  { segment: "Affluent", baseAum: 250000, randomAumRange: 750000 },
  {
    segment: "Emerging High Net Worth",
    baseAum: 750000,
    randomAumRange: 1250000,
  },
];

// Segment colors for Book Development Report
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

/**
 * Generate mock age demographics report data
 */
export const getMockAgeDemographicsReportData = async (
  organizationId: number,
  advisorIds?: number[]
): Promise<AgeDemographicsData> => {
  // get all clients based on age
  const clients = await storage.getClientsByOrganization(organizationId);
  const clientsByAgeGroups = _.groupBy(clients, (client) => {
    const age = client.age;
    if (!age) return "Unknown";
    if (age < 20) return "<20";
    else if (age >= 20 && age <= 40) return "21-40";
    else if (age > 40 && age <= 60) return "41-60";
    else if (age > 60 && age <= 80) return "61-80";
    else return ">80";
  });

  const ageBrackets = ["<20", "21-40", "41-60", "61-80", ">80"];
  let totalClients = 0;
  ageBrackets.forEach((bracket) => {
    totalClients += clientsByAgeGroups[bracket]?.length || 0;
  });

  const byAgeBracketData: AgeBracketDataEntry[] = [
    {
      bracket: "<20",
      clientCount: 0,
      clientPercentage: 0,
      aum: 50000,
      aumPercentage: 0.67,
      detailedBreakdown: [{ segment: "Silver", clients: 1, aum: 50000 }],
    },
    {
      bracket: "21-40",
      clientCount: 0,
      clientPercentage: 0,
      aum: 740000,
      aumPercentage: 10.0,
      detailedBreakdown: [
        { segment: "Silver", clients: 5, aum: 300000 },
        { segment: "Gold", clients: 3, aum: 440000 },
      ],
    },
    {
      bracket: "41-60",
      clientCount: 0,
      clientPercentage: 0,
      aum: 2105000,
      aumPercentage: 28.4,
      detailedBreakdown: [
        { segment: "Silver", clients: 2, aum: 200000 },
        { segment: "Gold", clients: 6, aum: 1205000 },
        { segment: "Platinum", clients: 3, aum: 700000 },
      ],
    },
    {
      bracket: "61-80",
      clientCount: 0,
      clientPercentage: 0,
      aum: 3660000,
      aumPercentage: 49.4,
      detailedBreakdown: [
        { segment: "Gold", clients: 4, aum: 1000000 },
        { segment: "Platinum", clients: 6, aum: 2660000 },
      ],
    },
    {
      bracket: ">80",
      clientCount: 0,
      clientPercentage: 0,
      aum: 850000,
      aumPercentage: 11.5,
      detailedBreakdown: [
        { segment: "Gold", clients: 2, aum: 300000 },
        { segment: "Platinum", clients: 3, aum: 550000 },
      ],
    },
  ];

  const updatedByAgeBracket = byAgeBracketData.map((entry) => {
    const count = clientsByAgeGroups[entry.bracket]?.length || 0;
    const percentage = totalClients > 0 ? (count / totalClients) * 100 : 0;
    const generatedDetailedBreakdown: SegmentBreakdown[] = [];
    const predefinedSegmentTemplates = entry.detailedBreakdown;
    const numSegments = predefinedSegmentTemplates.length;

    if (count > 0 && numSegments > 0) {
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
          aum:
            segmentClientCount > 0
              ? segmentClientCount *
                (40000 + Math.floor(Math.random() * 20000) * 1000)
              : 0,
        });
      });
    } else if (numSegments > 0) {
      predefinedSegmentTemplates.forEach((segmentTemplate) => {
        generatedDetailedBreakdown.push({
          segment: segmentTemplate.segment,
          clients: 0,
          aum: 0,
        });
      });
    }

    return {
      ...entry,
      clientCount: count,
      clientPercentage: parseFloat(percentage.toFixed(1)),
      detailedBreakdown: generatedDetailedBreakdown,
    };
  });

  const averageClientAge = parseFloat(
    (
      clients.reduce((sum, client) => sum + (client.age || 0), 0) /
        totalClients || 0
    ).toFixed(1)
  );

  return {
    overall: {
      totalClients: totalClients,
      totalAUM: 7405000,
      averageClientAge,
    },
    byAgeBracket: updatedByAgeBracket,
    clientDetails: clients.map((client: any, index: number) => {
      const mockDetailsList = [
        { segment: "Gold", joinDate: "2022-02-14", aum: 130000 },
        { segment: "Platinum", joinDate: "2018-07-21", aum: 750000 },
        { segment: "Silver", joinDate: "2023-01-10", aum: 80000 },
        { segment: "Gold", joinDate: "2019-05-05", aum: 220000 },
        { segment: "Platinum", joinDate: "2019-11-30", aum: 1200000 },
        { segment: "Silver", joinDate: "2024-01-15", aum: 50000 },
        { segment: "Silver", joinDate: "2023-08-22", aum: 60000 },
      ];
      const mockEntry = mockDetailsList[index % mockDetailsList.length];

      return {
        id: String(client.id),
        name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        age: client.age || 0,
        segment: mockEntry.segment,
        joinDate: mockEntry.joinDate,
        aum: mockEntry.aum,
      };
    }),
  };
};

/**
 * Generate mock client distribution report data
 */
export const getMockClientDistributionReportData = async (
  organizationId: number
): Promise<ClientDistributionReportData> => {
  const clients = await storage.getClientsByOrganization(organizationId);

  const clientsByState = _.groupBy(clients, (client) => {
    return (
      (client.contactInfo as any)?.address?.state?.toUpperCase() || "Unknown"
    );
  });

  console.log("clientsByState", clientsByState);

  const stateMetrics: StateMetric[] = [];
  const clientDetailsByStateProcessed: {
    [stateCode: string]: ClientInStateDetail[];
  } = {};

  let topStateByClientsSummary: TopStateSummary = {
    stateName: "N/A",
    value: 0,
    metricLabel: "clients",
  };
  let topStateByAUMSummary: TopStateSummary = {
    stateName: "N/A",
    value: "$0",
    metricLabel: "AUM",
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

    clientDetailsByStateProcessed[stateCode] = actualClientsInState.map(
      (client, index) => {
        const template =
          genericClientDetailsTemplates[
            index % genericClientDetailsTemplates.length
          ];
        const clientAum = Math.floor(
          template.baseAum + Math.random() * template.randomAumRange
        );
        currentTotalAumForState += clientAum;
        return {
          id: String(client.id),
          name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
          segment: template.segment,
          aum: clientAum,
        };
      }
    );

    stateMetrics.push({
      stateCode: stateCode,
      stateName: stateName,
      clientCount: clientCount,
      totalAum: currentTotalAumForState,
    });

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
};

/**
 * Generate mock book development report data
 */
export const getMockBookDevelopmentReportData = async (
  organizationId: number
): Promise<BookDevelopmentReportData> => {
  const clients = await storage.getClientsByOrganization(organizationId);

  const clientsBySegment = _.groupBy(clients, (client) => {
    const clientId = client.id;
    if (clientId % 3 === 0) return "Platinum";
    if (clientId % 3 === 1) return "Gold";
    return "Silver";
  });

  console.log("clientsBySegment", clientsBySegment);

  const generateYearlyData = (
    baseClients: any[],
    startValue: number,
    growthRate: number,
    isAUM: boolean
  ): YearlySegmentDataPoint[] => {
    let currentVal = startValue;
    let prevVal: number | undefined = undefined;
    const data: YearlySegmentDataPoint[] = [];

    for (let year = 2019; year <= 2025; year++) {
      const point: YearlySegmentDataPoint = {
        year,
        value: Math.round(currentVal),
        previousYearValue:
          prevVal !== undefined ? Math.round(prevVal) : undefined,
      };
      data.push(point);
      prevVal = currentVal;

      const clientsJoinedThisYear = baseClients.filter((client) => {
        const joinYear = new Date(client.createdAt).getFullYear();
        return joinYear === year;
      }).length;

      const baseGrowth =
        Math.random() * growthRate * (isAUM ? 1 : 0.5) + (isAUM ? 0.02 : 0.01);
      const clientInfluencedGrowth = clientsJoinedThisYear * 0.01;

      currentVal *= 1 + baseGrowth + clientInfluencedGrowth;

      if (isAUM && currentVal < 1000000)
        currentVal = 1000000 * (1 + Math.random() * 0.1);
      else if (!isAUM && currentVal < 5)
        currentVal = 5 * (1 + Math.random() * 0.1);
    }
    return data;
  };

  const formatClientsForSegment = (
    clients: any[],
    segment: "Platinum" | "Gold" | "Silver"
  ): BookDevelopmentClient[] => {
    return clients.map((client, index) => {
      const yearsWithFirm = Math.max(
        1,
        new Date().getFullYear() - new Date(client.createdAt).getFullYear()
      );
      const joinDate = new Date(client.createdAt);
      const sinceDateText = `Since ${joinDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`;

      const baseAUM =
        segment === "Platinum"
          ? 30000000
          : segment === "Gold"
          ? 10000000
          : 5000000;
      const mockAUM = baseAUM + Math.random() * baseAUM * 0.5;

      return {
        id: String(client.id),
        name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        segment,
        yearsWithFirm,
        yearsWithFirmText: `${yearsWithFirm} year${
          yearsWithFirm !== 1 ? "s" : ""
        }`,
        sinceDateText,
        aum: Math.round(mockAUM),
      };
    });
  };

  const allSegmentsData: BookDevelopmentSegmentData[] = [
    {
      name: "Platinum",
      color: SEGMENT_COLORS.Platinum.base,
      fillColor: SEGMENT_COLORS.Platinum.base,
      dataAUM: generateYearlyData(
        clientsBySegment.Platinum || [],
        70000000,
        0.08,
        true
      ),
      dataClientCount: generateYearlyData(
        clientsBySegment.Platinum || [],
        10,
        0.05,
        false
      ),
      clients: formatClientsForSegment(
        clientsBySegment.Platinum || [],
        "Platinum"
      ),
    },
    {
      name: "Gold",
      color: SEGMENT_COLORS.Gold.base,
      fillColor: SEGMENT_COLORS.Gold.base,
      dataAUM: generateYearlyData(
        clientsBySegment.Gold || [],
        40000000,
        0.06,
        true
      ),
      dataClientCount: generateYearlyData(
        clientsBySegment.Gold || [],
        25,
        0.04,
        false
      ),
      clients: formatClientsForSegment(clientsBySegment.Gold || [], "Gold"),
    },
    {
      name: "Silver",
      color: SEGMENT_COLORS.Silver.base,
      fillColor: SEGMENT_COLORS.Silver.base,
      dataAUM: generateYearlyData(
        clientsBySegment.Silver || [],
        20000000,
        0.05,
        true
      ),
      dataClientCount: generateYearlyData(
        clientsBySegment.Silver || [],
        40,
        0.03,
        false
      ),
      clients: formatClientsForSegment(clientsBySegment.Silver || [], "Silver"),
    },
  ];

  return { allSegmentsData };
};

/**
 * Generate mock client referral rate data
 */
export const getMockClientReferralRateData = async (
  organizationId: number
): Promise<ClientReferralRateData> => {
  const mockChartData: ReferralRateDataPoint[] = [
    {
      month: "Jan 2024",
      shortMonth: "Jan",
      referralRate: 27,
      referredClients: 8,
      totalNewClients: 30,
    },
    {
      month: "Feb 2024",
      shortMonth: "Feb",
      referralRate: 42,
      referredClients: 12,
      totalNewClients: 29,
    },
    {
      month: "Mar 2024",
      shortMonth: "Mar",
      referralRate: 55,
      referredClients: 16,
      totalNewClients: 29,
    },
    {
      month: "Apr 2024",
      shortMonth: "Apr",
      referralRate: 42,
      referredClients: 11,
      totalNewClients: 26,
    },
    {
      month: "May 2024",
      shortMonth: "May",
      referralRate: 57,
      referredClients: 17,
      totalNewClients: 30,
    },
    {
      month: "Jun 2024",
      shortMonth: "Jun",
      referralRate: 59,
      referredClients: 19,
      totalNewClients: 32,
    },
    {
      month: "Jul 2024",
      shortMonth: "Jul",
      referralRate: 64,
      referredClients: 18,
      totalNewClients: 28,
    },
    {
      month: "Aug 2024",
      shortMonth: "Aug",
      referralRate: 62.1,
      referredClients: 18,
      totalNewClients: 29,
    },
    {
      month: "Sep 2024",
      shortMonth: "Sep",
      referralRate: 68,
      referredClients: 20,
      totalNewClients: 29,
    },
    {
      month: "Oct 2024",
      shortMonth: "Oct",
      referralRate: 72,
      referredClients: 23,
      totalNewClients: 32,
    },
    {
      month: "Nov 2024",
      shortMonth: "Nov",
      referralRate: 76,
      referredClients: 25,
      totalNewClients: 33,
    },
    {
      month: "Dec 2024",
      shortMonth: "Dec",
      referralRate: 83.6,
      referredClients: 27,
      totalNewClients: 32,
    },
  ];

  const latestMonth = mockChartData[mockChartData.length - 1];
  const previousMonth = mockChartData[mockChartData.length - 2];

  const currentRate = latestMonth.referralRate;
  const rateChange = currentRate - previousMonth.referralRate;
  const newClientsThisMonth = latestMonth.totalNewClients;
  const referredClientsThisMonth = latestMonth.referredClients;

  return {
    kpi: {
      currentRate,
      rateChange: Math.round(rateChange * 10) / 10,
      newClientsThisMonth,
      referredClientsThisMonth,
    },
    chartData: mockChartData,
  };
};

/**
 * Generate mock advisory firm dashboard data
 */
export const getMockAdvisoryFirmDashboardData = async (
  organizationId: number
): Promise<AdvisoryFirmDashboardData> => {
  const mockData: AdvisoryFirmDashboardData = {
    totalActivities: 1247,
    clientMeetings: 89,
    tasksCompleted: 342,
    notesCreated: 278,
    messagesSent: 523,
    topPerformers: [
      {
        id: "sj",
        initials: "SJ",
        name: "Sarah Johnson",
        totalActivities: 189,
        meetings: 24,
        emails: 87,
        tasks: 45,
      },
      {
        id: "mc",
        initials: "MC",
        name: "Michael Chen",
        totalActivities: 167,
        meetings: 19,
        emails: 92,
        tasks: 38,
        isHighlighted: true,
      },
      {
        id: "er",
        initials: "ER",
        name: "Emily Rodriguez",
        totalActivities: 154,
        meetings: 22,
        emails: 76,
        tasks: 41,
      },
      {
        id: "dk",
        initials: "DK",
        name: "David Kim",
        totalActivities: 142,
        meetings: 18,
        emails: 69,
        tasks: 39,
      },
      {
        id: "lt",
        initials: "LT",
        name: "Lisa Thompson",
        totalActivities: 138,
        meetings: 16,
        emails: 71,
        tasks: 35,
      },
    ],
    needsAttention: [
      {
        id: "rw",
        initials: "RW",
        name: "Robert Wilson",
        totalActivities: 67,
        meetings: 8,
        emails: 34,
        tasks: 18,
      },
      {
        id: "jd",
        initials: "JD",
        name: "Jennifer Davis",
        totalActivities: 54,
        meetings: 6,
        emails: 28,
        tasks: 15,
        isHighlighted: true,
      },
      {
        id: "ma",
        initials: "MA",
        name: "Mark Anderson",
        totalActivities: 42,
        meetings: 5,
        emails: 22,
        tasks: 12,
      },
    ],
    monthlyData: [
      { month: "Jan 2024", shortMonth: "Jan", totalActivities: 1200 },
      { month: "Feb 2024", shortMonth: "Feb", totalActivities: 1350 },
      { month: "Mar 2024", shortMonth: "Mar", totalActivities: 1450 },
      { month: "Apr 2024", shortMonth: "Apr", totalActivities: 1800 },
      { month: "May 2024", shortMonth: "May", totalActivities: 1950 },
      { month: "Jun 2024", shortMonth: "Jun", totalActivities: 1850 },
      { month: "Jul 2024", shortMonth: "Jul", totalActivities: 2100 },
      { month: "Aug 2024", shortMonth: "Aug", totalActivities: 2000 },
      { month: "Sep 2024", shortMonth: "Sep", totalActivities: 2300 },
      { month: "Oct 2024", shortMonth: "Oct", totalActivities: 2045 },
      { month: "Nov 2024", shortMonth: "Nov", totalActivities: 2200 },
      { month: "Dec 2024", shortMonth: "Dec", totalActivities: 1800 },
    ],
    weeklyData: [
      { day: "Mon", meetings: 15, notes: 12, workflows: 7 },
      { day: "Tue", meetings: 18, notes: 15, workflows: 9 },
      { day: "Wed", meetings: 15, notes: 20, workflows: 10 },
      { day: "Thu", meetings: 12, notes: 18, workflows: 8 },
      { day: "Fri", meetings: 10, notes: 14, workflows: 6 },
    ],
    activityBreakdown: [
      { name: "Meetings", value: 67, color: "#3B82F6" },
      { name: "Calls", value: 43, color: "#10B981" },
      { name: "Emails", value: 156, color: "#F59E0B" },
      { name: "Tasks Completed", value: 198, color: "#8B5CF6" },
      { name: "Notes Added", value: 89, color: "#EF4444" },
      { name: "Workflows Initiated", value: 34, color: "#06B6D4" },
      { name: "SMS Messages", value: 67, color: "#84CC16" },
    ],
    staffDetails: [
      {
        id: "jd",
        name: "Jennifer Davis",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 1,
            qtd: 3,
            ytd: 10,
            ttm: 11,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 4,
            qtd: 13,
            ytd: 50,
            ttm: 59,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 3,
            qtd: 9,
            ytd: 36,
            ttm: 42,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 3,
            qtd: 8,
            ytd: 32,
            ttm: 37,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 9,
            qtd: 27,
            ytd: 108,
            ttm: 126,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 2,
            qtd: 6,
            ytd: 24,
            ttm: 28,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 5,
            qtd: 15,
            ytd: 60,
            ttm: 70,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 3,
            qtd: 9,
            ytd: 36,
            ttm: 42,
            trend: "up",
          },
        ],
      },
      {
        id: "mc",
        name: "Michael Chen",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 8,
            qtd: 25,
            ytd: 102,
            ttm: 110,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 13,
            qtd: 39,
            ytd: 156,
            ttm: 184,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 31,
            qtd: 92,
            ytd: 369,
            ttm: 430,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 21,
            qtd: 63,
            ytd: 254,
            ttm: 288,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 28,
            qtd: 84,
            ytd: 334,
            ttm: 390,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 9,
            qtd: 27,
            ytd: 107,
            ttm: 122,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 20,
            qtd: 60,
            ytd: 240,
            ttm: 273,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 13,
            qtd: 40,
            ytd: 160,
            ttm: 184,
            trend: "up",
          },
        ],
      },
      {
        id: "sj",
        name: "Sarah Johnson",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 8,
            qtd: 24,
            ytd: 96,
            ttm: 108,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 12,
            qtd: 36,
            ytd: 144,
            ttm: 168,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 29,
            qtd: 87,
            ytd: 348,
            ttm: 402,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 15,
            qtd: 45,
            ytd: 180,
            ttm: 210,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 18,
            qtd: 54,
            ytd: 216,
            ttm: 252,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 6,
            qtd: 18,
            ytd: 72,
            ttm: 84,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 14,
            qtd: 42,
            ytd: 168,
            ttm: 196,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 9,
            qtd: 27,
            ytd: 108,
            ttm: 126,
            trend: "up",
          },
        ],
      },
      {
        id: "er",
        name: "Emily Rodriguez",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 7,
            qtd: 22,
            ytd: 88,
            ttm: 99,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 10,
            qtd: 30,
            ytd: 120,
            ttm: 140,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 25,
            qtd: 76,
            ytd: 304,
            ttm: 352,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 14,
            qtd: 41,
            ytd: 164,
            ttm: 188,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 16,
            qtd: 48,
            ytd: 192,
            ttm: 224,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 5,
            qtd: 15,
            ytd: 60,
            ttm: 70,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 12,
            qtd: 36,
            ytd: 144,
            ttm: 168,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 8,
            qtd: 24,
            ytd: 96,
            ttm: 112,
            trend: "up",
          },
        ],
      },
      {
        id: "dk",
        name: "David Kim",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 6,
            qtd: 18,
            ytd: 72,
            ttm: 81,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 9,
            qtd: 27,
            ytd: 108,
            ttm: 126,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 23,
            qtd: 69,
            ytd: 276,
            ttm: 318,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 13,
            qtd: 39,
            ytd: 156,
            ttm: 180,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 15,
            qtd: 45,
            ytd: 180,
            ttm: 210,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 4,
            qtd: 12,
            ytd: 48,
            ttm: 56,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 10,
            qtd: 30,
            ytd: 120,
            ttm: 140,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 7,
            qtd: 21,
            ytd: 84,
            ttm: 98,
            trend: "up",
          },
        ],
      },
      {
        id: "lt",
        name: "Lisa Thompson",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 5,
            qtd: 16,
            ytd: 64,
            ttm: 72,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 8,
            qtd: 24,
            ytd: 96,
            ttm: 112,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 24,
            qtd: 71,
            ytd: 284,
            ttm: 328,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 12,
            qtd: 35,
            ytd: 140,
            ttm: 161,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 14,
            qtd: 42,
            ytd: 168,
            ttm: 196,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 4,
            qtd: 11,
            ytd: 44,
            ttm: 51,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 9,
            qtd: 27,
            ytd: 108,
            ttm: 126,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 6,
            qtd: 18,
            ytd: 72,
            ttm: 84,
            trend: "up",
          },
        ],
      },
      {
        id: "rw",
        name: "Robert Wilson",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 3,
            qtd: 8,
            ytd: 32,
            ttm: 36,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 5,
            qtd: 15,
            ytd: 60,
            ttm: 70,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 11,
            qtd: 34,
            ytd: 136,
            ttm: 157,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 6,
            qtd: 18,
            ytd: 72,
            ttm: 83,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 8,
            qtd: 24,
            ytd: 96,
            ttm: 112,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 2,
            qtd: 6,
            ytd: 24,
            ttm: 28,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 4,
            qtd: 12,
            ytd: 48,
            ttm: 56,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 3,
            qtd: 9,
            ytd: 36,
            ttm: 42,
            trend: "up",
          },
        ],
      },
      {
        id: "ma",
        name: "Mark Anderson",
        activities: [
          {
            activityType: "Client Meetings",
            mtd: 2,
            qtd: 5,
            ytd: 20,
            ttm: 23,
            trend: "up",
          },
          {
            activityType: "Prospect Calls",
            mtd: 3,
            qtd: 9,
            ytd: 36,
            ttm: 42,
            trend: "up",
          },
          {
            activityType: "Follow-up Emails",
            mtd: 7,
            qtd: 22,
            ytd: 88,
            ttm: 102,
            trend: "neutral",
          },
          {
            activityType: "Tasks Completed",
            mtd: 4,
            qtd: 12,
            ytd: 48,
            ttm: 55,
            trend: "up",
          },
          {
            activityType: "Notes Added",
            mtd: 5,
            qtd: 15,
            ytd: 60,
            ttm: 70,
            trend: "down",
          },
          {
            activityType: "Workflows Initiated",
            mtd: 1,
            qtd: 3,
            ytd: 12,
            ttm: 14,
            trend: "up",
          },
          {
            activityType: "SMS Messages",
            mtd: 3,
            qtd: 9,
            ytd: 36,
            ttm: 42,
            trend: "neutral",
          },
          {
            activityType: "Documents Created",
            mtd: 2,
            qtd: 6,
            ytd: 24,
            ttm: 28,
            trend: "up",
          },
        ],
      },
    ],
  };

  return mockData;
};

/**
 * Generate mock client birthday report data
 */
export const getMockClientBirthdayReportData = async (
  organizationId: number
): Promise<{ clients: BirthdayClient[]; filters: BirthdayReportFilters }> => {
  // Mock data based on the provided image
  // Current date for reference: May 28, 2025
  const mockClients: BirthdayClient[] = [
    {
      id: "1",
      clientName: "Mary Clark",
      grade: "Platinum",
      dateOfBirth: "1960-05-30",
      nextBirthdayDisplay: "In 5 days (May 30)", // Image says "In 5 days", actual is 2 days from May 28
      nextBirthdayDate: "2025-05-30",
      turningAge: 65,
      aum: 2850000,
      clientTenure: "14 years",
      advisorName: "Sarah Peters",
      daysUntilNextBirthday: 2, // Calculated for May 28, 2025 to May 30, 2025
    },
    {
      id: "2",
      clientName: "David Miller",
      grade: "Platinum",
      dateOfBirth: "1968-06-05",
      nextBirthdayDisplay: "In 11 days (Jun 5)", // Image says "In 11 days", actual is 8 days
      nextBirthdayDate: "2025-06-05",
      turningAge: 57,
      aum: 4100000,
      clientTenure: "18 years",
      advisorName: "Sarah Peters",
      daysUntilNextBirthday: 8, // Calculated for May 28, 2025 to June 5, 2025
    },
    {
      id: "3",
      clientName: "Michael Davis",
      grade: "Gold",
      dateOfBirth: "1962-06-12",
      nextBirthdayDisplay: "In 18 days (Jun 12)", // Image says "In 18 days", actual is 15 days
      nextBirthdayDate: "2025-06-12",
      turningAge: 63,
      aum: 1200000,
      clientTenure: "10 years",
      advisorName: "Michael Rodriguez",
      daysUntilNextBirthday: 15, // Calculated
    },
    {
      id: "4",
      clientName: "Jennifer Wilson",
      grade: "Silver",
      dateOfBirth: "1975-06-20",
      nextBirthdayDisplay: "In 26 days (Jun 20)", // Image says "In 26 days", actual is 23 days
      nextBirthdayDate: "2025-06-20",
      turningAge: 50,
      aum: 380000,
      clientTenure: "5 years",
      advisorName: "David Thompson",
      daysUntilNextBirthday: 23, // Calculated
    },
    {
      id: "5",
      clientName: "Lisa Anderson",
      grade: "Gold",
      dateOfBirth: "1973-07-18",
      nextBirthdayDisplay: "In 54 days (Jul 18)", // Image says "In 54 days", actual is 51 days
      nextBirthdayDate: "2025-07-18",
      turningAge: 52,
      aum: 875000,
      clientTenure: "7 years",
      advisorName: "Michael Rodriguez",
      daysUntilNextBirthday: 51, // Calculated
    },
    {
      id: "6",
      clientName: "Thomas Taylor",
      grade: "Silver",
      dateOfBirth: "1970-07-25",
      nextBirthdayDisplay: "In 61 days (Jul 25)", // Image says "In 61 days", actual is 58 days
      nextBirthdayDate: "2025-07-25",
      turningAge: 55,
      aum: 320000,
      clientTenure: "4 years",
      advisorName: "David Thompson",
      daysUntilNextBirthday: 58, // Calculated
    },
    {
      id: "7",
      clientName: "Emily Brown",
      grade: "Silver",
      dateOfBirth: "1980-05-05",
      nextBirthdayDisplay: "In 345 days (May 5)", // Image says "In 345 days", actual is 342 days
      nextBirthdayDate: "2026-05-05", // Birthday has passed for 2025
      turningAge: 46,
      aum: 450000,
      clientTenure: "3 years",
      advisorName: "David Thompson",
      daysUntilNextBirthday: 342, // Calculated
    },
    {
      id: "8",
      clientName: "Robert Williams",
      grade: "Platinum",
      dateOfBirth: "1958-05-10",
      nextBirthdayDisplay: "In 350 days (May 10)", // Image says "In 350 days", actual is 347 days
      nextBirthdayDate: "2026-05-10", // Birthday has passed for 2025
      turningAge: 68,
      aum: 3200000,
      clientTenure: "15 years",
      advisorName: "Sarah Peters",
      daysUntilNextBirthday: 347, // Calculated
    },
  ];

  // Prepare filter options for frontend dropdowns based on the mock data
  const uniqueGrades = ["Platinum", "Gold", "Silver"].sort();
  const uniqueAdvisors = [
    "Sarah Peters",
    "Michael Rodriguez",
    "David Thompson",
  ].sort();

  return {
    clients: mockClients,
    filters: {
      grades: uniqueGrades,
      advisors: uniqueAdvisors,
    },
  };
};

/**
 * Generate mock client segmentation dashboard data
 */
export const getMockClientSegmentationDashboardData = async (
  organizationId: number,
  selectedSegment: string = "Platinum"
): Promise<ClientSegmentationDashboardData> => {
  // Mock data for all segments
  const allClientsMock = {
    Platinum: [
      {
        id: "c1",
        name: "Thomas Wright",
        age: 51,
        yearsWithFirm: 5,
        assets: 1250000,
      },
      {
        id: "c2",
        name: "Emma Davis",
        age: 45,
        yearsWithFirm: 5,
        assets: 1675000,
      },
      {
        id: "c3",
        name: "Alexander Mitchell",
        age: 49,
        yearsWithFirm: 5,
        assets: 2100000,
      },
      {
        id: "c4",
        name: "Sophia Garcia",
        age: 75,
        yearsWithFirm: 5,
        assets: 1800000,
      },
      {
        id: "c5",
        name: "Mia Scott",
        age: 46,
        yearsWithFirm: 4,
        assets: 1540000,
      },
      {
        id: "c6",
        name: "Jacob Green",
        age: 32,
        yearsWithFirm: 4,
        assets: 1350000,
      },
      {
        id: "c7",
        name: "Elizabeth Baker",
        age: 50,
        yearsWithFirm: 4,
        assets: 1850000,
      },
      // Add more to reach 37 total for Platinum
      {
        id: "c8",
        name: "Michael Johnson",
        age: 42,
        yearsWithFirm: 6,
        assets: 1900000,
      },
      {
        id: "c9",
        name: "Sarah Wilson",
        age: 58,
        yearsWithFirm: 8,
        assets: 2200000,
      },
      {
        id: "c10",
        name: "David Brown",
        age: 55,
        yearsWithFirm: 7,
        assets: 1750000,
      },
    ],
    Gold: [
      {
        id: "g1",
        name: "Jennifer Taylor",
        age: 41,
        yearsWithFirm: 3,
        assets: 850000,
      },
      {
        id: "g2",
        name: "Robert Miller",
        age: 52,
        yearsWithFirm: 4,
        assets: 920000,
      },
      {
        id: "g3",
        name: "Lisa Anderson",
        age: 48,
        yearsWithFirm: 6,
        assets: 780000,
      },
      {
        id: "g4",
        name: "Mark Thompson",
        age: 39,
        yearsWithFirm: 2,
        assets: 950000,
      },
      {
        id: "g5",
        name: "Amanda Clark",
        age: 44,
        yearsWithFirm: 5,
        assets: 820000,
      },
      {
        id: "g6",
        name: "Kevin Martinez",
        age: 50,
        yearsWithFirm: 7,
        assets: 890000,
      },
      {
        id: "g7",
        name: "Rachel Davis",
        age: 37,
        yearsWithFirm: 3,
        assets: 760000,
      },
    ],
    Silver: [
      {
        id: "s1",
        name: "Christopher Lee",
        age: 33,
        yearsWithFirm: 2,
        assets: 420000,
      },
      {
        id: "s2",
        name: "Michelle Rodriguez",
        age: 38,
        yearsWithFirm: 3,
        assets: 380000,
      },
      {
        id: "s3",
        name: "Daniel White",
        age: 45,
        yearsWithFirm: 4,
        assets: 450000,
      },
      {
        id: "s4",
        name: "Laura Harris",
        age: 29,
        yearsWithFirm: 1,
        assets: 320000,
      },
      {
        id: "s5",
        name: "James Wilson",
        age: 42,
        yearsWithFirm: 5,
        assets: 480000,
      },
      {
        id: "s6",
        name: "Karen Thompson",
        age: 36,
        yearsWithFirm: 2,
        assets: 350000,
      },
      {
        id: "s7",
        name: "Paul Anderson",
        age: 40,
        yearsWithFirm: 3,
        assets: 390000,
      },
    ],
  };

  const advisorOptions = [
    { id: "firm_overview", name: "Firm Overview" },
    { id: "john_smith_id", name: "John Smith" },
    { id: "sarah_johnson_id", name: "Sarah Johnson" },
    { id: "michael_chen_id", name: "Michael Chen" },
  ];

  // Calculate segment totals
  const segmentCounts = {
    Platinum: 37, // Full count
    Gold: 48,
    Silver: 30,
  };

  const segmentTotals = {
    Platinum:
      allClientsMock.Platinum.reduce((sum, client) => sum + client.assets, 0) *
      (37 / 10), // Scale up
    Gold:
      allClientsMock.Gold.reduce((sum, client) => sum + client.assets, 0) *
      (48 / 7),
    Silver:
      allClientsMock.Silver.reduce((sum, client) => sum + client.assets, 0) *
      (30 / 7),
  };

  const totalClients =
    segmentCounts.Platinum + segmentCounts.Gold + segmentCounts.Silver;

  // Get current segment data
  const currentSegmentClients =
    allClientsMock[selectedSegment as keyof typeof allClientsMock] ||
    allClientsMock.Platinum;
  const currentSegmentCount =
    segmentCounts[selectedSegment as keyof typeof segmentCounts] ||
    segmentCounts.Platinum;
  const currentSegmentTotal =
    segmentTotals[selectedSegment as keyof typeof segmentTotals] ||
    segmentTotals.Platinum;
  const currentSegmentAverage = currentSegmentTotal / currentSegmentCount;

  return {
    kpis: {
      clientCount: {
        value: currentSegmentCount,
        label: `Number of ${selectedSegment} clients`,
      },
      totalAUM: {
        value: `$${Math.round(currentSegmentTotal).toLocaleString()}`,
        label: `Total assets for ${selectedSegment} segment`,
      },
      averageClientAUM: {
        value: `$${Math.round(currentSegmentAverage).toLocaleString()}`,
        label: `Average for ${selectedSegment} segment`,
      },
      currentSegmentFocus: selectedSegment,
    },
    donutChartData: [
      {
        name: "Platinum",
        count: segmentCounts.Platinum,
        percentage:
          Math.round((segmentCounts.Platinum / totalClients) * 100 * 10) / 10,
        color: "hsl(222, 47%, 44%)",
      },
      {
        name: "Gold",
        count: segmentCounts.Gold,
        percentage:
          Math.round((segmentCounts.Gold / totalClients) * 100 * 10) / 10,
        color: "hsl(216, 65%, 58%)",
      },
      {
        name: "Silver",
        count: segmentCounts.Silver,
        percentage:
          Math.round((segmentCounts.Silver / totalClients) * 100 * 10) / 10,
        color: "hsl(210, 55%, 78%)",
      },
    ],
    tableData: {
      segmentName: selectedSegment,
      clients: currentSegmentClients,
    },
    advisorOptions,
    currentAdvisorOrFirmView: "Firm Overview",
  };
};

/**
 * Generate mock client anniversary data
 */
export const getMockClientAnniversaryData = async (
  organizationId: number
): Promise<ClientAnniversaryData> => {
  // Mock data generation
  const allAnniversaryClients: AnniversaryClient[] = [
    {
      id: "a1",
      clientName: "Alexander Hamilton",
      segment: "Platinum",
      originalStartDate: "2021-06-01",
      nextAnniversaryDate: "Jun 1, 2025",
      daysUntilNextAnniversary: 1,
      yearsWithFirm: 4,
      advisorName: "Jessica Williams",
    },
    {
      id: "a2",
      clientName: "Steven Adams",
      segment: "Silver",
      originalStartDate: "2020-06-07",
      nextAnniversaryDate: "Jun 7, 2025",
      daysUntilNextAnniversary: 7,
      yearsWithFirm: 5,
      advisorName: "Sarah Johnson",
    },
    {
      id: "a3",
      clientName: "Carol Phillips",
      segment: "Silver",
      originalStartDate: "2023-06-11",
      nextAnniversaryDate: "Jun 11, 2025",
      daysUntilNextAnniversary: 11,
      yearsWithFirm: 2,
      advisorName: "Robert Chen",
    },
    {
      id: "a4",
      clientName: "Mamie Eisenhower",
      segment: "Silver",
      originalStartDate: "2016-06-14",
      nextAnniversaryDate: "Jun 14, 2025",
      daysUntilNextAnniversary: 14,
      yearsWithFirm: 9,
      advisorName: "Robert Chen",
    },
    {
      id: "a5",
      clientName: "Barbara Martin",
      segment: "Gold",
      originalStartDate: "2018-06-17",
      nextAnniversaryDate: "Jun 17, 2025",
      daysUntilNextAnniversary: 17,
      yearsWithFirm: 7,
      advisorName: "Michael Clark",
    },
    {
      id: "a6",
      clientName: "Gerald Ford",
      segment: "Silver",
      originalStartDate: "2022-07-06",
      nextAnniversaryDate: "Jul 6, 2025",
      daysUntilNextAnniversary: 36,
      yearsWithFirm: 3,
      advisorName: "Sarah Johnson",
    },
    {
      id: "a7",
      clientName: "Abigail Adams",
      segment: "Platinum",
      originalStartDate: "2013-07-11",
      nextAnniversaryDate: "Jul 11, 2025",
      daysUntilNextAnniversary: 41,
      yearsWithFirm: 12,
      advisorName: "Michael Clark",
    },
    {
      id: "a8",
      clientName: "Edward Nelson",
      segment: "Silver",
      originalStartDate: "2021-07-13",
      nextAnniversaryDate: "Jul 13, 2025",
      daysUntilNextAnniversary: 43,
      yearsWithFirm: 4,
      advisorName: "Jessica Williams",
    },
    {
      id: "a9",
      clientName: "John Adams",
      segment: "Platinum",
      originalStartDate: "2019-08-15",
      nextAnniversaryDate: "Aug 15, 2025",
      daysUntilNextAnniversary: 76,
      yearsWithFirm: 10,
      advisorName: "Sarah Johnson",
    },
    {
      id: "a10",
      clientName: "Martha Washington",
      segment: "Gold",
      originalStartDate: "2019-09-20",
      nextAnniversaryDate: "Sep 20, 2025",
      daysUntilNextAnniversary: 112,
      yearsWithFirm: 6,
      advisorName: "Michael Clark",
    },
  ];

  return {
    clients: allAnniversaryClients,
    totalRecords: allAnniversaryClients.length,
    filterOptions: {
      segments: ["All Segments", "Platinum", "Gold", "Silver"],
      tenures: ["Any Tenure", "1-5 years", "5-10 years", "10+ years"],
      advisors: [
        { id: "all", name: "All Advisors" },
        { id: "sj", name: "Sarah Johnson" },
        { id: "mc", name: "Michael Clark" },
        { id: "rc", name: "Robert Chen" },
        { id: "jw", name: "Jessica Williams" },
      ],
    },
  };
};

/**
 * Generate mock client inception data
 */
export const getMockClientInceptionData = async (
  organizationId: number,
  currentYear: number = 2024
): Promise<ClientInceptionData> => {
  // Mock KPI data
  const mockKpi: InceptionKPI = {
    ytdNewClients: 183,
    percentageChangeVsPreviousYear: 18,
  };

  // Mock chart data
  const mockChartData: InceptionChartDataPoint[] = [
    { year: "2018", Platinum: 12, Gold: 28, Silver: 35, Total: 75 },
    { year: "2019", Platinum: 15, Gold: 30, Silver: 40, Total: 85 },
    { year: "2020", Platinum: 18, Gold: 35, Silver: 42, Total: 95 },
    { year: "2021", Platinum: 25, Gold: 40, Silver: 50, Total: 115 },
    { year: "2022", Platinum: 30, Gold: 45, Silver: 55, Total: 130 },
    { year: "2023", Platinum: 40, Gold: 50, Silver: 65, Total: 155 },
    { year: "2024", Platinum: 48, Gold: 63, Silver: 72, Total: 183 },
    { year: "2025", Platinum: 50, Gold: 68, Silver: 77, Total: 195 },
  ];

  const legendDataForSelectedYear = mockChartData.find(
    (d) => d.year === String(currentYear)
  );
  const mockChartLegend: InceptionChartLegendItem[] = legendDataForSelectedYear
    ? [
        { segment: "Platinum", count: legendDataForSelectedYear.Platinum },
        { segment: "Gold", count: legendDataForSelectedYear.Gold },
        { segment: "Silver", count: legendDataForSelectedYear.Silver },
        { segment: "Total", count: legendDataForSelectedYear.Total },
      ]
    : [];

  // Mock table data
  const allMockTableClients: InceptionClientDetail[] = [
    {
      id: "tc1",
      name: "Amanda Richardson",
      email: "amanda.r@example.com",
      segment: "Platinum",
      inceptionDate: "2024-01-10",
    },
    {
      id: "tc2",
      name: "Brian Foster",
      email: "brian.f@example.com",
      segment: "Gold",
      inceptionDate: "2024-02-15",
    },
    {
      id: "tc3",
      name: "Catherine Lopez",
      email: "catherine.l@example.com",
      segment: "Silver",
      inceptionDate: "2024-03-20",
    },
    {
      id: "tc4",
      name: "Daniel Kim",
      email: "daniel.k@example.com",
      segment: "Platinum",
      inceptionDate: "2024-04-05",
    },
    {
      id: "tc5",
      name: "Elena Rodriguez",
      email: "elena.r@example.com",
      segment: "Gold",
      inceptionDate: "2024-05-12",
    },
    {
      id: "tc6",
      name: "Frank Thompson",
      email: "frank.t@example.com",
      segment: "Silver",
      inceptionDate: "2024-06-18",
    },
    {
      id: "tc7",
      name: "Grace Chen",
      email: "grace.c@example.com",
      segment: "Platinum",
      inceptionDate: "2024-07-22",
    },
    {
      id: "tc8",
      name: "Henry Williams",
      email: "henry.w@example.com",
      segment: "Gold",
      inceptionDate: "2024-08-30",
    },
  ];

  const filteredTableClients = allMockTableClients.filter(
    (c) => new Date(c.inceptionDate).getFullYear() === currentYear
  );

  return {
    kpi: mockKpi,
    chartData: mockChartData,
    chartLegend: mockChartLegend,
    tableClients: filteredTableClients,
    totalTableRecords: filteredTableClients.length,
    availableYears: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    currentYear: currentYear,
  };
};

/**
 * Generate mock referral analytics data
 */
export const getMockReferralAnalyticsData = async (
  organizationId: number
): Promise<ReferralAnalyticsData> => {
  // Mock referral sources data - FIXED to match the UI
  const mockReferralSources: ReferralSource[] = [
    {
      id: "js",
      name: "John Smith",
      company: "Smith Financial",
      totalReferrals: 42,
      percentage: 19,
      totalAUM: 15500000,
      clients: [
        {
          id: "c1",
          clientName: "Harry King",
          segment: "Platinum",
          referredBy: "John Smith",
          aum: 3000000,
          referralDate: "2022-12-28",
        },
        {
          id: "c2",
          clientName: "Karen Miller",
          segment: "Platinum",
          referredBy: "John Smith",
          aum: 3500000,
          referralDate: "2022-12-26",
        },
        {
          id: "c3",
          clientName: "Jack Taylor",
          segment: "Gold",
          referredBy: "John Smith",
          aum: 1600000,
          referralDate: "2022-12-23",
        },
        {
          id: "c4",
          clientName: "Steve Davis",
          segment: "Gold",
          referredBy: "John Smith",
          aum: 1700000,
          referralDate: "2022-12-22",
        },
        {
          id: "c5",
          clientName: "Rachel White",
          segment: "Silver",
          referredBy: "John Smith",
          aum: 550000,
          referralDate: "2022-12-19",
        },
        {
          id: "c6",
          clientName: "Quinn Miller",
          segment: "Gold",
          referredBy: "John Smith",
          aum: 1300000,
          referralDate: "2022-12-16",
        },
      ],
    },
    {
      id: "sj",
      name: "Sarah Johnson",
      company: "Johnson Wealth Management",
      totalReferrals: 38,
      percentage: 17,
      totalAUM: 12200000,
      clients: [
        {
          id: "c7",
          clientName: "Gina Hill",
          segment: "Silver",
          referredBy: "Sarah Johnson",
          aum: 680000,
          referralDate: "2022-12-25",
        },
        {
          id: "c8",
          clientName: "Emily White",
          segment: "Platinum",
          referredBy: "Sarah Johnson",
          aum: 3300000,
          referralDate: "2022-12-19",
        },
        {
          id: "c9",
          clientName: "Nick Baker",
          segment: "Platinum",
          referredBy: "Sarah Johnson",
          aum: 3150000,
          referralDate: "2022-12-18",
        },
        {
          id: "c10",
          clientName: "Felix Green",
          segment: "Gold",
          referredBy: "Sarah Johnson",
          aum: 1250000,
          referralDate: "2022-12-22",
        },
      ],
    },
    {
      id: "mc",
      name: "Michael Chen",
      company: "Chen Advisory Group",
      totalReferrals: 36,
      percentage: 16,
      totalAUM: 11800000,
      clients: [
        {
          id: "c11",
          clientName: "Alice Johnson",
          segment: "Platinum",
          referredBy: "Michael Chen",
          aum: 2500000,
          referralDate: "2022-12-15",
        },
        {
          id: "c12",
          clientName: "Bob Williams",
          segment: "Gold",
          referredBy: "Michael Chen",
          aum: 1200000,
          referralDate: "2022-12-14",
        },
        {
          id: "c13",
          clientName: "Carol Davis",
          segment: "Silver",
          referredBy: "Michael Chen",
          aum: 750000,
          referralDate: "2022-12-13",
        },
        {
          id: "c14",
          clientName: "David Martinez",
          segment: "Platinum",
          referredBy: "Michael Chen",
          aum: 3100000,
          referralDate: "2022-12-12",
        },
        {
          id: "c15",
          clientName: "Eva Wilson",
          segment: "Gold",
          referredBy: "Michael Chen",
          aum: 1500000,
          referralDate: "2022-12-11",
        },
        {
          id: "c16",
          clientName: "Frank Anderson",
          segment: "Silver",
          referredBy: "Michael Chen",
          aum: 600000,
          referralDate: "2022-12-10",
        },
      ],
    },
    {
      id: "od",
      name: "Olivia Davis",
      company: "Davis Financial Services",
      totalReferrals: 27,
      percentage: 12,
      totalAUM: 9500000,
      clients: [
        {
          id: "c17",
          clientName: "Grace Lee",
          segment: "Platinum",
          referredBy: "Olivia Davis",
          aum: 4200000,
          referralDate: "2022-12-09",
        },
        {
          id: "c18",
          clientName: "Henry Brown",
          segment: "Gold",
          referredBy: "Olivia Davis",
          aum: 1800000,
          referralDate: "2022-12-08",
        },
        {
          id: "c19",
          clientName: "Ivy Chen",
          segment: "Silver",
          referredBy: "Olivia Davis",
          aum: 900000,
          referralDate: "2022-12-07",
        },
      ],
    },
    {
      id: "rw",
      name: "Robert Williams",
      company: "Williams Investment Group",
      totalReferrals: 24,
      percentage: 11,
      totalAUM: 8200000,
      clients: [
        {
          id: "c20",
          clientName: "Mark Thompson",
          segment: "Platinum",
          referredBy: "Robert Williams",
          aum: 2900000,
          referralDate: "2022-12-06",
        },
        {
          id: "c21",
          clientName: "Nancy Garcia",
          segment: "Gold",
          referredBy: "Robert Williams",
          aum: 1600000,
          referralDate: "2022-12-05",
        },
        {
          id: "c22",
          clientName: "Oliver Rodriguez",
          segment: "Silver",
          referredBy: "Robert Williams",
          aum: 800000,
          referralDate: "2022-12-04",
        },
      ],
    },
    {
      id: "ew",
      name: "Emma Wilson",
      company: "Wilson Capital",
      totalReferrals: 22,
      percentage: 10,
      totalAUM: 7500000,
      clients: [],
    },
    {
      id: "jt",
      name: "James Taylor",
      company: "Taylor Industries",
      totalReferrals: 12,
      percentage: 5,
      totalAUM: 4200000,
      clients: [],
    },
    {
      id: "ab",
      name: "Alexandra Brown",
      company: "Brown & Associates",
      totalReferrals: 10,
      percentage: 4,
      totalAUM: 3500000,
      clients: [],
    },
    {
      id: "dm",
      name: "David Miller",
      company: "Miller Consulting",
      totalReferrals: 9,
      percentage: 4,
      totalAUM: 3100000,
      clients: [],
    },
    {
      id: "cl",
      name: "Christopher Lee",
      company: "Lee Financial",
      totalReferrals: 7,
      percentage: 3,
      totalAUM: 2400000,
      clients: [],
    },
  ];

  // Extract all clients from referral sources
  const allReferrals: ReferralClient[] = mockReferralSources.flatMap(
    (source) => source.clients
  );

  return {
    totalReferrals: 227,
    allReferrals: allReferrals,
    referralSources: mockReferralSources,
    filterOptions: {
      referrers: [
        { id: "all", name: "All Referrers" },
        { id: "js", name: "John Smith" },
        { id: "sj", name: "Sarah Johnson" },
        { id: "mc", name: "Michael Chen" },
        { id: "od", name: "Olivia Davis" },
        { id: "rw", name: "Robert Williams" },
        { id: "ew", name: "Emma Wilson" },
        { id: "jt", name: "James Taylor" },
        { id: "ab", name: "Alexandra Brown" },
        { id: "dm", name: "David Miller" },
        { id: "cl", name: "Christopher Lee" },
      ],
    },
  };
};
