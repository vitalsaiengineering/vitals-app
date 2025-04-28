export interface AgeGroup {
  name: string;
  range: string;
  count: number;
  percentage: number;
  colorClass: string;
}

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

// ... existing code ...

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

// ...existing code...

export interface HouseholdNetNew {
  id: string;
  clientName: string;
  segmentation: "Platinum" | "Gold" | "Silver";
  startingAUM: number;
  distributions: number; // Negative value
  contributions: number; // Positive value
  transfers: number; // Positive or negative
  netChange: number;
  endingAUM: number;
  status: "Increasing" | "Decreasing";
}

export interface NnaOverviewMetrics {
  startingAUM: number;
  distributions: number; // Negative
  contributions: number; // Positive
  netTransfers: number; // Positive or negative
  totalNetNewAssets: number;
}

export interface NnaChartDataPoint {
  month: string; // e.g., "Jan 2025"
  netNewAssets: number;
}

export const getMockHouseholdNetNew = (): HouseholdNetNew[] => {
  return [
    {
      id: "1",
      clientName: "John Smith",
      segmentation: "Silver",
      startingAUM: 450000,
      distributions: -15000,
      contributions: 25000,
      transfers: 5000,
      netChange: 15000,
      endingAUM: 465000,
      status: "Increasing",
    },
    {
      id: "2",
      clientName: "Sarah Johnson",
      segmentation: "Platinum",
      startingAUM: 1200000,
      distributions: -50000,
      contributions: 0,
      transfers: -20000,
      netChange: -70000,
      endingAUM: 1130000,
      status: "Decreasing",
    },
    {
      id: "3",
      clientName: "Robert Chen",
      segmentation: "Gold",
      startingAUM: 750000,
      distributions: 0,
      contributions: 100000,
      transfers: 0,
      netChange: 100000,
      endingAUM: 850000,
      status: "Increasing",
    },
    {
      id: "4",
      clientName: "Emily Williams",
      segmentation: "Silver",
      startingAUM: 325000,
      distributions: -25000,
      contributions: 0,
      transfers: 0,
      netChange: -25000,
      endingAUM: 300000,
      status: "Decreasing",
    },
    {
      id: "5",
      clientName: "Michael Brown",
      segmentation: "Platinum",
      startingAUM: 2100000,
      distributions: 0,
      contributions: 150000,
      transfers: 75000,
      netChange: 225000,
      endingAUM: 2325000,
      status: "Increasing",
    },
    {
      id: "6",
      clientName: "Jennifer Lee",
      segmentation: "Gold",
      startingAUM: 890000,
      distributions: -35000,
      contributions: 45000,
      transfers: -15000,
      netChange: -5000,
      endingAUM: 885000,
      status: "Decreasing",
    },
    {
      id: "7",
      clientName: "David Garcia",
      segmentation: "Gold",
      startingAUM: 675000,
      distributions: -10000,
      contributions: 30000,
      transfers: 0,
      netChange: 20000,
      endingAUM: 695000,
      status: "Increasing",
    },
  ];
};

export const getMockNnaOverviewMetrics = (): NnaOverviewMetrics => {
  return {
    startingAUM: 7840000,
    distributions: -210000,
    contributions: 375000,
    netTransfers: -5000,
    totalNetNewAssets: 160000, // contributions + distributions + netTransfers
  };
};

export const getMockNnaChartData = (): NnaChartDataPoint[] => {
  // Simplified data for brevity, matching the visual trend
  return [
    { month: "Jan 2025", netNewAssets: 145000 },
    { month: "Feb 2025", netNewAssets: 138000 },
    { month: "Mar 2025", netNewAssets: 166791 }, // From tooltip
    { month: "Apr 2025", netNewAssets: 135000 },
    { month: "May 2025", netNewAssets: 160000 },
    { month: "Jun 2025", netNewAssets: 150000 },
    { month: "Jul 2025", netNewAssets: 135000 },
    { month: "Aug 2025", netNewAssets: 135000 },
    { month: "Sep 2025", netNewAssets: 180000 },
    { month: "Oct 2025", netNewAssets: 165000 },
    { month: "Nov 2025", netNewAssets: 140000 },
    { month: "Dec 2025", netNewAssets: 125000 },
  ];
};

