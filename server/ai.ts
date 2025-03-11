import { Request, Response } from "express";
import { storage } from "./storage";

// Local data processing implementation
// This provides a simple pattern-matching approach for natural language queries

// Function to extract entities from query using regex patterns
function extractEntities(query: string): { entity: string; value: string }[] {
  const entities: { entity: string; value: string }[] = [];
  const normalizedQuery = query.toLowerCase();
  
  // Extract state information
  const stateMatch = query.match(/\b(?:in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (stateMatch && stateMatch[1]) {
    entities.push({ entity: "state", value: stateMatch[1] });
  }
  
  // Extract client type
  const clientTypeMatch = normalizedQuery.match(/\b(high-net-worth|high net worth|hnw|big|largest|biggest|top)\b/);
  if (clientTypeMatch) {
    entities.push({ entity: "clientType", value: "high-net-worth" });
  }
  
  // Extract age group information
  const ageMatch = normalizedQuery.match(/\b(\d+)(?:\s*-\s*(\d+))?\s*(?:year|yr)s?\s*old\b/) || 
                  normalizedQuery.match(/\bage(?:d)?\s+(\d+)(?:\s*-\s*(\d+))?\b/);
  if (ageMatch) {
    if (ageMatch[2]) {
      entities.push({ entity: "ageRange", value: `${ageMatch[1]}-${ageMatch[2]}` });
    } else {
      entities.push({ entity: "age", value: ageMatch[1] });
    }
  }
  
  // Extract specific metrics
  if (normalizedQuery.includes("aum") || normalizedQuery.includes("assets under management") || 
      normalizedQuery.includes("asset") || normalizedQuery.includes("wealth")) {
    entities.push({ entity: "metric", value: "aum" });
  }
  if (normalizedQuery.includes("revenue") || normalizedQuery.includes("income") || 
      normalizedQuery.includes("fees") || normalizedQuery.includes("earning")) {
    entities.push({ entity: "metric", value: "revenue" });
  }
  if (normalizedQuery.includes("activities") || normalizedQuery.includes("calls") || 
      normalizedQuery.includes("emails") || normalizedQuery.includes("meetings") || 
      normalizedQuery.includes("interactions")) {
    entities.push({ entity: "metric", value: "activities" });
  }
  if (normalizedQuery.includes("demographics") || normalizedQuery.includes("age group") || 
      normalizedQuery.includes("distribution")) {
    entities.push({ entity: "metric", value: "demographics" });
  }
  
  // Extract query intent
  if (normalizedQuery.includes("average") || normalizedQuery.includes("mean") || 
      normalizedQuery.includes("median") || normalizedQuery.includes("typical")) {
    entities.push({ entity: "aggregation", value: "average" });
  }
  if (normalizedQuery.includes("total") || normalizedQuery.includes("sum") || 
      normalizedQuery.includes("overall")) {
    entities.push({ entity: "aggregation", value: "total" });
  }
  if (normalizedQuery.includes("top") || normalizedQuery.includes("largest") || 
      normalizedQuery.includes("biggest") || normalizedQuery.includes("highest")) {
    entities.push({ entity: "aggregation", value: "top" });
  }
  
  return entities;
}

// Helper functions for data analysis and formatted output
function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

function calculateAverageAum(clients: any[]): number {
  if (clients.length === 0) return 0;
  const total = clients.reduce((sum, client) => sum + (client.aum || 0), 0);
  return total / clients.length;
}

function calculateAverageRevenue(clients: any[]): number {
  if (clients.length === 0) return 0;
  const total = clients.reduce((sum, client) => sum + (client.revenue || 0), 0);
  return total / clients.length;
}

function calculateAverageAge(clients: any[]): number {
  const clientsWithAge = clients.filter(client => client.age);
  if (clientsWithAge.length === 0) return 0;
  const totalAge = clientsWithAge.reduce((sum, client) => sum + client.age, 0);
  return totalAge / clientsWithAge.length;
}

// Function to generate AI response based on local data analysis
async function generateResponse(query: string, userId: number): Promise<any> {
  const entities = extractEntities(query);
  const normalizedQuery = query.toLowerCase();
  
  // Get user and advisor metrics
  const user = await storage.getUser(userId);
  if (!user) {
    return { error: "User not found" };
  }
  
  const advisorId = user.id;
  const metrics = await storage.getAdvisorMetrics(advisorId);
  const demographics = await storage.getClientDemographics(advisorId);
  const clients = await storage.getClientsByAdvisor(advisorId);
  
  // Extract state if present
  const stateEntity = entities.find(e => e.entity === "state");
  const state = stateEntity?.value;
  
  // Filter clients by state if specified
  const stateClients = state 
    ? clients.filter(c => c.state && c.state.toLowerCase() === state.toLowerCase())
    : clients;
  
  // Basic response
  let response: any = {
    text: "I don't have enough information to answer that question.",
    data: {}
  };
  
  // Handle demographics queries
  if (normalizedQuery.includes("demographics") || normalizedQuery.includes("age distribution")) {
    const topStates = demographics.stateDistribution.slice(0, 3);
    const topAgeGroups = demographics.ageGroups
      .map(group => ({ range: group.range, count: group.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const avgAge = calculateAverageAge(clients);
    
    response = {
      text: `Client Demographics Overview:\n\nAge Distribution: ${topAgeGroups.map(g => `${g.range}: ${g.count} clients`).join(', ')}\n\nAverage client age: ${avgAge.toFixed(1)} years\n\nTop states: ${topStates.map(s => `${s.state} (${s.count})`).join(', ')}`,
      data: {
        demographics: {
          averageAge: avgAge,
          topAgeGroups,
          topStates
        }
      }
    };
    
    return response;
  }
  
  // Handle asset allocation queries
  if (normalizedQuery.includes("asset allocation") || normalizedQuery.includes("portfolio allocation")) {
    const assetAllocation = metrics.assetAllocation;
    
    response = {
      text: `Current Asset Allocation:\n\n${assetAllocation.map(a => `${a.class}: ${a.percentage.toFixed(1)}% (${formatCurrency(a.value)})`).join('\n')}`,
      data: {
        assetAllocation
      }
    };
    
    return response;
  }
  
  // Handle how many/count queries
  if (normalizedQuery.includes("how many") || normalizedQuery.includes("number of") || normalizedQuery.includes("count")) {
    if (state) {
      response = {
        text: `You have ${stateClients.length} clients in ${state}.`,
        data: {
          clientCount: stateClients.length,
          state
        }
      };
      
      // Add additional info if client type is specified
      const clientTypeEntity = entities.find(e => e.entity === "clientType");
      if (clientTypeEntity) {
        const hnwClients = stateClients.filter(c => (c.aum || 0) >= 100000000); // $1M or more
        response.text = `You have ${hnwClients.length} high-net-worth clients (>$1M AUM) in ${state}.`;
        if (hnwClients.length > 0) {
          const totalHnwAum = hnwClients.reduce((sum, c) => sum + (c.aum || 0), 0);
          const formattedAum = formatCurrency(totalHnwAum);
          
          const percentage = ((hnwClients.length / clients.filter(c => (c.aum || 0) >= 100000000).length) * 100).toFixed(0);
          
          response.text += ` They represent:
- ${percentage}% of your total high-net-worth clients
- ${formattedAum} total assets under management`;
        }
        
        response.data.hnwClientCount = hnwClients.length;
        response.data.totalAum = hnwClients.reduce((sum, c) => sum + (c.aum || 0), 0);
      }
    } else {
      const totalClientsText = `You have ${clients.length} total clients.`;
      const totalClientsData = { clientCount: clients.length };
      
      // Check if we're looking for specific metrics
      const metricEntity = entities.find(e => e.entity === "metric");
      if (metricEntity) {
        if (metricEntity.value === "activities") {
          response = {
            text: `You have recorded ${metrics.totalActivities} total client activities.`,
            data: { activityCount: metrics.totalActivities }
          };
        } else {
          response = { text: totalClientsText, data: totalClientsData };
        }
      } else {
        response = { text: totalClientsText, data: totalClientsData };
      }
    }
    
    return response;
  }
  
  // Handle average queries
  const aggregationEntity = entities.find(e => e.entity === "aggregation");
  if (aggregationEntity && aggregationEntity.value === "average") {
    const metricEntity = entities.find(e => e.entity === "metric");
    
    if (metricEntity) {
      if (metricEntity.value === "aum") {
        const avgAum = calculateAverageAum(state ? stateClients : clients);
        response = {
          text: `The average assets under management ${state ? `in ${state} ` : ''}is ${formatCurrency(avgAum)}.`,
          data: { averageAum: avgAum, state }
        };
      } else if (metricEntity.value === "revenue") {
        const avgRevenue = calculateAverageRevenue(state ? stateClients : clients);
        response = {
          text: `The average revenue per client ${state ? `in ${state} ` : ''}is ${formatCurrency(avgRevenue)}.`,
          data: { averageRevenue: avgRevenue, state }
        };
      } else if (metricEntity.value === "activities") {
        const avgActivities = metrics.totalActivities / clients.length;
        response = {
          text: `The average number of activities per client is ${avgActivities.toFixed(1)}.`,
          data: { averageActivities: avgActivities }
        };
      }
    } else {
      // Default to average AUM if no specific metric mentioned
      const avgAum = calculateAverageAum(state ? stateClients : clients);
      response = {
        text: `The average assets under management ${state ? `in ${state} ` : ''}is ${formatCurrency(avgAum)}.`,
        data: { averageAum: avgAum, state }
      };
    }
    
    return response;
  }
  
  // Handle top/largest queries
  if (normalizedQuery.includes("biggest") || normalizedQuery.includes("largest") || 
      normalizedQuery.includes("top") || 
      (aggregationEntity && aggregationEntity.value === "top")) {
    
    if (state) {
      // Sort clients by AUM
      const sortedClients = [...stateClients].sort((a, b) => (b.aum || 0) - (a.aum || 0));
      
      if (sortedClients.length > 0) {
        const topClient = sortedClients[0];
        const formattedAum = formatCurrency(topClient.aum || 0);
        
        response = {
          text: `Your biggest client in ${state} is ${topClient.name} with ${formattedAum} in assets under management.`,
          data: {
            client: topClient,
            state
          }
        };
      } else {
        response = {
          text: `You don't have any clients in ${state}.`,
          data: {
            state
          }
        };
      }
    } else {
      // Sort all clients by AUM
      const sortedClients = [...clients].sort((a, b) => (b.aum || 0) - (a.aum || 0));
      
      if (sortedClients.length > 0) {
        const topClient = sortedClients[0];
        const formattedAum = formatCurrency(topClient.aum || 0);
        
        response = {
          text: `Your biggest client overall is ${topClient.name} with ${formattedAum} in assets under management.`,
          data: {
            client: topClient
          }
        };
        
        // Provide additional top clients if requested
        if (normalizedQuery.includes("top clients") || normalizedQuery.includes("largest clients")) {
          const top5Clients = sortedClients.slice(0, 5);
          const top5Text = top5Clients.map((client, index) => 
            `${index + 1}. ${client.name}: ${formatCurrency(client.aum || 0)}`
          ).join('\n');
          
          response.text = `Your top 5 clients by assets under management:\n\n${top5Text}`;
          response.data.topClients = top5Clients;
        }
      }
    }
    
    return response;
  }
  
  // Handle total/sum queries
  if (aggregationEntity && aggregationEntity.value === "total") {
    const metricEntity = entities.find(e => e.entity === "metric");
    
    if (metricEntity) {
      if (metricEntity.value === "aum") {
        const totalAum = state 
          ? stateClients.reduce((sum, c) => sum + (c.aum || 0), 0)
          : metrics.totalAum;
        
        response = {
          text: `Total assets under management ${state ? `in ${state}` : ''}: ${formatCurrency(totalAum)}`,
          data: { totalAum, state }
        };
      } else if (metricEntity.value === "revenue") {
        const totalRevenue = state
          ? stateClients.reduce((sum, c) => sum + (c.revenue || 0), 0)
          : metrics.totalRevenue;
        
        response = {
          text: `Total revenue ${state ? `from clients in ${state}` : ''}: ${formatCurrency(totalRevenue)}`,
          data: { totalRevenue, state }
        };
      }
    } else {
      // Default to showing total AUM and revenue
      response = {
        text: `Portfolio Summary:\n\nTotal AUM: ${formatCurrency(metrics.totalAum)}\nTotal Revenue: ${formatCurrency(metrics.totalRevenue)}\nTotal Clients: ${metrics.totalClients}\nTotal Activities: ${metrics.totalActivities}`,
        data: metrics
      };
    }
    
    return response;
  }
  
  return response;
}

export async function aiQueryHandler(req: Request, res: Response) {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }
  
  try {
    const user = req.user as any;
    const response = await generateResponse(query, user.id);
    res.json(response);
  } catch (error: any) {
    console.error("AI query error:", error);
    res.status(500).json({ message: "Error processing query" });
  }
}
