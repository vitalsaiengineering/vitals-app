/**
 * Demo analytics data generator
 * Provides realistic financial analytics data based on seeded demo data
 */
import { db } from '../shared/db';
import { 
  users, clients, portfolios, assets,
  clientAdvisorRelationships
} from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isDemoMode } from './demo-data';

/**
 * Get metrics for a specific advisor or for the demo user
 */
export async function getDemoAdvisorMetrics(advisorId: number) {
  try {
    if (!isDemoMode) {
      throw new Error('Demo mode is not enabled');
    }

    // Get advisor's clients
    const advisorClients = await db.select({
      id: clients.id
    })
    .from(clients)
    .where(eq(clients.primaryAdvisorId, advisorId));

    const clientIds = advisorClients.map(c => c.id);
    
    if (clientIds.length === 0) {
      return {
        totalAum: 0,
        totalRevenue: 0,
        totalClients: 0,
        totalActivities: 0,
        assetAllocation: []
      };
    }

    // Get total AUM for advisor's clients
    const clientPortfolios = await db.select({
      id: portfolios.id,
      clientId: portfolios.clientId
    })
    .from(portfolios)
    .where(sql`${portfolios.clientId} IN (${clientIds.join(',')})`);

    const portfolioIds = clientPortfolios.map(p => p.id);

    // Calculate AUM and asset allocation
    let totalAum = 0;
    const assetAllocationMap = {
      'Equity': 0,
      'Fixed Income': 0,
      'Alternative': 0,
      'Cash': 0
    };
    
    if (portfolioIds.length > 0) {
      const assetValues = await db.select({
        assetType: assets.assetType,
        marketValue: assets.marketValue
      })
      .from(assets)
      .where(sql`${assets.portfolioId} IN (${portfolioIds.join(',')})`);
      
      for (const asset of assetValues) {
        const marketValue = parseFloat(asset.marketValue);
        totalAum += marketValue;
        
        // Add to the appropriate asset class
        if (asset.assetType === 'Equity') {
          assetAllocationMap['Equity'] += marketValue;
        } else if (asset.assetType === 'Fixed Income') {
          assetAllocationMap['Fixed Income'] += marketValue;
        } else if (asset.assetType === 'Alternative') {
          assetAllocationMap['Alternative'] += marketValue;
        } else if (asset.assetType === 'Cash') {
          assetAllocationMap['Cash'] += marketValue;
        }
      }
    }

    // Calculate percentages for asset allocation
    const assetAllocation = Object.entries(assetAllocationMap).map(([className, value]) => ({
      class: className,
      value: value,
      percentage: totalAum > 0 ? (value / totalAum) * 100 : 0
    }));

    // Calculate revenue (simplified - 1% of AUM)
    const totalRevenue = totalAum * 0.01;
    
    // Return metrics
    return {
      totalAum,
      totalRevenue,
      totalClients: clientIds.length,
      totalActivities: Math.floor(clientIds.length * 3.7), // Average 3.7 activities per client
      assetAllocation
    };
  } catch (error) {
    console.error('Error getting demo advisor metrics:', error);
    throw error;
  }
}

/**
 * Get client demographics for a specific advisor or for the demo user
 */
export async function getDemoClientDemographics(advisorId: number) {
  try {
    if (!isDemoMode) {
      throw new Error('Demo mode is not enabled');
    }

    // Get advisor's clients
    const advisorClients = await db.select({
      id: clients.id,
      contactInfo: clients.contactInfo
    })
    .from(clients)
    .where(eq(clients.primaryAdvisorId, advisorId));

    if (advisorClients.length === 0) {
      return {
        ageGroups: [],
        stateDistribution: []
      };
    }

    // Calculate age distribution (using dummy ages since we don't store birthdates)
    const ageGroups = [
      { range: '18-30', count: 0 },
      { range: '31-40', count: 0 },
      { range: '41-50', count: 0 },
      { range: '51-60', count: 0 },
      { range: '61-70', count: 0 },
      { range: '71+', count: 0 }
    ];

    // Calculate state distribution
    const stateMap: Record<string, number> = {};
    
    for (const client of advisorClients) {
      // Randomly assign to age groups based on position in list
      // This ensures consistent distribution across different loads
      const index = client.id % 6;
      ageGroups[index].count++;
      
      // Extract state from contact info if available
      const contactInfo = client.contactInfo as any;
      if (contactInfo && contactInfo.address && contactInfo.address.state) {
        const state = contactInfo.address.state;
        stateMap[state] = (stateMap[state] || 0) + 1;
      }
    }

    // Convert state map to expected format
    const stateTotal = Object.values(stateMap).reduce((sum, count) => sum + count, 0);
    const stateDistribution = Object.entries(stateMap).map(([state, count]) => ({
      state,
      count,
      percentage: stateTotal > 0 ? (count / stateTotal) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);

    return {
      ageGroups,
      stateDistribution
    };
  } catch (error) {
    console.error('Error getting demo client demographics:', error);
    throw error;
  }
}