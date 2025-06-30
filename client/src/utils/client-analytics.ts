/**
 * Client Analytics Utilities
 * Frontend calculations for all metrics and KPIs from StandardClient arrays
 */

import { StandardClient } from '../types/client';

/**
 * Gets a pretty display name for a client
 * Falls back to firstName + lastName if name is not available
 */
export function getPrettyClientName(client: Pick<StandardClient, 'name' | 'firstName' | 'lastName'>): string {
  return client.name || [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown Client';
}

/**
 * Gets a standardized segment name with proper fallback
 * Returns 'N/A' for missing or invalid segments
 */
export function getSegmentName(segment?: string | null): string {
  if (!segment || segment.trim() === '') {
    return 'N/A';
  }
  
  const normalizedSegment = segment.trim().toLowerCase();
  
  // Map known segments to proper case
  switch (normalizedSegment) {
    case 'platinum':
      return 'Platinum';
    case 'gold':
      return 'Gold';
    case 'silver':
      return 'Silver';
    case 'bronze':
      return 'Bronze';
    default:
      // For unknown segments, return with proper capitalization
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
  }
}

/**
 * Formats AUM consistently across the application
 * Handles all edge cases and provides clean currency formatting
 */
export function formatAUM(amount: number | string | null | undefined): string {
  // Convert to number if string
  let numericAmount: number;
  
  if (typeof amount === 'string') {
    numericAmount = parseFloat(amount);
  } else if (typeof amount === 'number') {
    numericAmount = amount;
  } else {
    numericAmount = 0;
  }
  
  // Handle invalid numbers, NaN, null, undefined, or negative values
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }

  // Format with proper currency formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Formats AUM for dashboard metrics (simplified M format)
 * Used specifically for dashboard metric cards
 */
export function formatAUMShort(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '$0M';
  }
  
  // Convert to millions and round to 1 decimal place
  const millions = amount / 1000000;
  return `$${millions.toFixed(1)}M`;
}

/**
 * Formats revenue for dashboard (simplified M format)
 */
export function formatRevenue(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '$0M';
  }
  
  // Convert to millions and round to 1 decimal place
  const millions = amount / 1000000;
  return `$${millions.toFixed(1)}M`;
}

// Age Demographics
export interface AgeDemographicsData {
  overall: {
    totalClients: number;
    totalAUM: number;
    averageClientAge: number;
  };
  byAgeBracket: Array<{
    bracket: string;
    clientCount: number;
    clientPercentage: number;
    aum: number;
    aumPercentage: number;
    detailedBreakdown: Array<{
      segment: string;
      clients: number;
      aum: number;
    }>;
  }>;
}

export function calculateAgeDemographics(clients: StandardClient[]): AgeDemographicsData {
  const totalClients = clients.length;
  const totalAUM = clients.reduce((sum, c) => sum + c.aum, 0);
  const averageClientAge = totalClients > 0 ? clients.reduce((sum, c) => sum + c.age, 0) / totalClients : 0;

  // Define age brackets
  const brackets = [
    { name: '0-20', min: 0, max: 20 },
    { name: '21-40', min: 21, max: 40 },
    { name: '41-60', min: 41, max: 60 },
    { name: '61-80', min: 61, max: 80 },
    { name: '81+', min: 81, max: 150 }
  ];

  const byAgeBracket = brackets.map(bracket => {
    const bracketClients = clients.filter(c => c.age >= bracket.min && c.age <= bracket.max);
    const bracketAum = bracketClients.reduce((sum, c) => sum + c.aum, 0);
    
    // Calculate segment breakdown for this bracket
    const detailedBreakdown = ['platinum', 'gold', 'silver'].map(segment => {
      const segmentClients = bracketClients.filter(c => c.segment?.toLowerCase() === segment);
      return {
        segment,
        clients: segmentClients.length,
        aum: segmentClients.reduce((sum, c) => sum + c.aum, 0)
      };
    });

    return {
      bracket: bracket.name,
      clientCount: bracketClients.length,
      clientPercentage: totalClients > 0 ? (bracketClients.length / totalClients) * 100 : 0,
      aum: bracketAum,
      aumPercentage: totalAUM > 0 ? (bracketAum / totalAUM) * 100 : 0,
      detailedBreakdown
    };
  });

  return {
    overall: { totalClients, totalAUM, averageClientAge },
    byAgeBracket
  };
}

