import { Request, Response } from "express";
import { storage } from "./storage";

// In a real implementation, this would use OpenAI or a similar service
// For this MVP, we'll simulate the AI responses

// Simple NLP-like function to extract entities from query
function extractEntities(query: string): { entity: string; value: string }[] {
  const entities: { entity: string; value: string }[] = [];
  
  // Extract state information
  const stateMatch = query.match(/\b(?:in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (stateMatch && stateMatch[1]) {
    entities.push({ entity: "state", value: stateMatch[1] });
  }
  
  // Extract client type
  const clientTypeMatch = query.match(/\b(high-net-worth|high net worth|hnw|big|largest|biggest)\b/);
  if (clientTypeMatch) {
    entities.push({ entity: "clientType", value: "high-net-worth" });
  }
  
  // Extract specific metrics
  if (query.includes("aum") || query.includes("assets under management")) {
    entities.push({ entity: "metric", value: "aum" });
  }
  if (query.includes("revenue")) {
    entities.push({ entity: "metric", value: "revenue" });
  }
  if (query.includes("activities") || query.includes("calls") || query.includes("emails")) {
    entities.push({ entity: "metric", value: "activities" });
  }
  
  return entities;
}

// Function to generate AI response
async function generateResponse(query: string, userId: number): Promise<any> {
  const entities = extractEntities(query);
  
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
  
  // Generate response based on the query
  if (query.toLowerCase().includes("how many") || query.toLowerCase().includes("number of")) {
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
          const formattedAum = (totalHnwAum / 100000000).toFixed(1); // Convert cents to millions
          
          const percentage = ((hnwClients.length / clients.filter(c => (c.aum || 0) >= 100000000).length) * 100).toFixed(0);
          
          response.text += ` They represent:
- ${percentage}% of your total high-net-worth clients
- $${formattedAum}M total assets under management`;
        }
        
        response.data.hnwClientCount = hnwClients.length;
        response.data.totalAum = hnwClients.reduce((sum, c) => sum + (c.aum || 0), 0);
      }
    } else {
      response = {
        text: `You have ${clients.length} total clients.`,
        data: {
          clientCount: clients.length
        }
      };
    }
  } else if (query.toLowerCase().includes("biggest") || query.toLowerCase().includes("largest")) {
    if (state) {
      // Sort clients by AUM
      const sortedClients = [...stateClients].sort((a, b) => (b.aum || 0) - (a.aum || 0));
      
      if (sortedClients.length > 0) {
        const topClient = sortedClients[0];
        const formattedAum = ((topClient.aum || 0) / 100000000).toFixed(1); // Convert cents to millions
        
        response = {
          text: `Your biggest client in ${state} is ${topClient.name} with $${formattedAum}M in assets under management.`,
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
        const formattedAum = ((topClient.aum || 0) / 100000000).toFixed(1); // Convert cents to millions
        
        response = {
          text: `Your biggest client overall is ${topClient.name} with $${formattedAum}M in assets under management.`,
          data: {
            client: topClient
          }
        };
      }
    }
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
