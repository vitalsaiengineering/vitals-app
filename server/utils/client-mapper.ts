/**
 * Client Mapping Utilities
 * Maps database client records to StandardClient format
 */

import type { StandardClient } from "../types/client";

/**
 * Safely converts a date value to ISO date string (YYYY-MM-DD)
 * Handles both Date objects and string dates
 */
function safeToISODate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  } catch (error) {
    console.warn("Error converting date to ISO string:", error);
    return "";
  }
}

// Type for database client record (based on the schema)
interface DbClient {
  id: number;
  externalId: string | null;
  orionClientId: string | null;
  wealthboxClientId: string | null;
  firmId: number;
  primaryAdvisorId: number | null;
  firstName: string;
  lastName: string;
  title: string | null;
  contactType: string | null;
  segment: string | null;
  age: number | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  aum: string | null;
  isActive: boolean | null;
  representativeName: string | null;
  representativeId: number | null;
  startDate: Date | null;
  contactInfo: any;
  source: string | null;
  dateOfBirth: Date | null;
  referredBy: number | null;
  inceptionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "inactive" | "archived";
}

interface DbUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

/**
 * Maps a database client record to StandardClient format
 */
export function mapDbClientToStandard(
  dbClient: DbClient,
  advisor?: DbUser | null | null
): StandardClient {
  // Extract contact info safely
  const contactInfo = dbClient.contactInfo || {};

  // Build advisor name
  const advisorName = [
    advisor?.firstName,
    advisor?.lastName,
    dbClient.representativeName,
  ]
    .filter(Boolean)
    .join(" ");

  // Handle date fields safely
  const dateOfBirth = safeToISODate(dbClient.dateOfBirth);

  const inceptionDate = dbClient.inceptionDate
    ? safeToISODate(dbClient.inceptionDate)
    : safeToISODate(dbClient.startDate);

  // Calculate age if not provided but have birth date
  let clientAge = dbClient.age || 0;
  if (!clientAge && dbClient.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dbClient.dateOfBirth);
    clientAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      clientAge--;
    }
  }

  return {
    id: dbClient.id.toString(),
    name: `${dbClient.firstName} ${dbClient.lastName}`.trim(),
    firstName: dbClient.firstName,
    lastName: dbClient.lastName,
    age: clientAge,
    dateOfBirth,
    segment: (dbClient.segment as any) || "",
    aum: parseFloat(dbClient.aum || "0"),
    advisor: advisorName,
    primaryAdvisorId: (dbClient.primaryAdvisorId || 0).toString(),
    inceptionDate,
    state: contactInfo.state || "",
    stateCode: contactInfo.stateCode || "",
    city: contactInfo.city || "",
    email: dbClient.emailAddress || "",
    phone: dbClient.phoneNumber || "",
    household: contactInfo.household || "",
    isActive: dbClient.isActive ?? false,
    referredBy: dbClient.referredBy?.toString(),
    contactType: dbClient.contactType,
    title: dbClient.title,
    status: dbClient.status,
  };
}

/**
 * Maps an array of database clients with their advisors to StandardClient format
 */
export function mapDbClientsToStandard(
  dbResults: Array<{ clients: DbClient; users: DbUser | null }>
): StandardClient[] {
  return dbResults.map((result) =>
    mapDbClientToStandard(result.clients, result.users || undefined)
  );
}

/**
 * State code to name mapping for consistent state handling
 */
export const STATE_MAPPING: { [key: string]: string } = {
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
  DC: "District of Columbia",
  PR: "Puerto Rico",
  VI: "U.S. Virgin Islands",
  AS: "American Samoa",
  GU: "Guam",
  MP: "Northern Mariana Islands",
};

export const YEAR_MAPPING: { [key: string]: string } = {
  "2024": "2024",
  "2023": "2023",
  "2022": "2022",
  "2021": "2021",
  "2020": "2020",
  "2019": "2019",
  "2018": "2018",
  "2017": "2017",
  "2016": "2016",
  "2015": "2015",
  "2014": "2014",
  "2013": "2013",
  "2012": "2012",
  "2011": "2011",
  "2010": "2010",
  "2009": "2009",
  "2008": "2008",
  "2007": "2007",
  "2006": "2006",
  "2005": "2005",
  "2004": "2004",
  "2003": "2003",
  "2002": "2002",
  "2001": "2001",
  "2000": "2000",
  "1999": "1999",
  "1998": "1998",
  "1997": "1997",
  "1996": "1996",
  "1995": "1995",
  "1994": "1994",
  "1993": "1993",
  "1992": "1992",
  "1991": "1991",
  "1990": "1990",
  "1989": "1989",
  "1988": "1988",
  "1987": "1987",
  "1986": "1986",
  "1985": "1985",
  "1984": "1984",
  "1983": "1983",
  "1982": "1982",
  "1981": "1981",
  "1980": "1980",
  "1979": "1979",
  "1978": "1978",
  "1977": "1977",
  "1976": "1976",
  "1975": "1975",
  "1974": "1974",
  "1973": "1973",
  "1972": "1972",
  "1971": "1971",
  "1970": "1970",
  "1969": "1969",
  "1968": "1968",
  "1967": "1967",
  "1966": "1966",
  "1965": "1965",
  "1964": "1964",
  "1963": "1963",
  "1962": "1962",
  "1961": "1961",
  "1960": "1960",
  "1959": "1959",
  "1958": "1958",
  "1957": "1957",
  "1956": "1956",
  "1955": "1955",
  "1954": "1954",
  "1953": "1953",
  "1952": "1952",
  "1951": "1951",
  "1950": "1950",
  "1949": "1949",
};

/**
 * Normalize state information
 */
export function normalizeState(state: string): { code: string; name: string } {
  if (!state) return { code: "", name: "" };

  // If it's a 2-letter code, convert to name
  const upperState = state.toUpperCase();
  if (upperState.length === 2 && STATE_MAPPING[upperState]) {
    return { code: upperState, name: STATE_MAPPING[upperState] };
  }

  // If it's a full name, find the code
  const normalizedName = state.trim();
  const code = Object.keys(STATE_MAPPING).find(
    (key) => STATE_MAPPING[key].toLowerCase() === normalizedName.toLowerCase()
  );

  return {
    code: code || "",
    name: code ? STATE_MAPPING[code] : normalizedName,
  };
}
