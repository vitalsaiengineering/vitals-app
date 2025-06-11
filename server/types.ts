// --- Age Demographics Report Types ---
export interface SegmentBreakdown {
  segment: string;
  clients: number;
  aum: number;
}

export interface AgeBracketDataEntry {
  bracket: string;
  clientCount: number;
  clientPercentage: number;
  aum: number;
  aumPercentage: number;
  detailedBreakdown: SegmentBreakdown[];
}

export interface ClientReportDetail {
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

// --- Client Distribution Report Types ---
export interface TopStateSummary {
  stateName: string;
  value: number | string;
  metricLabel: "clients" | "AUM";
}

export interface StateMetric {
  stateCode: string;
  stateName: string;
  clientCount: number;
  totalAum: number;
}

export interface ClientInStateDetail {
  id: string;
  name: string;
  segment: string;
  aum: number;
}

export interface ClientDistributionReportData {
  topStateByClients: TopStateSummary;
  topStateByAUM: TopStateSummary;
  stateMetrics: StateMetric[];
  clientDetailsByState: { [stateCode: string]: ClientInStateDetail[] };
}

// --- Book Development Report Types ---
export interface BookDevelopmentClient {
  id: string;
  name: string;
  segment: "Platinum" | "Gold" | "Silver";
  yearsWithFirm: number;
  yearsWithFirmText: string;
  sinceDateText: string;
  aum: number;
}

export interface YearlySegmentDataPoint {
  year: number;
  value: number;
  previousYearValue?: number;
}

export interface BookDevelopmentSegmentData {
  name: "Platinum" | "Gold" | "Silver";
  color: string;
  fillColor?: string;
  dataAUM: YearlySegmentDataPoint[];
  dataClientCount: YearlySegmentDataPoint[];
  clients: BookDevelopmentClient[];
}

export interface BookDevelopmentReportData {
  allSegmentsData: BookDevelopmentSegmentData[];
}

// --- Client Birthday Report Types ---
export interface BirthdayClient {
  id: string;
  clientName: string;
  grade: "Platinum" | "Gold" | "Silver" | "Bronze" | string;
  dateOfBirth: string; // YYYY-MM-DD
  nextBirthdayDisplay: string; // e.g., "In 5 days" or "Jan 15"
  nextBirthdayDate: string; // YYYY-MM-DD of the upcoming birthday
  turningAge: number;
  aum: number;
  clientTenure: string; // e.g., "5 years"
  advisorName: string;
  // Internal properties for filtering and sorting
  daysUntilNextBirthday?: number;
  _tenureYears?: number;
  _nextBirthdayMonth?: number;
}

export interface BirthdayReportFilters {
  grades: string[];
  advisors: string[];
}

export interface ClientBirthdayReportData {
  clients: BirthdayClient[];
  filters: BirthdayReportFilters;
}

// --- Client Segmentation Dashboard Types ---
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
    segmentName: string;
    clients: SegmentClient[];
  };
  advisorOptions: { id: string; name: string }[];
  currentAdvisorOrFirmView: string;
}

// --- Client Anniversary View Types ---
export interface AnniversaryClient {
  id: string;
  clientName: string;
  avatarUrl?: string;
  segment: "Platinum" | "Gold" | "Silver" | string;
  nextAnniversaryDate: string; // Formatted e.g., "Jun 1, 2025"
  daysUntilNextAnniversary: number;
  yearsWithFirm: number;
  advisorName: string;
  originalStartDate: string; // YYYY-MM-DD
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

// --- Client Inception View Types ---
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
  segment: "Platinum" | "Gold" | "Silver" | string;
  inceptionDate: string; // YYYY-MM-DD
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

// --- Referral Analytics Types ---
export interface ReferralClient {
  id: string;
  clientName: string;
  segment: "Platinum" | "Gold" | "Silver";
  referredBy: string;
  primaryAdvisor?: string;
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

// --- Client Referral Rate Types ---
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

// --- Advisory Firm Dashboard Types ---
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