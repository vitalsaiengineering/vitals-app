export interface AgeGroup {
  name: string;
  range: string;
  count: number;
  percentage: number;
  colorClass: string;
}

// --- START: Added for Firm Activity Dashboard ---
export interface StaffMember {
  id: string;
  initials: string;
  name: string;
  totalActivities: number;
  meetings: number;
  emails: number;
  tasks: number;
  isHighlighted?: boolean;
}

export interface ActivitySummary {
  activityType: string;
  mtd: number;
  qtd: number;
  ytd: number;
  ttm: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface StaffDetail {
  id: string;
  name: string;
  activities: ActivitySummary[];
}

export interface MonthlyData {
  month: string;
  shortMonth: string;
  totalActivities: number;
}

export interface WeeklyData {
  day: string;
  meetings: number;
  calls: number;
  emails: number;
  tasks: number;
  notes: number;
  workflows: number;
}

export interface ActivityBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface AdvisoryFirmDashboardData {
  totalActivities: number;
  clientMeetings: number;
  tasksCompleted: number;
  notesCreated: number;
  messagesSent: number;
  topPerformers: StaffMember[];
  needsAttention: StaffMember[];
  monthlyData: MonthlyData[];
  weeklyData: WeeklyData[];
  activityBreakdown: ActivityBreakdown[];
  staffDetails: StaffDetail[];
}

export interface GetAdvisoryFirmDashboardParams {
  advisorId?: number;
  startDate?: string;
  endDate?: string;
  department?: string;
}

/**
 * Fetches firm activity dashboard data from the API
 * @param params Optional parameters including advisorId, date range, and department
 * @returns Promise with the firm activity dashboard data
 */
export async function getAdvisoryFirmDashboardData(params?: GetAdvisoryFirmDashboardParams): Promise<AdvisoryFirmDashboardData> {
  try {
    const data = await dataService.fetchData("analytics/firm-activity-dashboard", params);
    return data as AdvisoryFirmDashboardData;
  } catch (error) {
    console.error("Error fetching firm activity dashboard data:", error);
    throw error;
  }
}
// --- END: Added for Firm Activity Dashboard ---

// Data service for API calls
export const dataService = {
  fetchData: async (
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => {
    // Build query string from params
    const queryString = params
      ? "?" +
        Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`,
          )
          .join("&")
      : "";

    const response = await fetch(`/api/${endpoint}${queryString}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  postData: async (endpoint: string, data: any) => {
    const response = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    return response.json();
  },
};

// --- START: Added for Age Demographics Report ---
export interface SegmentBreakdown {
  segment: string;
  clients: number;
  aum: number;
}

export interface AgeBracketDataEntry { // Renamed from AgeBracketData to avoid conflict if used elsewhere
  bracket: string;
  clientCount: number;
  clientPercentage: number;
  aum: number;
  aumPercentage: number;
  detailedBreakdown: SegmentBreakdown[];
}

export interface ClientReportDetail { // Renamed from ClientDetail to avoid conflict
  id: string;
  name: string;
  age: number;
  segment: string;
  joinDate: string;
  aum: number;
}

export interface AgeDemographicsData {
  overall: {
    totalClients: number;
    totalAUM: number;
    averageClientAge: number;
  };
  byAgeBracket: AgeBracketDataEntry[];
  clientDetails: ClientReportDetail[];
}

/**
 * Fetches the age demographics report data from the API.
 * @param advisorId Optional ID of the advisor/user
 * @returns Promise with the age demographics data
 */
export async function getAgeDemographicsReportData(advisorId?: number): Promise<AgeDemographicsData> {
  try {
    const params: Record<string, string | number | undefined> = {};
    if (advisorId !== undefined) {
      params.advisorId = advisorId;
    }
    const data = await dataService.fetchData(
      "analytics/age-demographics-report",
      params,
    );
    return data as AgeDemographicsData; // Ensure the fetched data conforms to the interface
  } catch (error) {
    console.error("Error fetching age demographics report data:", error);
    // Consider returning a default structure or re-throwing
    // For now, re-throwing to let the caller handle it.
    throw error;
  }
}
// --- END: Added for Age Demographics Report ---


/**
 * Get the average age of all clients for a specific advisor
 * @param advisorId The ID of the advisor/user
 * @returns Promise with the average age of clients
 */
export async function getAverageAge(advisorId?: number): Promise<number> {
  try {
    // Get client demographics from the API
    const demographics = await dataService.fetchData(
      "analytics/client-demographics",
      {
        advisorId: advisorId,
      },
    );

    // Calculate average age from age groups if available
    if (demographics?.ageGroups?.length) {
      let totalClients = 0;
      let weightedSum = 0;

      demographics.ageGroups.forEach((group: any) => {
        // Use midpoint of range for calculation
        const rangeParts = group.range.split("-");
        let midpoint;

        if (rangeParts.length === 2) {
          midpoint = (parseInt(rangeParts[0]) + parseInt(rangeParts[1])) / 2;
        } else if (group.range.includes("+")) {
          // For ranges like "76+"
          midpoint = parseInt(group.range.replace("+", "")) + 10;
        } else if (group.range.includes("Under")) {
          // For ranges like "Under 30"
          midpoint = parseInt(group.range.replace("Under ", "")) / 2;
        } else {
          midpoint = parseInt(group.range);
        }

        weightedSum += midpoint * group.count;
        totalClients += group.count;
      });

      return totalClients > 0 ? Math.round(weightedSum / totalClients) : 0;
    }

    // If we can't calculate from demographics, try the by-age endpoint
    const ageData = await dataService.fetchData("wealthbox/clients/by-age", {
      advisorId: advisorId,
    });

    if (ageData && Array.isArray(ageData)) {
      // Calculate average from the by-age distribution
      let totalClients = 0;
      let weightedSum = 0;

      ageData.forEach((ageGroup: any) => {
        if (ageGroup.age && ageGroup.count) {
          weightedSum += ageGroup.age * ageGroup.count;
          totalClients += ageGroup.count;
        }
      });

      return totalClients > 0 ? Math.round(weightedSum / totalClients) : 0;
    }

    return 0;
  } catch (error) {
    console.error("Error fetching average age:", error);
    return 0;
  }
}

/**
 * Get age groups for client demographics visualization
 * @param advisorId Optional advisor ID to filter clients
 * @returns Array of age groups with counts and percentages
 */
export function getAgeGroups(): AgeGroup[] {
  // Static demo data
  const ageGroups: AgeGroup[] = [
    {
      name: "Under 30",
      range: "0-29",
      count: 42,
      percentage: 14,
      colorClass: "bg-[var(--ageBand-1)]",
    },
    {
      name: "30-45",
      range: "30-45",
      count: 78,
      percentage: 26,
      colorClass: "bg-[var(--ageBand-2)]",
    },
    {
      name: "46-60",
      range: "46-60",
      count: 96,
      percentage: 32,
      colorClass: "bg-[var(--ageBand-3)]",
    },
    {
      name: "61-75",
      range: "61-75",
      count: 63,
      percentage: 21,
      colorClass: "bg-[var(--ageBand-4)]",
    },
    {
      name: "Over 75",
      range: "76+",
      count: 21,
      percentage: 7,
      colorClass: "bg-[var(--ageBand-5)]",
    },
  ];

  return ageGroups;
}

// --- START: Added for Book Development Report ---
export interface BookDevelopmentClient {
  id: string;
  name: string;
  segment: 'Platinum' | 'Gold' | 'Silver';
  yearsWithFirm: number;
  yearsWithFirmText: string;
  sinceDateText: string;
  aum: number;
  advisor: string;
}

export interface YearlySegmentDataPoint {
  year: number;
  value: number;
  previousYearValue?: number;
}

export interface BookDevelopmentSegmentData {
  name: 'Platinum' | 'Gold' | 'Silver';
  color: string;
  fillColor?: string;
  dataAUM: YearlySegmentDataPoint[];
  dataClientCount: YearlySegmentDataPoint[];
  clients: BookDevelopmentClient[];
}

export interface BookDevelopmentReportData {
  allSegmentsData: BookDevelopmentSegmentData[];
}

/**
 * Fetches the book development report data from the API.
 * @returns Promise with the book development data
 */
export async function getBookDevelopmentReportData(): Promise<BookDevelopmentReportData> {
  try {
    const data = await dataService.fetchData("analytics/book-development-report");
    return data as BookDevelopmentReportData;
  } catch (error) {
    console.error("Error fetching book development report data:", error);
    throw error;
  }
}
// --- END: Added for Book Development Report ---

// Interface for individual client details within a state (as used in ClientStateDistributionMap)
export interface ClientDetail {
  name: string;
  netWorthCategory: string; // e.g., 'High Net Worth', 'Mass Affluent'
  assets: number;
}

// Interface for aggregated state data (ensure it matches USChoroplethMap and ClientStateDistributionMap usage)
export interface StateClientData {
  stateName: string;
  stateCode: string;
  totalAssets: number;
  clientCount: number;
  averageAge: number;
  averageAssetsPerClient: number;
  clients: ClientDetail[]; // Add the list of clients
}

// --- Helper Functions for Data Generation ---

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (
  min: number,
  max: number,
  decimals: number = 0,
): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
};

const generateRandomName = (): string => {
  const firstNames = [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Jamie",
    "Skyler",
    "Riley",
    "Peyton",
    "Dakota",
    "Avery",
    "Cameron",
    "Drew",
    "Kai",
    "Remi",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
  ];
  return `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
};

const getNetWorthCategory = (assets: number): string => {
  if (assets >= 1000000) return "High Net Worth";
  if (assets >= 250000) return "Mass Affluent";
  return "Emerging Affluent";
};

// --- Data Generation ---

// ... existing code ...

const states = [
  // ... state list remains the same ...
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const largeStates = [
  "CA",
  "TX",
  "FL",
  "NY",
  "PA",
  "IL",
  "OH",
  "GA",
  "NC",
  "MI",
];
const wealthyStates = [
  "DC",
  "MD",
  "NJ",
  "MA",
  "HI",
  "CA",
  "WA",
  "CO",
  "CT",
  "VA",
  "NY",
]; // Higher avg assets

const allStatesData: StateClientData[] = states.map((state) => {
  // Base values
  let baseClientCount = randomInt(5, 800);
  // *** Adjusted base average assets range to be lower ***
  let baseAvgAssets = randomInt(50000, 750000); // Lowered upper bound from 1M
  let baseAvgAge = randomInt(48, 62);

  // Adjust for large population states
  if (largeStates.includes(state.code)) {
    baseClientCount = randomInt(500, 5000);
  }

  // Adjust for wealthy states
  if (wealthyStates.includes(state.code)) {
    // *** Adjusted wealthy state average assets range significantly lower ***
    baseAvgAssets = randomInt(300000, 1200000); // Lowered range from 400k-2.5M
    baseAvgAge = randomInt(52, 68);
  }

  // Add some more random variance
  const clientCount = Math.max(
    5,
    baseClientCount +
      randomInt(
        -Math.floor(baseClientCount * 0.2),
        Math.floor(baseClientCount * 0.3),
      ),
  );
  // *** Ensure average assets don't dip too low after variance ***
  const averageAssetsPerClient = Math.max(
    40000,
    baseAvgAssets +
      randomInt(
        -Math.floor(baseAvgAssets * 0.3),
        Math.floor(baseAvgAssets * 0.4),
      ),
  );
  // Total assets will now be lower due to lower averageAssetsPerClient
  const totalAssets = clientCount * averageAssetsPerClient;
  const averageAge = baseAvgAge + randomInt(-3, 3);

  // Generate sample clients for the detail list
  const clients: ClientDetail[] = [];
  const numSampleClients = Math.min(clientCount, randomInt(3, 7));
  for (let i = 0; i < numSampleClients; i++) {
    // Generate client assets somewhat centered around the state average, but with variance
    // *** Ensure individual client assets don't go below a minimum ***
    const clientAssets = Math.max(
      10000,
      averageAssetsPerClient +
        randomInt(
          -Math.floor(averageAssetsPerClient * 0.7),
          Math.floor(averageAssetsPerClient * 1.5),
        ),
    );
    clients.push({
      name: generateRandomName(),
      assets: clientAssets,
      netWorthCategory: getNetWorthCategory(clientAssets),
    });
  }

  return {
    stateName: state.name,
    stateCode: state.code,
    clientCount: clientCount,
    totalAssets: totalAssets,
    averageAssetsPerClient: averageAssetsPerClient,
    averageAge: averageAge,
    clients: clients,
  };
});

/**
 * Simulates fetching client distribution data by state.
 * In a real app, this would fetch from an API endpoint.
 * @param advisorId Optional advisor ID (currently unused in dummy data)
 * @returns Promise resolving to an array of StateClientData
 */
export const getClientDistributionByState = async (
  advisorId?: number,
): Promise<StateClientData[]> => {
  // ... function body remains the same ...
  console.log(
    `Simulating fetch for client distribution by state (Advisor ID: ${advisorId})`,
  );
  await new Promise((resolve) => setTimeout(resolve, 400));
  return allStatesData;
};

// ... rest of your clientData.ts file ...

// ... rest of your clientData.ts file (getAverageAge, getAgeGroups, etc.) ...

/**
 * Simulates fetching client demographic data from an API.
 */
export const fetchClientDemographicsData = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Dummy data based on the image with realistic fictional names
  const dummyClients = [
    // 41-60 Group (11 clients)
    {
      id: 1,
      name: "Harper Lee",
      age: 42,
      segment: "Gold",
      joinDate: "2022-02-14",
    },
    {
      id: 2,
      name: "Indigo Brown",
      age: 45,
      segment: "Silver",
      joinDate: "2021-12-30",
    },
    {
      id: 3,
      name: "Charles Smith",
      age: 55,
      segment: "Bronze",
      joinDate: "2023-01-10",
    },
    {
      id: 4,
      name: "Diana Evans",
      age: 48,
      segment: "Gold",
      joinDate: "2022-05-20",
    },
    {
      id: 5,
      name: "Ethan Garcia",
      age: 59,
      segment: "Silver",
      joinDate: "2021-11-15",
    },
    {
      id: 6,
      name: "Fiona Miller",
      age: 41,
      segment: "Gold",
      joinDate: "2023-03-01",
    },
    {
      id: 7,
      name: "George Davis",
      age: 52,
      segment: "Bronze",
      joinDate: "2022-08-08",
    },
    {
      id: 8,
      name: "Hannah Rodriguez",
      age: 60,
      segment: "Silver",
      joinDate: "2021-09-25",
    },
    {
      id: 9,
      name: "Ian Wilson",
      age: 49,
      segment: "Gold",
      joinDate: "2023-04-12",
    },
    {
      id: 10,
      name: "Julia Martinez",
      age: 57,
      segment: "Bronze",
      joinDate: "2022-10-30",
    },
    {
      id: 11,
      name: "Kevin Anderson",
      age: 46,
      segment: "Silver",
      joinDate: "2021-07-05",
    },

    // < 20 Group (2 clients)
    {
      id: 12,
      name: "Liam Thomas",
      age: 18,
      segment: "Bronze",
      joinDate: "2023-06-01",
    },
    {
      id: 13,
      name: "Mia Jackson",
      age: 19,
      segment: "Silver",
      joinDate: "2023-07-15",
    },

    // 21-40 Group (8 clients)
    {
      id: 14,
      name: "Noah White",
      age: 25,
      segment: "Gold",
      joinDate: "2022-01-20",
    },
    {
      id: 15,
      name: "Olivia Harris",
      age: 30,
      segment: "Silver",
      joinDate: "2021-12-01",
    },
    {
      id: 16,
      name: "Peter Martin",
      age: 35,
      segment: "Bronze",
      joinDate: "2023-02-10",
    },
    {
      id: 17,
      name: "Quinn Thompson",
      age: 22,
      segment: "Gold",
      joinDate: "2022-04-15",
    },
    {
      id: 18,
      name: "Rachel Garcia",
      age: 38,
      segment: "Silver",
      joinDate: "2021-10-05",
    },
    {
      id: 19,
      name: "Samuel Martinez",
      age: 29,
      segment: "Bronze",
      joinDate: "2023-05-25",
    },
    {
      id: 20,
      name: "Tara Robinson",
      age: 33,
      segment: "Gold",
      joinDate: "2022-09-18",
    },
    {
      id: 21,
      name: "Uma Clark",
      age: 27,
      segment: "Silver",
      joinDate: "2021-08-30",
    },

    // 61-80 Group (10 clients)
    {
      id: 22,
      name: "Victor Rodriguez",
      age: 65,
      segment: "Gold",
      joinDate: "2022-03-10",
    },
    {
      id: 23,
      name: "Wendy Lewis",
      age: 70,
      segment: "Silver",
      joinDate: "2021-11-20",
    },
    {
      id: 24,
      name: "Xavier Lee",
      age: 75,
      segment: "Bronze",
      joinDate: "2023-01-05",
    },
    {
      id: 25,
      name: "Yara Walker",
      age: 62,
      segment: "Gold",
      joinDate: "2022-06-12",
    },
    {
      id: 26,
      name: "Zane Hall",
      age: 78,
      segment: "Silver",
      joinDate: "2021-09-10",
    },
    {
      id: 27,
      name: "Alice Allen",
      age: 68,
      segment: "Bronze",
      joinDate: "2023-04-01",
    },
    {
      id: 28,
      name: "Bob Young",
      age: 72,
      segment: "Gold",
      joinDate: "2022-11-05",
    },
    {
      id: 29,
      name: "Catherine Hernandez",
      age: 61,
      segment: "Silver",
      joinDate: "2021-07-20",
    },
    {
      id: 30,
      name: "David King",
      age: 79,
      segment: "Bronze",
      joinDate: "2023-08-15",
    },
    {
      id: 31,
      name: "Eleanor Wright",
      age: 63,
      segment: "Gold",
      joinDate: "2022-12-25",
    },

    // > 80 Group (4 clients)
    {
      id: 32,
      name: "Frank Lopez",
      age: 85,
      segment: "Silver",
      joinDate: "2021-06-10",
    },
    {
      id: 33,
      name: "Grace Hill",
      age: 90,
      segment: "Bronze",
      joinDate: "2023-03-20",
    },
    {
      id: 34,
      name: "Henry Scott",
      age: 81,
      segment: "Gold",
      joinDate: "2022-07-14",
    },
    {
      id: 35,
      name: "Isla Green",
      age: 95,
      segment: "Silver",
      joinDate: "2021-10-28",
    },
  ];

  // Simulate potential API error
  // if (Math.random() > 0.8) {
  //   throw new Error("Failed to fetch client data.");
  // }

  return dummyClients;
};

export interface Client {
  id: string;
  name: string;
  company: string;
  segment: "Gold" | "Platinum" | "Silver" | "Bronze"; // Example segments
  referredById: string;
}

export interface Referrer {
  id: string;
  name: string;
  referrals: number;
  color: string; // For chart segments
}

export interface ReferralData {
  referrers: Referrer[];
  clients: Client[];
}


// Generate random dates
const getRandomDate = () => {
  const start = new Date(2022, 0, 1); // Start date Jan 1, 2022
  const end = new Date(); // Today
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Generate random AUM
const getRandomAum = (min = 200000, max = 15000000) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Get random segment
const segments: ("Gold" | "Platinum" | "Silver" | "Bronze")[] = [
  "Gold",
  "Platinum",
  "Silver",
  "Bronze",
];
const getRandomSegment = () =>
  segments[Math.floor(Math.random() * segments.length)];

// Generate somewhat unique names and companies
const firstNames = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Henry",
  "Ivy",
  "Jack",
  "Karen",
  "Leo",
  "Mia",
  "Noah",
  "Olivia",
  "Paul",
  "Quinn",
  "Rachel",
  "Steve",
  "Tina",
  "Victor",
  "Wendy",
  "Xavier",
  "Yara",
  "Zane",
  "Aaron",
  "Brenda",
  "Carl",
  "Derek",
  "Elaine",
  "Fiona",
  "George",
  "Harry",
  "Irene",
  "Jeffrey",
  "Katherine",
  "Leonard",
  "Mary",
  "Nathan",
  "Ophelia",
  "Peter",
  "Rose",
  "Samuel",
  "Tara",
  "Ulysses",
  "Violet",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Martin",
  "Jackson",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Green",
  "Baker",
  "Adams",
  "Nelson",
  "Hill",
  "Campbell",
  "Mitchell",
  "Roberts",
  "Carter",
  "Phillips",
  "Evans",
  "Turner",
  "Torres",
];
const companyPrefixes = [
  "Stellar",
  "Quantum",
  "Insight",
  "Peak",
  "Cascade",
  "Vertex",
  "Horizon",
  "Apex",
  "Elevate",
  "Summit",
  "Prism",
  "Nexus",
  "Fusion",
  "Clarity",
  "Avant",
  "Beacon",
  "Momentum",
  "Synergy",
  "Pulse",
  "Echo",
  "Dynamic",
  "Pinnacle",
  "Catalyst",
  "Nebula",
  "Galaxy",
  "Cosmos",
  "Vandelay",
  "Pendant",
  "Covert",
  "Oscorp",
  "Broadway",
  "Planet",
  "Wayne",
];
const companySuffixes = [
  "Corp",
  "Holdings",
  "Media",
  "Solutions",
  "Systems",
  "Inc",
  "Tech",
  "Innovations",
  "Group",
  "Partners",
  "Ventures",
  "Analytics",
  "Enterprises",
  "Digital",
  "Labs",
  "Industries",
  "Publishing",
  "Ops",
  "Global",
  "Services",
  "Consulting",
  "Logistics",
  "Dynamics",
];

let clientIdCounter = 1;

const generateClient = (referrerId: string): any => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const companyPrefix =
    companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const companySuffix =
    companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  return {
    id: `c${clientIdCounter++}`,
    name: `${firstName} ${lastName}`,
    company: `${companyPrefix} ${companySuffix}`,
    segment: getRandomSegment(),
    referredById: referrerId,
    aum: getRandomAum(),
    referralDate: getRandomDate(),
  };
};

// --- Mock Data Generation ---

const referrersList = [
  { id: "r1", name: "John Smith", referrals: 0, color: "#4285F4" }, // Blue
  { id: "r2", name: "Sarah Johnson", referrals: 0, color: "#DB4437" }, // Red
  { id: "r3", name: "Michael Chen", referrals: 0, color: "#F4B400" }, // Yellow
  { id: "r4", name: "Olivia Davis", referrals: 0, color: "#0F9D58" }, // Green
  { id: "r5", name: "Robert Williams", referrals: 0, color: "#AB47BC" }, // Purple
  { id: "r6", name: "Emma Wilson", referrals: 0, color: "#FF7043" }, // Orange
  { id: "r7", name: "James Taylor", referrals: 0, color: "#EF5350" }, // Light Red
  { id: "r8", name: "David Miller", referrals: 0, color: "#5C6BC0" }, // Indigo
  { id: "r9", name: "Alexandra Brown", referrals: 0, color: "#26A69A" }, // Teal
  { id: "r10", name: "Christopher Lee", referrals: 0, color: "#FFCA28" }, // Amber
];

const allClients: any[] = [];

// Generate clients for each referrer
referrersList.forEach((referrer) => {
  // Generate a random number of clients per referrer (e.g., between 15 and 40)
  const numClients = Math.floor(Math.random() * (40 - 15 + 1) + 15);
  for (let i = 0; i < numClients; i++) {
    allClients.push(generateClient(referrer.id));
  }
});

// Update referrer counts based on the generated clients
referrersList.forEach((referrer: { id: string; referrals: number }) => {
  referrer.referrals = allClients.filter(
    (client: { referredById: string }) => client.referredById === referrer.id,
  ).length;
});

// Sort the final client list by date
allClients.sort(
  (a, b) =>
    new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime(),
);

export const mockReferralData: any = {
  referrers: referrersList,
  clients: allClients,
};
// Simulate an API fetching function
export const getReferralData = async (): Promise<any> => {
  console.log("Fetching referral data...");
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));
  console.log("Referral data fetched.");
  // In a real app, you'd fetch from an API endpoint
  // Recalculate referrer counts based on actual client data for consistency
  const clientCounts = mockReferralData.clients.reduce(
    (acc, client) => {
      acc[client.referredById] = (acc[client.referredById] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const updatedReferrers = mockReferralData.referrers
    .map((r) => ({
      ...r,
      referrals: clientCounts[r.id] || 0,
    }))
    .sort((a, b) => b.referrals - a.referrals); // Sort referrers by count

  console.log(
    "Updated Referrer Counts:",
    updatedReferrers.map((r) => ({ name: r.name, count: r.referrals })),
  );

  return { ...mockReferralData, referrers: updatedReferrers };
};

// --- START: Added for Client Distribution by State Report ---
export interface TopStateSummary {
  stateName: string;
  value: number | string; // Could be client count or formatted AUM string
  metricLabel: 'clients' | 'AUM';
}

export interface StateMetric {
  stateCode: string; // e.g., "TX", "CA", "FL"
  stateName: string;
  clientCount: number;
  totalAum: number;
  // For map coloring, we might add normalized values later
  clientDensityValue?: number; // Placeholder for map coloring logic
  totalAssetsValue?: number;  // Placeholder for map coloring logic
}

export interface ClientInStateDetail {
  id: string;
  name: string;
  segment: 'Ultra High Net Worth' | 'High Net Worth' | 'Mass Affluent' | string; // Allow for other segments
  aum: number;
  // joinDate?: string; // Optional, if needed
}

export interface ClientDistributionReportData {
  topStateByClients: TopStateSummary;
  topStateByAUM: TopStateSummary;
  stateMetrics: StateMetric[]; // Data for each state for map coloring and selection
  // Storing client details keyed by state for easier lookup after a state is selected
  clientDetailsByState: { [stateCode: string]: ClientInStateDetail[] };
}

// filepath: /home/runner/workspace/client/src/lib/clientData.ts
// ... existing code ...
// --- END: Added for Client Distribution by State Report ---

// --- START: Added for Client Birthday Report ---
export interface BirthdayClient {
  id: string;
  clientName: string;
  grade: string;
  dateOfBirth: string;
  nextBirthdayDisplay: string;
  nextBirthdayDate: string;
  turningAge: number;
  aum: number;
  clientTenure: string;
  advisorName: string;
}

export interface BirthdayReportFilters {
  grades: string[];
  advisors: string[];
}

export interface ClientBirthdayReportData {
  clients: BirthdayClient[];
  filters: BirthdayReportFilters;
}

export interface GetClientBirthdayReportParams {
  nameSearch?: string;
  grade?: string;
  month?: string; // month number as string e.g. "1" for Jan
  tenure?: string; // e.g. "1-2 years"
  advisor?: string;
}

export async function getClientBirthdayReportData(params?: GetClientBirthdayReportParams): Promise<ClientBirthdayReportData> {
  try {
    const data = await dataService.fetchData("analytics/birthday-report", params);
    return data as ClientBirthdayReportData;
  } catch (error) {
    console.error("Error fetching client birthday report data:", error);
    throw error;
  }
}
// --- END: Added for Client Birthday Report ---

// --- START: Added for Referral Analytics ---
export interface ReferralClient {
  id: string;
  clientName: string;
  segment: 'Platinum' | 'Gold' | 'Silver';
  referredBy: string;
  primaryAdvisor?: string; // Add this field
  aum: number;
  referralDate: string;
}

export interface ReferralSource {
  id: string;
  name: string;
  company?: string;
  totalReferrals: number;
  percentage: number;
  clients: ReferralClient[];
  totalAUM: number;
}

export interface ReferralAnalyticsData {
  totalReferrals: number;
  allReferrals: ReferralClient[];
  referralSources: ReferralSource[];
  filterOptions: {
    referrers: { id: string; name: string }[];
  };
}

export interface GetReferralAnalyticsParams {
  search?: string;
  referrer?: string;
}

export async function getReferralAnalyticsData(params?: GetReferralAnalyticsParams): Promise<ReferralAnalyticsData> {
  try {
    const data = await dataService.fetchData("dashboard/referral-analytics", params);
    return data as ReferralAnalyticsData;
  } catch (error) {
    console.error("Error fetching referral analytics data:", error);
    throw error;
  }
}
// --- END: Added for Referral Analytics ---

/**
 * Fetches the client distribution by state report data from the API.
 * @returns Promise with the client distribution data
 */
export async function getClientDistributionReportData(): Promise<ClientDistributionReportData> {
  try {
    // const params: Record<string, string | number | undefined> = {};
    // if (advisorId !== undefined) { // If advisor context is needed
    //   params.advisorId = advisorId;
    // }
    const data = await dataService.fetchData(
      "analytics/client-distribution-report",
      // params
    );
    return data as ClientDistributionReportData;
  } catch (error) {
    console.error("Error fetching client distribution report data:", error);
    throw error;
  }
}
// --- END: Added for Client Distribution by State Report ---

// --- START: Added for Segmentation Dashboard ---
export interface SegmentationKPI {
  value: number | string;
  label: string;
  icon?: string;
}

export interface SegmentationKpiSet {
  clientCount: SegmentationKPI;
  totalAUM: SegmentationKPI;
  averageClientAUM: SegmentationKPI;
  currentSegmentFocus: string;
}

export interface DonutSegmentData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface SegmentClient {
  id: string;
  name: string;
  age: number;
  yearsWithFirm: number;
  assets: number;
}

export interface ClientSegmentationDashboardData {
  kpis: SegmentationKpiSet;
  donutChartData: DonutSegmentData[];
  tableData: {
    allSegments: {
      Platinum: SegmentClient[];
      Gold: SegmentClient[];
      Silver: SegmentClient[];
    };
    segmentName: string;
    clients: SegmentClient[];
  };
  advisorOptions: { id: string; name: string }[];
  currentAdvisorOrFirmView: string;
}

export interface GetClientSegmentationDashboardParams {
  advisorId?: string;
  segment?: string;
}

export async function getClientSegmentationDashboardData(params?: GetClientSegmentationDashboardParams): Promise<ClientSegmentationDashboardData> {
  try {
    const data = await dataService.fetchData("analytics/segmentation-dashboard", params);
    return data as ClientSegmentationDashboardData;
  } catch (error) {
    console.error("Error fetching segmentation dashboard data:", error);
    throw error;
  }
}
// --- END: Added for Segmentation Dashboard ---

// --- START: Added for Client Dashboard ---
export interface AnniversaryClient {
  id: string;
  clientName: string;
  avatarUrl?: string;
  segment: 'Platinum' | 'Gold' | 'Silver' | string;
  nextAnniversaryDate: string;
  daysUntilNextAnniversary: number;
  yearsWithFirm: number;
  advisorName: string;
  originalStartDate: string;
}

export interface ClientAnniversaryData {
  clients: AnniversaryClient[];
  totalRecords: number;
  filterOptions: {
    segments: string[];
    tenures: string[];
    advisors: { id: string; name: string }[];
  };
}

export interface GetClientAnniversaryParams {
  search?: string;
  segment?: string;
  tenure?: string;
  advisorId?: string;
  upcomingMilestonesOnly?: boolean;
}

export interface InceptionKPI {
  ytdNewClients: number;
  percentageChangeVsPreviousYear: number;
}

export interface InceptionChartDataPoint {
  year: string;
  Platinum: number;
  Gold: number;
  Silver: number;
  Total: number;
}

export interface InceptionChartLegendItem {
  segment: string;
  count: number;
}

export interface InceptionClientDetail {
  id: string;
  name: string;
  email: string;
  segment: 'Platinum' | 'Gold' | 'Silver' | string;
  inceptionDate: string;
}

export interface ClientInceptionData {
  kpi: InceptionKPI;
  chartData: InceptionChartDataPoint[];
  chartLegend: InceptionChartLegendItem[];
  tableClients: InceptionClientDetail[];
  totalTableRecords: number;
  availableYears: number[];
  currentYear: number;
}

export interface GetClientInceptionParams {
  search?: string;
  year?: number;
  segmentFilter?: string;
}

export async function getClientAnniversaryData(params?: GetClientAnniversaryParams): Promise<ClientAnniversaryData> {
  try {
    const data = await dataService.fetchData("analytics/client-anniversaries", params);
    return data as ClientAnniversaryData;
  } catch (error) {
    console.error("Error fetching client anniversary data:", error);
    throw error;
  }
}

export async function getClientInceptionData(params?: GetClientInceptionParams): Promise<ClientInceptionData> {
  try {
    const data = await dataService.fetchData("analytics/client-inception", params);
    return data as ClientInceptionData;
  } catch (error) {
    console.error("Error fetching client inception data:", error);
    throw error;
  }
}
// --- END: Added for Client Dashboard ---

// --- START: Added for Client Referral Rate ---
export interface ReferralRateKPI {
  currentRate: number;
  rateChange: number;
  newClientsThisMonth: number;
  referredClientsThisMonth: number;
}

export interface ReferralRateDataPoint {
  month: string;
  shortMonth: string;
  referralRate: number;
  referredClients: number;
  totalNewClients: number;
}

export interface ClientReferralRateData {
  kpi: ReferralRateKPI;
  chartData: ReferralRateDataPoint[];
}

export interface GetClientReferralRateParams {
  advisorId?: number;
}

/**
 * Fetches client referral rate data from the API
 * @param params Optional parameters including advisorId
 * @returns Promise with the client referral rate data
 */
export async function getClientReferralRateData(params?: GetClientReferralRateParams): Promise<ClientReferralRateData> {
  try {
    const data = await dataService.fetchData("analytics/client-referral-rate", params);
    return data as ClientReferralRateData;
  } catch (error) {
    console.error("Error fetching client referral rate data:", error);
    throw error;
  }
}
// --- END: Added for Client Referral Rate ---

export function filterClientsByAdvisor<T extends { advisor?: string }>(clients: T[], selectedAdvisor: string): T[] {
  if (!selectedAdvisor || selectedAdvisor === 'All Advisors') {
    return clients;
  }
  
  return clients.filter(client => client.advisor === selectedAdvisor);
}