// Birthday Clients
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
  daysUntilNextBirthday?: number;
}

export function getBirthdayClients(clients: StandardClient[], targetMonth?: number): BirthdayClient[] {
  const today = new Date();
  const currentYear = today.getFullYear();

  return clients
    .filter(client => {
      // If filtering by target month, only include clients with valid birth dates in that month
      if (targetMonth) {
        if (!client.dateOfBirth) return false;
        const birthDate = new Date(client.dateOfBirth);
        if (isNaN(birthDate.getTime())) return false;
        const birthMonth = birthDate.getMonth() + 1;
        return birthMonth === targetMonth;
      }
      // If no target month filter, include all clients
      return true;
    })
    .map(client => {
      // Calculate tenure (this should work for all clients)
      const inceptionDate = client.inceptionDate ? new Date(client.inceptionDate) : new Date();
      const tenureYears = Math.floor((today.getTime() - inceptionDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
      
      // Check if client has valid birth date
      const hasValidBirthDate = client.dateOfBirth && !isNaN(new Date(client.dateOfBirth).getTime());
      
      if (!hasValidBirthDate) {
        // Client without valid birth date - show N/A for birthday fields
        return {
          id: client.id,
          clientName: getPrettyClientName(client),
          grade: getSegmentName(client.segment),
          dateOfBirth: 'N/A',
          nextBirthdayDisplay: 'N/A',
          nextBirthdayDate: 'N/A',
          turningAge: 0, // or could be N/A, but number field expected
          aum: client.aum,
          clientTenure: `${tenureYears} years`,
          advisorName: client.advisor,
          daysUntilNextBirthday: 999999 // Large number to sort at end
        };
      }
      
      // Client with valid birth date - calculate birthday info
      const birthDate = new Date(client.dateOfBirth);
      
      // Create dates in local timezone to avoid timezone conversion issues
      const birthMonth = birthDate.getMonth();
      const birthDay = birthDate.getDate();
      
      // Create this year's birthday (noon to avoid timezone issues)
      const thisYearBirthday = new Date(currentYear, birthMonth, birthDay, 12, 0, 0);
      const nextYearBirthday = new Date(currentYear + 1, birthMonth, birthDay, 12, 0, 0);
      
      // Determine next birthday
      const nextBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
      const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Format next birthday date without timezone conversion
      const nextBirthdayDateString = `${nextBirthday.getFullYear()}-${String(nextBirthday.getMonth() + 1).padStart(2, '0')}-${String(nextBirthday.getDate()).padStart(2, '0')}`;
      
      return {
        id: client.id,
        clientName: getPrettyClientName(client),
        grade: getSegmentName(client.segment),
        dateOfBirth: client.dateOfBirth,
        nextBirthdayDisplay: `In ${daysUntil} days`,
        nextBirthdayDate: nextBirthdayDateString,
        turningAge: nextBirthday.getFullYear() - birthDate.getFullYear(),
        aum: client.aum,
        clientTenure: `${tenureYears} years`,
        advisorName: client.advisor,
        daysUntilNextBirthday: daysUntil
      };
    })
    .sort((a, b) => (a.daysUntilNextBirthday || 0) - (b.daysUntilNextBirthday || 0));
}

// Client Distribution
export function calculateClientDistribution(clients: StandardClient[]) {
  // Group clients by state
  const clientsByState = clients.reduce((acc, client) => {
    const stateCode = client.stateCode || 'Unknown';
    if (!acc[stateCode]) {
      acc[stateCode] = [];
    }
    acc[stateCode].push(client);
    return acc;
  }, {} as { [key: string]: StandardClient[] });

  // Calculate state metrics
  const stateMetrics = Object.entries(clientsByState).map(([stateCode, stateClients]) => ({
    stateCode,
    stateName: stateClients[0]?.state || stateCode,
    clientCount: stateClients.length,
    totalAum: stateClients.reduce((sum, c) => sum + c.aum, 0)
  }));

  // Find top states
  const topStateByClients = stateMetrics.reduce((top, state) => 
    state.clientCount > top.clientCount ? state : top, stateMetrics[0] || { stateName: '', clientCount: 0 }
  );

  const topStateByAUM = stateMetrics.reduce((top, state) => 
    state.totalAum > top.totalAum ? state : top, stateMetrics[0] || { stateName: '', totalAum: 0 }
  );

  return {
    topStateByClients: { 
      stateName: topStateByClients.stateName, 
      value: topStateByClients.clientCount, 
      metricLabel: 'clients' as const 
    },
    topStateByAUM: { 
      stateName: topStateByAUM.stateName, 
      value: topStateByAUM.totalAum, 
      metricLabel: 'AUM' as const 
    },
    stateMetrics
  };
}

// Anniversary Clients
export function getAnniversaryClients(clients: StandardClient[]) {
  const today = new Date();
  const currentYear = today.getFullYear();

  return clients
    .filter(client => client.inceptionDate)
    .map(client => {
      const inceptionDate = new Date(client.inceptionDate!);
      const thisYearAnniversary = new Date(currentYear, inceptionDate.getMonth(), inceptionDate.getDate());
      const nextYearAnniversary = new Date(currentYear + 1, inceptionDate.getMonth(), inceptionDate.getDate());
      
      const nextAnniversary = thisYearAnniversary >= today ? thisYearAnniversary : nextYearAnniversary;
      const daysUntil = Math.ceil((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const yearsWithFirm = nextAnniversary.getFullYear() - inceptionDate.getFullYear();

      return {
        id: client.id,
        clientName: getPrettyClientName(client),
        segment: getSegmentName(client.segment),
        nextAnniversaryDate: nextAnniversary.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysUntilNextAnniversary: daysUntil,
        yearsWithFirm,
        advisorName: client.advisor,
        originalStartDate: client.inceptionDate!
      };
    })
    .sort((a, b) => a.daysUntilNextAnniversary - b.daysUntilNextAnniversary);
}

// Segmentation Data
export function calculateSegmentationData(clients: StandardClient[], selectedSegment: string = 'platinum') {
  const segmentColors = {
    platinum: "hsl(222, 47%, 44%)",
    gold: "hsl(216, 65%, 58%)",
    silver: "hsl(210, 55%, 78%)",
    'n/a': "hsl(0, 0%, 60%)"  // Gray for N/A segments
  };

  // Group by segment
  const clientsBySegment = clients.reduce((acc, client) => {
    const segment = client.segment?.toLowerCase() || 'n/a';
    if (!acc[segment]) acc[segment] = [];
    acc[segment].push(client);
    return acc;
  }, {} as { [key: string]: StandardClient[] });

  // Calculate KPIs for selected segment
  const selectedSegmentClients = clientsBySegment[selectedSegment] || [];
  const segmentAUM = selectedSegmentClients.reduce((sum, c) => sum + c.aum, 0);
  const averageAUM = selectedSegmentClients.length > 0 ? segmentAUM / selectedSegmentClients.length : 0;

  // Create donut chart data
  const totalClients = clients.length;
  const donutChartData = Object.entries(clientsBySegment).map(([segment, segmentClients]) => ({
    name: segment,
    count: segmentClients.length,
    percentage: totalClients > 0 ? Math.round((segmentClients.length / totalClients) * 100 * 10) / 10 : 0,
    color: segmentColors[segment as keyof typeof segmentColors] || "hsl(200, 50%, 50%)"
  }));

  return {
    kpis: {
      clientCount: {
        value: selectedSegmentClients.length,
        label: `Number of ${selectedSegment} clients`
      },
      totalAUM: {
        value: formatAUM(segmentAUM),
        label: `Total assets for ${selectedSegment} segment`
      },
      averageClientAUM: {
        value: formatAUM(averageAUM),
        label: `Average for ${selectedSegment} segment`
      },
      currentSegmentFocus: selectedSegment
    },
    donutChartData
  };
} 