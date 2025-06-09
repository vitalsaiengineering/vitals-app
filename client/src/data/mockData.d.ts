declare module '@/data/mockData.js' {
  const mockData: {
    // Static chart data
    PerformanceChart: Array<{ name: string; value: number; color: string }>;
    AumOverTime: Array<{ month: string; aum: number }>;
    ClientAgeDistribution: Array<{ name: string; value: number }>;
    ClientSegmentation: Array<{ name: string; value: number; color: string }>;
    SalesChart: Array<{ month: string; sales: number; target: number; profit: number }>;
    UserGrowthChart: Array<{ month: string; users: number; newUsers: number; churn: number }>;
    ProductPerformance: Array<{ product: string; revenue: number; units: number; growth: number }>;
    RevenueChart: Array<{ quarter: string; revenue: number; expenses: number; profit: number }>;
    AssetAllocation: Array<{ name: string; value: number; color: string }>;
    MonthlyPortfolioPerformance: Array<{ month: string; portfolio: number; benchmark: number; sector: number }>;
    AdvisorPerformance: Array<{ advisor: string; clients: number; aum: number; performance: number; satisfaction: number }>;
    InvestmentFlows: Array<{ month: string; inflows: number; outflows: number; net: number }>;
    ClientSatisfactionTrends: Array<{ month: string; overall: number; communication: number; performance: number; service: number }>;
    
    // Dynamic report data
    AgeDemographicsReport: any;
    ClientDistributionByState: any;
    ClientAnniversaryData: any;
    ClientBirthdayReport: any;
    BookDevelopmentBySegmentReport: any;
    ClientSegmentationDashboard: any;
    ClientInceptionData: any;
    
    [key: string]: any;
  };
  
  export default mockData;
} 