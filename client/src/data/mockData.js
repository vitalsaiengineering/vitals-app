import {
  generateAgeDemographicsReport,
  generateClientDistributionByStateReport,
  generateClientAnniversaryData,
  generateClientBirthdayReport,
  generateBookDevelopmentBySegmentReport,
  generateClientSegmentationDashboard,
  generateClientInceptionData
} from '../utils/clientDataUtils.js';

// Static chart data that doesn't depend on client data
const staticChartData = {
  "PerformanceChart": [
    {
      "name": "Technology",
      "value": 28,
      "color": "#0078D4"
    },
    {
      "name": "Healthcare",
      "value": 22,
      "color": "#2B88D8"
    },
    {
      "name": "Finance",
      "value": 18,
      "color": "#71AFE5"
    },
    {
      "name": "Consumer Goods",
      "value": 16,
      "color": "#B7D9F7"
    },
    {
      "name": "Energy",
      "value": 10,
      "color": "#CEEAFF"
    },
    {
      "name": "Other",
      "value": 6,
      "color": "#E8F4FD"
    }
  ],
  "AumOverTime": [
    {
      "month": "Jan '23",
      "aum": 15200000
    },
    {
      "month": "Feb '23",
      "aum": 15800000
    },
    {
      "month": "Mar '23",
      "aum": 16100000
    },
    {
      "month": "Apr '23",
      "aum": 16500000
    },
    {
      "month": "May '23",
      "aum": 16700000
    },
    {
      "month": "Jun '23",
      "aum": 17200000
    },
    {
      "month": "Jul '23",
      "aum": 17500000
    },
    {
      "month": "Aug '23",
      "aum": 17800000
    },
    {
      "month": "Sep '23",
      "aum": 18200000
    },
    {
      "month": "Oct '23",
      "aum": 18500000
    },
    {
      "month": "Nov '23",
      "aum": 19000000
    },
    {
      "month": "Dec '23",
      "aum": 19800000
    },
    {
      "month": "Jan '24",
      "aum": 20500000
    },
    {
      "month": "Feb '24",
      "aum": 21200000
    },
    {
      "month": "Mar '24",
      "aum": 21800000
    },
    {
      "month": "Apr '24",
      "aum": 22300000
    },
    {
      "month": "May '24",
      "aum": 22800000
    },
    {
      "month": "Jun '24",
      "aum": 23400000
    },
    {
      "month": "Jul '24",
      "aum": 24100000
    },
    {
      "month": "Aug '24",
      "aum": 24800000
    },
    {
      "month": "Sep '24",
      "aum": 25500000
    },
    {
      "month": "Oct '24",
      "aum": 26300000
    },
    {
      "month": "Nov '24",
      "aum": 27100000
    },
    {
      "month": "Dec '24",
      "aum": 28000000
    }
  ],
  "ClientAgeDistribution": [
    {
      "name": "Under 30",
      "value": 8
    },
    {
      "name": "30-45",
      "value": 22
    },
    {
      "name": "46-60",
      "value": 38
    },
    {
      "name": "61-75",
      "value": 25
    },
    {
      "name": "Over 75",
      "value": 7
    }
  ],
  "ClientSegmentation": [
    {
      "name": "Platinum",
      "value": 30,
      "color": "#0088FE"
    },
    {
      "name": "Gold",
      "value": 45,
      "color": "#00C49F"
    },
    {
      "name": "Silver",
      "value": 25,
      "color": "#1E88E5"
    }
  ],
  "SalesChart": [
    {
      "month": "Jan",
      "sales": 1200,
      "target": 1000,
      "profit": 240
    },
    {
      "month": "Feb",
      "sales": 1450,
      "target": 1100,
      "profit": 290
    },
    {
      "month": "Mar",
      "sales": 1380,
      "target": 1200,
      "profit": 276
    },
    {
      "month": "Apr",
      "sales": 1620,
      "target": 1300,
      "profit": 324
    },
    {
      "month": "May",
      "sales": 1750,
      "target": 1400,
      "profit": 350
    },
    {
      "month": "Jun",
      "sales": 1680,
      "target": 1500,
      "profit": 336
    },
    {
      "month": "Jul",
      "sales": 1920,
      "target": 1600,
      "profit": 384
    },
    {
      "month": "Aug",
      "sales": 2100,
      "target": 1700,
      "profit": 420
    },
    {
      "month": "Sep",
      "sales": 1850,
      "target": 1800,
      "profit": 370
    },
    {
      "month": "Oct",
      "sales": 2300,
      "target": 1900,
      "profit": 460
    },
    {
      "month": "Nov",
      "sales": 2450,
      "target": 2000,
      "profit": 490
    },
    {
      "month": "Dec",
      "sales": 2680,
      "target": 2100,
      "profit": 536
    }
  ],
  "UserGrowthChart": [
    {
      "month": "Jan",
      "users": 1240,
      "newUsers": 120,
      "churn": 45
    },
    {
      "month": "Feb",
      "users": 1315,
      "newUsers": 98,
      "churn": 23
    },
    {
      "month": "Mar",
      "users": 1398,
      "newUsers": 107,
      "churn": 24
    },
    {
      "month": "Apr",
      "users": 1485,
      "newUsers": 115,
      "churn": 28
    },
    {
      "month": "May",
      "users": 1572,
      "newUsers": 124,
      "churn": 37
    },
    {
      "month": "Jun",
      "users": 1648,
      "newUsers": 95,
      "churn": 19
    },
    {
      "month": "Jul",
      "users": 1735,
      "newUsers": 108,
      "churn": 21
    },
    {
      "month": "Aug",
      "users": 1823,
      "newUsers": 117,
      "churn": 29
    },
    {
      "month": "Sep",
      "users": 1904,
      "newUsers": 101,
      "churn": 20
    },
    {
      "month": "Oct",
      "users": 1995,
      "newUsers": 112,
      "churn": 21
    },
    {
      "month": "Nov",
      "users": 2086,
      "newUsers": 118,
      "churn": 27
    },
    {
      "month": "Dec",
      "users": 2174,
      "newUsers": 125,
      "churn": 37
    }
  ],
  "ProductPerformance": [
    {
      "product": "Product A",
      "revenue": 120000,
      "units": 800,
      "growth": 15.2
    },
    {
      "product": "Product B",
      "revenue": 95000,
      "units": 650,
      "growth": 8.7
    },
    {
      "product": "Product C",
      "revenue": 78000,
      "units": 520,
      "growth": -2.1
    },
    {
      "product": "Product D",
      "revenue": 145000,
      "units": 920,
      "growth": 22.5
    },
    {
      "product": "Product E",
      "revenue": 62000,
      "units": 410,
      "growth": 5.8
    }
  ],
  "RevenueChart": [
    {
      "quarter": "Q1 2023",
      "revenue": 425000,
      "expenses": 320000,
      "profit": 105000
    },
    {
      "quarter": "Q2 2023",
      "revenue": 468000,
      "expenses": 345000,
      "profit": 123000
    },
    {
      "quarter": "Q3 2023",
      "revenue": 512000,
      "expenses": 378000,
      "profit": 134000
    },
    {
      "quarter": "Q4 2023",
      "revenue": 580000,
      "expenses": 420000,
      "profit": 160000
    },
    {
      "quarter": "Q1 2024",
      "revenue": 620000,
      "expenses": 445000,
      "profit": 175000
    },
    {
      "quarter": "Q2 2024",
      "revenue": 675000,
      "expenses": 485000,
      "profit": 190000
    },
    {
      "quarter": "Q3 2024",
      "revenue": 720000,
      "expenses": 515000,
      "profit": 205000
    },
    {
      "quarter": "Q4 2024",
      "revenue": 785000,
      "expenses": 555000,
      "profit": 230000
    }
  ],
  "AssetAllocation": [
    {
      "name": "Stocks",
      "value": 45,
      "color": "#0088FE"
    },
    {
      "name": "Bonds",
      "value": 25,
      "color": "#00C49F"
    },
    {
      "name": "Real Estate",
      "value": 15,
      "color": "#FFBB28"
    },
    {
      "name": "Commodities",
      "value": 10,
      "color": "#FF8042"
    },
    {
      "name": "Cash",
      "value": 5,
      "color": "#8884D8"
    }
  ],
  "MonthlyPortfolioPerformance": [
    {
      "month": "Jan",
      "portfolio": 8.2,
      "benchmark": 7.8,
      "sector": 7.5
    },
    {
      "month": "Feb",
      "portfolio": 6.5,
      "benchmark": 6.2,
      "sector": 6.8
    },
    {
      "month": "Mar",
      "portfolio": 9.1,
      "benchmark": 8.7,
      "sector": 8.9
    },
    {
      "month": "Apr",
      "portfolio": 7.8,
      "benchmark": 7.9,
      "sector": 8.1
    },
    {
      "month": "May",
      "portfolio": 10.3,
      "benchmark": 9.8,
      "sector": 9.5
    },
    {
      "month": "Jun",
      "portfolio": 8.9,
      "benchmark": 8.4,
      "sector": 8.6
    },
    {
      "month": "Jul",
      "portfolio": 11.2,
      "benchmark": 10.5,
      "sector": 10.8
    },
    {
      "month": "Aug",
      "portfolio": 9.7,
      "benchmark": 9.2,
      "sector": 9.4
    },
    {
      "month": "Sep",
      "portfolio": 7.3,
      "benchmark": 7.8,
      "sector": 7.6
    },
    {
      "month": "Oct",
      "portfolio": 12.1,
      "benchmark": 11.4,
      "sector": 11.7
    },
    {
      "month": "Nov",
      "portfolio": 10.8,
      "benchmark": 10.2,
      "sector": 10.5
    },
    {
      "month": "Dec",
      "portfolio": 13.5,
      "benchmark": 12.8,
      "sector": 13.1
    }
  ],
  "AdvisorPerformance": [
    {
      "advisor": "Maria Reynolds",
      "clients": 87,
      "aum": 245000000,
      "performance": 12.5,
      "satisfaction": 4.7
    },
    {
      "advisor": "Thomas Chen",
      "clients": 72,
      "aum": 198000000,
      "performance": 11.8,
      "satisfaction": 4.5
    },
    {
      "advisor": "Aisha Patel",
      "clients": 65,
      "aum": 187000000,
      "performance": 13.2,
      "satisfaction": 4.8
    },
    {
      "advisor": "Jackson Miller",
      "clients": 58,
      "aum": 165000000,
      "performance": 10.9,
      "satisfaction": 4.3
    },
    {
      "advisor": "Sarah Johnson",
      "clients": 64,
      "aum": 176000000,
      "performance": 12.1,
      "satisfaction": 4.6
    }
  ],
  "InvestmentFlows": [
    {
      "month": "Jan",
      "inflows": 15200000,
      "outflows": 8700000,
      "net": 6500000
    },
    {
      "month": "Feb",
      "inflows": 18500000,
      "outflows": 9200000,
      "net": 9300000
    },
    {
      "month": "Mar",
      "inflows": 22100000,
      "outflows": 10500000,
      "net": 11600000
    },
    {
      "month": "Apr",
      "inflows": 19800000,
      "outflows": 11200000,
      "net": 8600000
    },
    {
      "month": "May",
      "inflows": 25400000,
      "outflows": 12800000,
      "net": 12600000
    },
    {
      "month": "Jun",
      "inflows": 21700000,
      "outflows": 9800000,
      "net": 11900000
    },
    {
      "month": "Jul",
      "inflows": 28300000,
      "outflows": 13500000,
      "net": 14800000
    },
    {
      "month": "Aug",
      "inflows": 24600000,
      "outflows": 11700000,
      "net": 12900000
    },
    {
      "month": "Sep",
      "inflows": 20900000,
      "outflows": 14200000,
      "net": 6700000
    },
    {
      "month": "Oct",
      "inflows": 31200000,
      "outflows": 15800000,
      "net": 15400000
    },
    {
      "month": "Nov",
      "inflows": 27800000,
      "outflows": 12400000,
      "net": 15400000
    },
    {
      "month": "Dec",
      "inflows": 35600000,
      "outflows": 18900000,
      "net": 16700000
    }
  ],
  "ClientSatisfactionTrends": [
    {
      "month": "Jan",
      "overall": 4.2,
      "communication": 4.1,
      "performance": 4.3,
      "service": 4.0
    },
    {
      "month": "Feb",
      "overall": 4.3,
      "communication": 4.2,
      "performance": 4.4,
      "service": 4.1
    },
    {
      "month": "Mar",
      "overall": 4.4,
      "communication": 4.3,
      "performance": 4.5,
      "service": 4.2
    },
    {
      "month": "Apr",
      "overall": 4.3,
      "communication": 4.2,
      "performance": 4.4,
      "service": 4.1
    },
    {
      "month": "May",
      "overall": 4.5,
      "communication": 4.4,
      "performance": 4.6,
      "service": 4.3
    },
    {
      "month": "Jun",
      "overall": 4.4,
      "communication": 4.3,
      "performance": 4.5,
      "service": 4.2
    },
    {
      "month": "Jul",
      "overall": 4.6,
      "communication": 4.5,
      "performance": 4.7,
      "service": 4.4
    },
    {
      "month": "Aug",
      "overall": 4.5,
      "communication": 4.4,
      "performance": 4.6,
      "service": 4.3
    },
    {
      "month": "Sep",
      "overall": 4.4,
      "communication": 4.3,
      "performance": 4.5,
      "service": 4.2
    },
    {
      "month": "Oct",
      "overall": 4.7,
      "communication": 4.6,
      "performance": 4.8,
      "service": 4.5
    },
    {
      "month": "Nov",
      "overall": 4.6,
      "communication": 4.5,
      "performance": 4.7,
      "service": 4.4
    },
    {
      "month": "Dec",
      "overall": 4.8,
      "communication": 4.7,
      "performance": 4.9,
      "service": 4.6
    }
  ]
};

// Dynamic data generated from centralized client data
const dynamicReportData = {
  get AgeDemographicsReport() {
    return generateAgeDemographicsReport();
  },
  get ClientDistributionByState() {
    return generateClientDistributionByStateReport();
  },
  get ClientAnniversaryData() {
    return generateClientAnniversaryData();
  },
  get ClientBirthdayReport() {
    return generateClientBirthdayReport();
  },
  get BookDevelopmentBySegmentReport() {
    return generateBookDevelopmentBySegmentReport();
  },
  get ClientSegmentationDashboard() {
    return generateClientSegmentationDashboard();
  },
  get ClientInceptionData() {
    return generateClientInceptionData();
  }
};

// Combine static and dynamic data
const mockData = {
  ...staticChartData,
  ...dynamicReportData
};

export default mockData; 