// Function to get household counts for filters
export const getHouseholdTrendCounts = (households: HouseholdNetNew[]) => {
  const increasing = households.filter((h) => h.status === "Increasing").length;
  const decreasing = households.filter((h) => h.status === "Decreasing").length;
  // Assuming no 'Stable' status in the provided mock data
  const stable = 0;
  const all = households.length;
  return { increasing, decreasing, stable, all };
};

// ... existing interfaces ...

export interface MonthlyHouseholdSummary {
  month: string; // e.g., "May 2025"
  startingAUM: number;
  contributions: number;
  distributions: number; // Negative
  netTransfers: number;
  endingAUM: number;
}

// Store mock data for all months in an object for easy lookup
const mockMonthlySummaries: { [month: string]: MonthlyHouseholdSummary } = {
  "Jan 2025": {
    month: "Jan 2025",
    startingAUM: 7840000,
    contributions: 45000,
    distributions: -15000,
    netTransfers: 5000,
    endingAUM: 7875000, // 7840000 + 45000 - 15000 + 5000
  },
  "Feb 2025": {
    month: "Feb 2025",
    startingAUM: 7875000, // Ending AUM from Jan
    contributions: 30000,
    distributions: -20000,
    netTransfers: -2000,
    endingAUM: 7883000, // 7875000 + 30000 - 20000 - 2000
  },
  "Mar 2025": {
    month: "Mar 2025",
    startingAUM: 7883000, // Ending AUM from Feb
    contributions: 55000,
    distributions: -10000,
    netTransfers: 8000,
    endingAUM: 7936000, // 7883000 + 55000 - 10000 + 8000
  },
  "Apr 2025": {
    month: "Apr 2025",
    startingAUM: 7936000, // Ending AUM from Mar
    contributions: 25000,
    distributions: -30000,
    netTransfers: -5000,
    endingAUM: 7926000, // 7936000 + 25000 - 30000 - 5000
  },
  "May 2025": {
    month: "May 2025",
    startingAUM: 7926000, // Ending AUM from Apr (Updated from original example)
    contributions: 31416,
    distributions: -17833,
    netTransfers: -400,
    endingAUM: 7939183, // 7926000 + 31416 - 17833 - 400
  },
  "Jun 2025": {
    month: "Jun 2025",
    startingAUM: 7939183, // Ending AUM from May
    contributions: 40000,
    distributions: -12000,
    netTransfers: 3000,
    endingAUM: 7970183, // 7939183 + 40000 - 12000 + 3000
  },
  "Jul 2025": {
    month: "Jul 2025",
    startingAUM: 7970183, // Ending AUM from Jun
    contributions: 20000,
    distributions: -25000,
    netTransfers: -1000,
    endingAUM: 7964183, // 7970183 + 20000 - 25000 - 1000
  },
  "Aug 2025": {
    month: "Aug 2025",
    startingAUM: 7964183, // Ending AUM from Jul
    contributions: 35000,
    distributions: -18000,
    netTransfers: 6000,
    endingAUM: 7987183, // 7964183 + 35000 - 18000 + 6000
  },
  "Sep 2025": {
    month: "Sep 2025",
    startingAUM: 7987183, // Ending AUM from Aug
    contributions: 60000,
    distributions: -22000,
    netTransfers: 10000,
    endingAUM: 8035183, // 7987183 + 60000 - 22000 + 10000
  },
  "Oct 2025": {
    month: "Oct 2025",
    startingAUM: 8035183, // Ending AUM from Sep
    contributions: 28000,
    distributions: -35000,
    netTransfers: -3000,
    endingAUM: 8025183, // 8035183 + 28000 - 35000 - 3000
  },
  "Nov 2025": {
    month: "Nov 2025",
    startingAUM: 8025183, // Ending AUM from Oct
    contributions: 32000,
    distributions: -16000,
    netTransfers: 1500,
    endingAUM: 8042683, // 8025183 + 32000 - 16000 + 1500
  },
  "Dec 2025": {
    month: "Dec 2025",
    startingAUM: 8042683, // Ending AUM from Nov
    contributions: 22000,
    distributions: -40000,
    netTransfers: -5000,
    endingAUM: 8019683, // 8042683 + 22000 - 40000 - 5000
  },
};

export const getMockMonthlyHouseholdSummary = (
  month: string,
): MonthlyHouseholdSummary | null => {
  // Look up the month in the predefined data object
  return mockMonthlySummaries[month] || null; // Return the data if found, otherwise null
};

// ... rest of clientData.ts ...
