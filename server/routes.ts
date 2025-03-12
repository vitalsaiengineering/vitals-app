import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertClientSchema, insertDataMappingSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { setupWealthboxOAuth } from "./oauth";
import { aiQueryHandler } from "./ai";
import { setupAuth } from "./auth";
import { testWealthboxConnectionHandler, importWealthboxDataHandler } from "./wealthbox";
import { getOpportunitiesByPipelineHandler, getOpportunityStagesHandler } from "./opportunities";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Setup session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(
    session({
      secret: process.env.AUTH_SECRET || "your-secret-key", // Use environment variable if available
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Setup Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for Passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (user.password !== password) {
          // In a real app, you would use bcrypt to compare hashed passwords
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Setup OAuth routes
  setupWealthboxOAuth(app);
  
  // Setup Google OAuth
  setupAuth(app);

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    };
  };
  
  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    res.json(req.user);
  });

  // User routes
  app.get("/api/users", requireRole(["global_admin", "client_admin", "home_office", "firm_admin"]), async (req, res) => {
    const user = req.user as any;
    let users;
    
    if (user.role === "global_admin") {
      users = await storage.getUsersByOrganization(user.organizationId);
    } else if (user.role === "home_office") {
      // Home office can see users from all firms under them
      users = await storage.getUsersByHomeOffice(user.organizationId);
    } else {
      users = await storage.getUsersByOrganization(user.organizationId);
      // Filter out global_admin users for client_admin and firm_admin
      users = users.filter(u => u.role !== "global_admin");
    }
    
    res.json(users);
  });
  
  // Get financial advisors (filtered by firm if specified)
  app.get("/api/users/advisors", requireRole(["home_office", "firm_admin", "client_admin"]), async (req, res) => {
    const user = req.user as any;
    const firmId = req.query.firmId ? parseInt(req.query.firmId as string) : null;
    
    let advisors;
    
    if (user.role === "home_office" && firmId) {
      // Get advisors for a specific firm under this home office
      advisors = await storage.getAdvisorsByFirm(firmId);
    } else if (user.role === "home_office") {
      // Get all advisors across all firms under this home office
      advisors = await storage.getAdvisorsByHomeOffice(user.organizationId);
    } else {
      // Firm admin or client admin - get advisors in their organization
      advisors = await storage.getUsersByRoleAndOrganization("financial_advisor", user.organizationId);
      console.log(`Found ${advisors.length} advisors for ${user.username} in organization ${user.organizationId}`);
    }
    
    res.json(advisors);
  });

  app.post("/api/users", requireRole(["global_admin", "client_admin"]), async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Client admin can only create financial advisors for their org
      if (user.role === "client_admin") {
        if (validatedData.role !== "financial_advisor") {
          return res.status(403).json({ message: "Client admins can only create financial advisor users" });
        }
        validatedData.organizationId = user.organizationId;
      }
      
      const newUser = await storage.createUser(validatedData);
      res.status(201).json(newUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Organization routes
  app.get("/api/organizations", requireRole(["global_admin"]), async (req, res) => {
    const organizations = await storage.getOrganizations();
    res.json(organizations);
  });

  app.get("/api/organizations/firms", requireRole(["home_office", "global_admin"]), async (req, res) => {
    const user = req.user as any;
    let firms;
    
    if (user.role === "home_office") {
      // Get all firms associated with this home office organization
      firms = await storage.getFirmsByHomeOffice(user.organizationId);
    } else {
      // Global admin can see all firms
      firms = await storage.getOrganizationsByType("firm");
    }
    
    res.json(firms);
  });

  app.post("/api/organizations", requireRole(["global_admin", "home_office"]), async (req, res) => {
    try {
      const user = req.user as any;
      const orgData = req.body;
      
      // If home_office user is creating a firm, set parent ID
      if (user.role === "home_office" && orgData.type === "firm") {
        orgData.parentId = user.organizationId;
      }
      
      const newOrg = await storage.createOrganization(orgData);
      res.status(201).json(newOrg);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Client routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    const user = req.user as any;
    let clients;
    
    if (user.role === "financial_advisor") {
      clients = await storage.getClientsByAdvisor(user.id);
    } else {
      clients = await storage.getClientsByOrganization(user.organizationId);
    }
    
    res.json(clients);
  });

  app.post("/api/clients", requireRole(["financial_advisor", "client_admin"]), async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertClientSchema.parse(req.body);
      
      // Set organization and advisor ID based on the user
      validatedData.organizationId = user.organizationId;
      if (user.role === "financial_advisor") {
        validatedData.advisorId = user.id;
      }
      
      const newClient = await storage.createClient(validatedData);
      res.status(201).json(newClient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Data Mapping routes - client_admin and financial_advisor users can access
  app.get("/api/mappings", requireRole(["client_admin", "financial_advisor"]), async (req, res) => {
    const user = req.user as any;
    const mappings = await storage.getDataMappings(user.id);
    res.json(mappings);
  });

  app.post("/api/mappings", requireRole(["client_admin", "financial_advisor"]), async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertDataMappingSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const newMapping = await storage.createDataMapping(validatedData);
      res.status(201).json(newMapping);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/mappings/:id", requireRole(["client_admin", "financial_advisor"]), async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteDataMapping(id);
    res.status(204).send();
  });

  // Analytics routes
  app.get("/api/analytics/advisor-metrics", requireAuth, async (req, res) => {
    const user = req.user as any;
    const firmId = req.query.firmId ? parseInt(req.query.firmId as string) : null;
    const advisorId = req.query.advisorId ? parseInt(req.query.advisorId as string) : null;
    
    try {
      let metrics;
      
      // If specific advisor is selected, show their metrics
      if (advisorId) {
        metrics = await storage.getAdvisorMetrics(advisorId);
      } 
      // If firm is selected but no specific advisor, aggregate metrics for all advisors in the firm
      else if (firmId) {
        // Get all advisors in the firm
        const advisors = await storage.getAdvisorsByFirm(firmId);
        
        // Placeholder for aggregated metrics
        let totalAum = 0;
        let totalRevenue = 0;
        let totalClients = 0;
        let totalActivities = 0;
        let assetAllocation = {
          Equities: 0,
          "Fixed Income": 0,
          Alternatives: 0,
          Cash: 0
        };
        
        // Sum up metrics for all advisors
        for (const advisor of advisors) {
          const advisorMetrics = await storage.getAdvisorMetrics(advisor.id);
          totalAum += advisorMetrics.totalAum;
          totalRevenue += advisorMetrics.totalRevenue;
          totalClients += advisorMetrics.totalClients;
          totalActivities += advisorMetrics.totalActivities;
          
          // Add asset allocations
          advisorMetrics.assetAllocation.forEach(asset => {
            const className = asset.class;
            if (className === "Equities") {
              assetAllocation.Equities += asset.value;
            } else if (className === "Fixed Income") {
              assetAllocation["Fixed Income"] += asset.value;
            } else if (className === "Alternatives") {
              assetAllocation.Alternatives += asset.value;
            } else if (className === "Cash") {
              assetAllocation.Cash += asset.value;
            }
          });
        }
        
        // Calculate percentages for asset allocation
        const assetAllocationArray = Object.entries(assetAllocation).map(([className, value]) => ({
          class: className,
          value: value,
          percentage: totalAum > 0 ? (value / totalAum) * 100 : 0
        }));
        
        metrics = {
          totalAum,
          totalRevenue,
          totalClients,
          totalActivities,
          assetAllocation: assetAllocationArray
        };
      } 
      // Otherwise, show current user's metrics
      else {
        metrics = await storage.getAdvisorMetrics(user.id);
      }
      
      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: "Could not fetch advisor metrics" });
    }
  });

  app.get("/api/analytics/client-demographics", requireAuth, async (req, res) => {
    const user = req.user as any;
    const firmId = req.query.firmId ? parseInt(req.query.firmId as string) : null;
    const advisorId = req.query.advisorId ? parseInt(req.query.advisorId as string) : null;
    
    try {
      let demographics;
      
      // If specific advisor is selected, show their client demographics
      if (advisorId) {
        demographics = await storage.getClientDemographics(advisorId);
      } 
      // Otherwise, show current user's demographics or aggregated firm demographics
      else if (firmId) {
        // Get all advisors in the firm
        const advisors = await storage.getAdvisorsByFirm(firmId);
        
        // Placeholder for aggregated age groups and state distribution
        const ageGroups: Record<string, number> = {};
        const stateDistribution: Record<string, number> = {};
        let totalClients = 0;
        
        // Aggregate demographics data
        for (const advisor of advisors) {
          const advisorDemographics = await storage.getClientDemographics(advisor.id);
          
          // Aggregate age groups
          advisorDemographics.ageGroups.forEach(group => {
            if (!ageGroups[group.range]) {
              ageGroups[group.range] = 0;
            }
            ageGroups[group.range] += group.count;
            totalClients += group.count;
          });
          
          // Aggregate state distribution
          advisorDemographics.stateDistribution.forEach(state => {
            if (!stateDistribution[state.state]) {
              stateDistribution[state.state] = 0;
            }
            stateDistribution[state.state] += state.count;
          });
        }
        
        // Format the aggregated data
        const formattedAgeGroups = Object.entries(ageGroups).map(([range, count]) => ({
          range,
          count: count as number
        }));
        
        const formattedStateDistribution = Object.entries(stateDistribution).map(([state, count]) => ({
          state,
          count: count as number,
          percentage: totalClients > 0 ? ((count as number) / totalClients) * 100 : 0
        }));
        
        demographics = {
          ageGroups: formattedAgeGroups,
          stateDistribution: formattedStateDistribution
        };
      } 
      // Show current user's demographics
      else {
        demographics = await storage.getClientDemographics(user.id);
      }
      
      res.json(demographics);
    } catch (err) {
      res.status(500).json({ error: "Could not fetch client demographics" });
    }
  });

  // AI query route
  app.post("/api/ai/query", requireAuth, aiQueryHandler);
  
  // Wealthbox integration routes - client_admin and financial_advisor users can access
  app.post("/api/wealthbox/test-connection", requireRole(["client_admin", "financial_advisor"]), testWealthboxConnectionHandler);
  app.post("/api/wealthbox/import-data", requireRole(["client_admin", "financial_advisor"]), importWealthboxDataHandler);
  app.get("/api/wealthbox/status", requireAuth, (req, res) => {
    const user = req.user as any;
    
    // Check if user is authorized to see Wealthbox status
    const isAuthorized = user.role === "client_admin" || user.role === "financial_advisor";
    
    res.json({ 
      connected: isAuthorized && user?.wealthboxConnected || false,
      tokenExpiry: isAuthorized && user?.wealthboxTokenExpiry || null,
      authorized: isAuthorized
    });
  });
  
  // Wealthbox Opportunities routes - Direct token-based access for dashboard widget
  app.get("/api/wealthbox/opportunities/by-pipeline", getOpportunitiesByPipelineHandler);
  app.get("/api/wealthbox/opportunities/by-stage", getOpportunityStagesHandler);

  const httpServer = createServer(app);
  return httpServer;
}
