import type { Express } from "express";
import { storage } from "./storage";

// Mock OAuth configuration for WealthBox
// In a real implementation, you would use proper OAuth libraries and configure with real client credentials
const WEALTHBOX_CLIENT_ID = process.env.WEALTHBOX_CLIENT_ID || "mock_client_id";
const WEALTHBOX_CLIENT_SECRET = process.env.WEALTHBOX_CLIENT_SECRET || "mock_client_secret";
const WEALTHBOX_REDIRECT_URI = process.env.WEALTHBOX_REDIRECT_URI || "http://localhost:5000/api/wealthbox/callback";
const WEALTHBOX_AUTH_URL = "https://api.wealthbox.com/oauth/authorize";
const WEALTHBOX_TOKEN_URL = "https://api.wealthbox.com/oauth/token";

export function setupWealthboxOAuth(app: Express) {
  // Initiate OAuth flow
  app.get("/api/wealthbox/auth", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Create URL for WealthBox OAuth authorization
    const authUrl = `${WEALTHBOX_AUTH_URL}?` + 
      `client_id=${WEALTHBOX_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(WEALTHBOX_REDIRECT_URI)}&` +
      `response_type=code&` +
      `state=${req.user!.id}`;
    
    res.json({ authUrl });
  });

  // OAuth callback endpoint
  app.get("/api/wealthbox/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ message: "Invalid callback parameters" });
    }
    
    try {
      const userId = parseInt(state as string);
      
      // In a real implementation, you would make an actual API call to exchange the code for a token
      // For this MVP, we'll simulate the token response
      
      // Mock token response
      const tokenResponse = {
        access_token: "mock_access_token_" + Date.now(),
        refresh_token: "mock_refresh_token_" + Date.now(),
        expires_in: 3600 // 1 hour
      };
      
      // Update user with token information
      const expiryDate = new Date(Date.now() + tokenResponse.expires_in * 1000);
      await storage.updateUserWealthboxConnection(
        userId,
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        expiryDate
      );
      
      // In a real implementation, you would redirect to the frontend with success message
      res.redirect('/integrations?status=success');
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      res.redirect('/integrations?status=error');
    }
  });

  // Endpoint to get WealthBox connection status
  app.get("/api/wealthbox/status", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    
    res.json({
      connected: user.wealthboxConnected || false,
      expiresAt: user.wealthboxTokenExpiry
    });
  });

  // Mock endpoint to import data from WealthBox
  app.post("/api/wealthbox/import", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    
    if (!user.wealthboxConnected) {
      return res.status(400).json({ message: "WealthBox not connected" });
    }
    
    try {
      // In a real implementation, you would make actual API calls to WealthBox
      // For this MVP, we'll create mock data
      
      // Generate some sample data for the advisor
      await generateSampleData(user.id, user.organizationId);
      
      res.json({ message: "Data imported successfully" });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Error importing data" });
    }
  });
}

// Function to generate sample data for the advisor
async function generateSampleData(advisorId: number, organizationId: number) {
  // Create clients
  const clientsData = [
    {
      name: "Global Tech Inc.",
      email: "contact@globaltech.com",
      phone: "512-555-1234",
      address: "123 Tech Blvd",
      city: "Austin",
      state: "TX",
      zip: "78701",
      age: 0, // Company, not a person
      aum: 920000000, // $9.2M in cents
      revenue: 14500000, // $145K in cents
      organizationId,
      advisorId,
      wealthboxClientId: "wx_" + Date.now() + "_1",
      metadata: { type: "corporation", industry: "technology" }
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "415-555-6789",
      address: "456 Financial St",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      age: 45,
      aum: 650000000, // $6.5M in cents
      revenue: 9750000, // $97.5K in cents
      organizationId,
      advisorId,
      wealthboxClientId: "wx_" + Date.now() + "_2",
      metadata: { type: "individual", occupation: "CEO" }
    },
    {
      name: "Robert Johnson",
      email: "robert@example.com",
      phone: "214-555-4321",
      address: "789 Wealth Ave",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      age: 62,
      aum: 270000000, // $2.7M in cents
      revenue: 4050000, // $40.5K in cents
      organizationId,
      advisorId,
      wealthboxClientId: "wx_" + Date.now() + "_3",
      metadata: { type: "individual", occupation: "Retired" }
    }
  ];
  
  const clients = [];
  for (const clientData of clientsData) {
    const client = await storage.upsertClientByWealthboxId(clientData.wealthboxClientId!, clientData);
    clients.push(client);
  }
  
  // Create activities for each client
  const activityTypes = ["email", "call", "meeting", "note"];
  
  for (const client of clients) {
    const activityCount = Math.floor(Math.random() * 10) + 5; // 5-15 activities per client
    
    for (let i = 0; i < activityCount; i++) {
      const typeIndex = Math.floor(Math.random() * activityTypes.length);
      const dayOffset = Math.floor(Math.random() * 60); // Activity within last 60 days
      
      const activityData = {
        type: activityTypes[typeIndex],
        title: `${activityTypes[typeIndex].charAt(0).toUpperCase() + activityTypes[typeIndex].slice(1)} with ${client.name}`,
        description: `Sample ${activityTypes[typeIndex]} with client regarding portfolio review`,
        date: new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000),
        clientId: client.id,
        advisorId,
        wealthboxActivityId: "wx_activity_" + Date.now() + "_" + i,
        metadata: { duration: Math.floor(Math.random() * 60) + 15 } // 15-75 minute activity
      };
      
      await storage.upsertActivityByWealthboxId(activityData.wealthboxActivityId, activityData);
    }
    
    // Create portfolio for each client
    const portfolioData = {
      name: `${client.name}'s Portfolio`,
      clientId: client.id,
      advisorId,
      totalValue: client.aum || 0,
      wealthboxPortfolioId: "wx_portfolio_" + Date.now() + "_" + client.id,
      metadata: { risk_profile: ["conservative", "moderate", "aggressive"][Math.floor(Math.random() * 3)] }
    };
    
    const portfolio = await storage.upsertPortfolioByWealthboxId(portfolioData.wealthboxPortfolioId, portfolioData);
    
    // Create holdings for each portfolio
    const assetClasses = ["equities", "fixed income", "alternatives", "cash"];
    const allocations = [45, 30, 15, 10]; // Percentages
    const performances = [820, 250, -130, 30]; // 8.2%, 2.5%, -1.3%, 0.3%
    
    for (let i = 0; i < assetClasses.length; i++) {
      const holdingData = {
        assetClass: assetClasses[i],
        name: `${assetClasses[i].charAt(0).toUpperCase() + assetClasses[i].slice(1)} Fund`,
        value: Math.floor((portfolio.totalValue * allocations[i]) / 100),
        allocation: allocations[i] * 100, // Store as percentage * 100
        performance: performances[i], // Store as percentage * 100
        portfolioId: portfolio.id,
        wealthboxHoldingId: "wx_holding_" + Date.now() + "_" + portfolio.id + "_" + i,
        metadata: { ticker: `${assetClasses[i].substring(0, 3).toUpperCase()}FD` }
      };
      
      await storage.upsertHoldingByWealthboxId(holdingData.wealthboxHoldingId, holdingData);
    }
  }
}
