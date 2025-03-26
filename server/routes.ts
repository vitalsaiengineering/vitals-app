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
import { testWealthboxConnectionHandler, importWealthboxDataHandler, getWealthboxUsersHandler, getActiveClientsByStateHandler, getActiveClientsByAgeHandler } from "./wealthbox";
import { synchronizeWealthboxData } from "./sync-service";
import { getOpportunitiesByPipelineHandler, getOpportunityStagesHandler } from "./opportunities";
import { getWealthboxTokenHandler } from "./api/wealthbox-token";
import { getWealthboxToken } from "./utils/wealthbox-token";
import dotenv from "dotenv";
import bcrypt from 'bcrypt';
import { isDemoMode } from './demo-data';
import { getDemoAdvisorMetrics, getDemoClientDemographics } from './demo-analytics';
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
    new LocalStrategy(
      {
        usernameField: 'email',    // Use email field for the username
        passwordField: 'password'  // Use password field for the password
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }
          
          const validPassword = await bcrypt.compare(password, user.passwordHash);
          if (!validPassword) {
            return done(null, false, { message: "Incorrect password" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
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
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Incorrect username" });
      }
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      console.log({validPassword})
      if (!validPassword) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      
      // Log the user in via Passport
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        // Return user without sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.post("/api/signup", async (req, res) => {
    try {
      console.log("req.body", req.body);

      // Check if email already exists first - before creating any resources
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 1. Create an organization first
      const orgData = {
        name: `${req.body.organizationName}`|| "ABD Org", // Create organization name based on user input
        type: "firm" as const, // Set as firm type
        // parentId is optional, can be null by default
      };

      // Create organization in database
      const newOrg = await storage.createOrganization(orgData);
      console.log("Created organization:", newOrg);

      // 2. Now prepare user data with the new organization ID
      const userData = {
        email: req.body.email,
        passwordHash: await bcrypt.hash(req.body.password, 10),
        firstName: req.body.name,
        lastName: "", // Add logic for last name if needed
        roleId: 1, // Firm owner/admin role
        organizationId: newOrg.id, // Use the newly created org ID
        status: "active" 
      };

      const validatedData = insertUserSchema.parse(userData);
      console.log("validatedData", validatedData);

      // 3. Create the user with the organization context
      const newUser = await storage.createUser(validatedData);

      // Return success with both organization and user info
      return res.status(201).json({ 
        message: "Account created successfully", 
        userId: newUser.id,
        organizationId: newOrg.id
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? "Invalid data provided" 
          : "Failed to create account",
        details: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  });

  // User routes
  app.get("/api/users", requireRole(["global_admin", "firm_admin", "home_office", "firm_admin"]), async (req, res) => {
    const user = req.user as any;
    let users;
    
    if (user.role === "global_admin") {
      users = await storage.getUsersByOrganization(user.organizationId);
    } else if (user.role === "home_office") {
      // Home office can see users from all firms under them
      users = await storage.getUsersByHomeOffice(user.organizationId);
    } else {
      users = await storage.getUsersByOrganization(user.organizationId);
      // Filter out global_admin users for firm_admin and firm_admin
      users = users.filter(u => u.role !== "global_admin");
    }
    
    res.json(users);
  });
  
  // Get financial advisors (filtered by firm if specified)
  app.get("/api/users/advisors", requireRole(["home_office", "firm_admin", "firm_admin"]), async (req, res) => {
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
      advisors = await storage.getUsersByRoleAndOrganization("advisor", user.organizationId);
      console.log(`Found ${advisors.length} advisors for ${user.username} in organization ${user.organizationId}`);
    }
    
    res.json(advisors);
  });

  app.post("/api/users", requireRole(["global_admin", "firm_admin"]), async (req, res) => {
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
      if (user.role === "firm_admin") {
        if (validatedData.role !== "advisor") {
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
    
    if (user.role === "advisor") {
      clients = await storage.getClientsByAdvisor(user.id);
    } else {
      clients = await storage.getClientsByOrganization(user.organizationId);
    }
    
    res.json(clients);
  });

  app.post("/api/clients", requireRole(["advisor", "firm_admin"]), async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertClientSchema.parse(req.body);
      
      // Set organization and advisor ID based on the user
      validatedData.organizationId = user.organizationId;
      if (user.role === "advisor") {
        validatedData.advisorId = user.id;
      }
      
      const newClient = await storage.createClient(validatedData);
      res.status(201).json(newClient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Data Mapping routes - firm_admin and advisor users can access
  app.get("/api/mappings", requireRole(["firm_admin", "advisor"]), async (req, res) => {
    const user = req.user as any;
    const mappings = await storage.getDataMappings(user.id);
    res.json(mappings);
  });

  app.post("/api/mappings", requireRole(["firm_admin", "advisor"]), async (req, res) => {
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

  app.delete("/api/mappings/:id", requireRole(["firm_admin", "advisor"]), async (req, res) => {
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
      
      // Use demo data if demo mode is enabled
      if (isDemoMode) {
        const targetAdvisorId = advisorId || user.id;
        metrics = await getDemoAdvisorMetrics(targetAdvisorId);
      } else {
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
      
      // Use demo data if demo mode is enabled
      if (isDemoMode) {
        const targetAdvisorId = advisorId || user.id;
        demographics = await getDemoClientDemographics(targetAdvisorId);
      } else {
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
      }
      
      res.json(demographics);
    } catch (err) {
      res.status(500).json({ error: "Could not fetch client demographics" });
    }
  });

  // Save WealthBox configuration
  app.post("/api/wealthbox/save-config", requireRole(["firm_admin"]), async (req, res) => {
    try {
      const { accessToken, settings } = req.body;
      const user = req.user as any;

      if (!accessToken) {
        return res.status(400).json({ success: false, message: 'Access token is required' });
      }

      // Test connection before saving
      const isConnected = await testWealthboxConnection(accessToken);
      if (!isConnected) {
        return res.status(401).json({ success: false, message: 'Invalid access token' });
      }

      // Save to firm_integration_configs
      const result = await storage.upsertFirmIntegrationConfig({
        integrationTypeId: 1, // WealthBox integration type
        firmId: user.organizationId,
        credentials: { api_key: accessToken },
        settings: settings || { sync_frequency: 'daily' },
        status: 'active'
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error saving WealthBox configuration:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to save configuration' 
      });
    }
  });

  // AI query route
  app.post("/api/ai/query", requireAuth, aiQueryHandler);
  
  // Wealthbox integration routes - firm_admin and advisor users can access
  app.post("/api/wealthbox/test-connection", requireRole(["firm_admin", "advisor"]), testWealthboxConnectionHandler);
  app.post("/api/wealthbox/import-data", requireRole(["firm_admin", "advisor"]), importWealthboxDataHandler);
  app.get("/api/wealthbox/token", requireAuth, getWealthboxTokenHandler);
  app.get("/api/wealthbox/status", requireAuth, (req, res) => {
    const user = req.user as any;
    
    // Check if user is authorized to see Wealthbox status
    const isAuthorized = user.role === "firm_admin" || user.role === "advisor";
    
    // For client admin users, we need to treat them as connected even if they personally don't have tokens
    // This is because they can use WealthBox on behalf of the organization
    const isConnected = user.role === "firm_admin" ? true : (user?.wealthboxConnected || false);
    const tokenExpiry = user.role === "firm_admin" ? new Date(Date.now() + 86400000).toISOString() : (user?.wealthboxTokenExpiry || null);
    
    res.json({ 
      connected: isAuthorized && isConnected,
      tokenExpiry: isAuthorized ? tokenExpiry : null,
      authorized: isAuthorized
    });
  });
  
  // Wealthbox Opportunities routes - Direct token-based access for dashboard widget
  app.get("/api/wealthbox/opportunities/by-pipeline", getOpportunitiesByPipelineHandler);
  app.get("/api/wealthbox/opportunities/by-stage", getOpportunityStagesHandler);
  
  // Wealthbox Clients by State route for geographic distribution
  app.get("/api/wealthbox/clients/by-state", getActiveClientsByStateHandler);
  
  // Wealthbox Clients by Age route for age distribution
  app.get("/api/wealthbox/clients/by-age", getActiveClientsByAgeHandler);
  
  // Wealthbox Users route - Direct token-based access for advisors dropdown
  app.get("/api/wealthbox/users", getWealthboxUsersHandler);
  
  // Wealthbox sync routes
  app.post("/api/wealthbox/sync", requireRole(["firm_admin", "advisor"]), async (req, res) => {
    const user = req.user as any;
    const { accessToken } = req.body;
    
    // Get token from user, request, or default configuration
    let token = accessToken || user.wealthboxToken;
    
    // If no token available, try to get from configuration
    if (!token) {
      token = await getWealthboxToken(user.id);
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Wealthbox access token required" 
        });
      }
      console.log("Using configured Wealthbox token for sync");
    }
    
    // Start synchronization
    try {
      const syncResult = await synchronizeWealthboxData(
        token,
        user.id,
        user.organizationId
      );
      
      res.json({ 
        success: true, 
        message: "Synchronization completed", 
        contacts: syncResult.results.contacts,
        activities: syncResult.results.activities,
        opportunities: syncResult.results.opportunities
      });
    } catch (error: any) {
      console.error("Error during synchronization:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        success: false, 
        message: "Synchronization failed", 
        error: errorMessage
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
