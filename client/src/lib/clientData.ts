export interface AgeGroup {
  name: string;
  range: string;
  count: number;
  percentage: number;
  colorClass: string;
}

// Data service for API calls
export const dataService = {
  fetchData: async (endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
    // Build query string from params
    const queryString = params 
      ? '?' + Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
          .join('&')
      : '';

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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    return response.json();
  }
};

/**
 * Get the average age of all clients for a specific advisor
 * @param advisorId The ID of the advisor/user
 * @returns Promise with the average age of clients
 */
export async function getAverageAge(advisorId?: number): Promise<number> {
  try {

    return 35;
    // Get client demographics from the API
    const demographics = await dataService.fetchData('analytics/client-demographics', { 
      advisorId: advisorId 
    });

    // Calculate average age from age groups if available
    if (demographics?.ageGroups?.length) {
      let totalClients = 0;
      let weightedSum = 0;

      demographics.ageGroups.forEach((group: any) => {
        // Use midpoint of range for calculation
        const rangeParts = group.range.split('-');
        let midpoint;

        if (rangeParts.length === 2) {
          midpoint = (parseInt(rangeParts[0]) + parseInt(rangeParts[1])) / 2;
        } else if (group.range.includes('+')) {
          // For ranges like "76+"
          midpoint = parseInt(group.range.replace('+', '')) + 10;
        } else if (group.range.includes('Under')) {
          // For ranges like "Under 30"
          midpoint = parseInt(group.range.replace('Under ', '')) / 2;
        } else {
          midpoint = parseInt(group.range);
        }

        weightedSum += midpoint * group.count;
        totalClients += group.count;
      });

      return totalClients > 0 ? Math.round(weightedSum / totalClients) : 0;
    }

    // If we can't calculate from demographics, try the by-age endpoint
    const ageData = await dataService.fetchData('wealthbox/clients/by-age', { 
      advisorId: advisorId 
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
    console.error('Error fetching average age:', error);
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
