import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClientSchema,
  insertDataMappingSchema,
} from "@shared/schema";

import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { setupWealthboxOAuth } from "./oauth";
import { aiQueryHandler } from "./ai";
import { setupAuth } from "./auth";
import {
  testWealthboxConnectionHandler,
  importWealthboxDataHandler,
  getWealthboxUsersHandler,
  getActiveClientsByStateHandler,
  getActiveClientsByAgeHandler,
  getWealthboxUsers
} from "./wealthbox";
import {
  setupOrionConnectionHandler,
  testOrionConnectionHandler,
  getOrionStatusHandler,
  syncOrionClientsHandler,
  syncOrionAccountsHandler,
  syncOrionAumHistoryHandler,
  getOrionAumTimeSeriesHandler,
  getOrionSyncJobStatusHandler,
  getUserOrionSyncJobsHandler,
  getOrionAumChartDataHandler
} from "./orion";
import {
  getDataMappingsHandler,
  saveDataMappingsHandler
} from "./api/data-mapping";
import { synchronizeWealthboxData } from "./sync-service";
import {
  getOpportunitiesByPipelineHandler,
  getOpportunityStagesHandler,
} from "./opportunities";
import { getWealthboxTokenHandler } from "./api/wealthbox-token";
import { getWealthboxToken } from "./utils/wealthbox-token";

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { isDemoMode } from "./demo-data";
import {
  getDemoAdvisorMetrics,
  getDemoClientDemographics,
} from "./demo-analytics";
// Load environment variables
dotenv.config();

const WEALTHBOX_CLIENT_ID = process.env.WEALTHBOX_CLIENT_ID || "mock_client_id";
const WEALTHBOX_CLIENT_SECRET =
  process.env.WEALTHBOX_CLIENT_SECRET || "mock_client_secret";
const WEALTHBOX_REDIRECT_URI =
  process.env.WEALTHBOX_REDIRECT_URI ||
  "http://localhost:5000/api/wealthbox/callback";
const WEALTHBOX_AUTH_URL = "https://api.wealthbox.com/oauth/authorize";
const WEALTHBOX_TOKEN_URL = "https://api.wealthbox.com/oauth/token";

// Setup session store
const MemoryStoreSession = MemoryStore(session);

const userFetchQueue: (() => Promise<void>)[] = [];
const processQueue = async () => {
  console.log("processing queue");
  while (userFetchQueue.length > 0) {
    const fetchUserTask = userFetchQueue.shift();
    if (fetchUserTask) {
      try {
        await fetchUserTask();
      } catch (error) {
        console.error("Error processing user fetch task:", error);
      }
    }
  }
};
// Start processing the queue (You might want to set this up elsewhere in your app)
setInterval(processQueue, 10000); // adjust interval as needed

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
    }),
  );

  
  // Setup Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for Passport
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email field for the username
        passwordField: "password", // Use password field for the password
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }

          const validPassword = await bcrypt.compare(
            password,
            user.passwordHash,
          );
          if (!validPassword) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
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
    return async (req: Request, res: Response, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // console.log("req.user",req.user);
      const user = req.user as any;
      let roleName: string;
      if (user.roleId) {
        const role = await storage.getRole(user.roleId);
        // console.log("role",role);
        roleName = role.name;
      }
      // console.log("roleName",roleName);

      if (!roles.includes(roleName)) {
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
      console.log({ validPassword });
      if (!validPassword) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Log the user in via Passport
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res
            .status(500)
            .json({ message: "Failed to establish session" });
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
    res.json({
      ...req.user,
      role: req?.user?.roleId && storage.getRole(req.user.roleId).name,
    });
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
        name: `${req.body.organizationName}` || "ABD Org", // Create organization name based on user input
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
        status: "active",
      };

      const validatedData = insertUserSchema.parse(userData);
      console.log("validatedData", validatedData);

      // 3. Create the user with the organization context
      const newUser = await storage.createUser(validatedData);

      // Return success with both organization and user info
      return res.status(201).json({
        message: "Account created successfully",
        userId: newUser.id,
        organizationId: newOrg.id,
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(400).json({
        message:
          error instanceof z.ZodError
            ? "Invalid data provided"
            : "Failed to create account",
        details: error instanceof z.ZodError ? error.errors : undefined,
      });
    }
  });

  // User routes
  app.get(
    "/api/users",
    requireRole(["global_admin", "firm_admin", "home_office", "firm_admin"]),
    async (req, res) => {
      const user = req.user as any;
      let users;

      if (user.role === "firm_admin") {
        users = await storage.getUsersByOrganization(user.organizationId);
      } else if (user.role === "home_office") {
        // Home office can see users from all firms under them
        users = await storage.getUsersByHomeOffice(user.organizationId);
      } else {
        users = await storage.getUsersByOrganization(user.organizationId);
        // Filter out global_admin users for firm_admin and firm_admin
        users = users.filter((u) => u.role !== "global_admin");
      }

      res.json(users);
    },
  );

  app.get("/api/roles", requireAuth, async (req, res) =>{
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.get("/api/statuses", requireAuth, async (req, res) =>{
    const statuses = storage.getStatuses();
    res.json(statuses);
  });

  // Get financial advisors (filtered by firm if specified)
  app.get(
    "/api/users/advisors",
    requireRole(["home_office", "firm_admin", "firm_admin"]),
    async (req, res) => {
      const user = req.user as any;
      const firmId = req.query.firmId
        ? parseInt(req.query.firmId as string)
        : null;

      let advisors;

      if (user.role === "home_office" && firmId) {
        // Get advisors for a specific firm under this home office
        advisors = await storage.getAdvisorsByFirm(firmId);
      } else if (user.role === "home_office") {
        // Get all advisors across all firms under this home office
        advisors = await storage.getAdvisorsByHomeOffice(user.organizationId);
      } else {
        // Firm admin or client admin - get advisors in their organization
        advisors = await storage.getUsersByRoleAndOrganization(
          "advisor",
          user.organizationId,
        );
        console.log(
          `Found ${advisors.length} advisors for ${user.username} in organization ${user.organizationId}`,
        );
      }

      res.json(advisors);
    },
  );

  app.post(
    "/api/users",
    requireRole(["global_admin", "firm_admin"]),
    async (req, res) => {
      try {
        const user = req.user as any;
        const validatedData = insertUserSchema.parse(req.body);

        // Check if username or email already exists
        const existingUsername = await storage.getUserByUsername(
          validatedData.username,
        );
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
            return res.status(403).json({
              message: "Client admins can only create financial advisor users",
            });
          }
          validatedData.organizationId = user.organizationId;
        }


        const newUser = await storage.createUser(validatedData);
        res.status(201).json(newUser);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  app.put("/api/users/:id", requireRole(["global_admin", "firm_admin"]), async (req, res) =>
    {
      const user = req.user as any;
      const userId = parseInt(req.params.id);
      const userData = req.body;
      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    }
    );

  // Organization routes
  app.get(
    "/api/organizations",
    requireRole(["global_admin"]),
    async (req, res) => {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    },
  );

  app.get(
    "/api/organizations/firms",
    requireRole(["home_office", "global_admin"]),
    async (req, res) => {
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
    },
  );

  app.post(
    "/api/organizations",
    requireRole(["global_admin", "home_office"]),
    async (req, res) => {
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
    },
  );

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

  app.post(
    "/api/clients",
    requireRole(["advisor", "firm_admin"]),
    async (req, res) => {
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
    },
  );

  // Data Mapping routes - firm_admin and advisor users can access
  app.get(
    "/api/mappings",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      const user = req.user as any;
      const mappings = await storage.getDataMappings(user.id);
      res.json(mappings);
    },
  );

  app.post(
    "/api/mappings",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      try {
        const user = req.user as any;
        const validatedData = insertDataMappingSchema.parse({
          ...req.body,
          userId: user.id,
        });

        const newMapping = await storage.createDataMapping(validatedData);
        res.status(201).json(newMapping);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    },
  );

  app.delete(
    "/api/mappings/:id",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
      const id = parseInt(req.params.id);
      await storage.deleteDataMapping(id);
      res.status(204).send();
    },
  );

  // Analytics routes
  app.get("/api/analytics/advisor-metrics", requireAuth, async (req, res) => {
    const user = req.user as any;
    const firmId = req.query.firmId
      ? parseInt(req.query.firmId as string)
      : null;
    const advisorId = req.query.advisorId
      ? parseInt(req.query.advisorId as string)
      : null;

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
            Cash: 0,
          };

          // Sum up metrics for all advisors
          for (const advisor of advisors) {
            const advisorMetrics = await storage.getAdvisorMetrics(advisor.id);
            totalAum += advisorMetrics.totalAum;
            totalRevenue += advisorMetrics.totalRevenue;
            totalClients += advisorMetrics.totalClients;
            totalActivities += advisorMetrics.totalActivities;

            // Add asset allocations
            advisorMetrics.assetAllocation.forEach((asset) => {
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
          const assetAllocationArray = Object.entries(assetAllocation).map(
            ([className, value]) => ({
              class: className,
              value: value,
              percentage: totalAum > 0 ? (value / totalAum) * 100 : 0,
            }),
          );

          metrics = {
            totalAum,
            totalRevenue,
            totalClients,
            totalActivities,
            assetAllocation: assetAllocationArray,
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

  app.get(
    "/api/analytics/client-demographics",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const firmId = req.query.firmId
        ? parseInt(req.query.firmId as string)
        : null;
      const advisorId = req.query.advisorId
        ? parseInt(req.query.advisorId as string)
        : null;

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
              const advisorDemographics = await storage.getClientDemographics(
                advisor.id,
              );

              // Aggregate age groups
              advisorDemographics.ageGroups.forEach((group) => {
                if (!ageGroups[group.range]) {
                  ageGroups[group.range] = 0;
                }
                ageGroups[group.range] += group.count;
                totalClients += group.count;
              });

              // Aggregate state distribution
              advisorDemographics.stateDistribution.forEach((state) => {
                if (!stateDistribution[state.state]) {
                  stateDistribution[state.state] = 0;
                }
                stateDistribution[state.state] += state.count;
              });
            }

            // Format the aggregated data
            const formattedAgeGroups = Object.entries(ageGroups).map(
              ([range, count]) => ({
                range,
                count: count as number,
              }),
            );

            const formattedStateDistribution = Object.entries(
              stateDistribution,
            ).map(([state, count]) => ({
              state,
              count: count as number,
              percentage:
                totalClients > 0 ? ((count as number) / totalClients) * 100 : 0,
            }));

            demographics = {
              ageGroups: formattedAgeGroups,
              stateDistribution: formattedStateDistribution,
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
    },
  );

  // Save WealthBox configuration
  app.get("/api/wealthbox/auth/setup", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const authUrl = `${WEALTHBOX_AUTH_URL}?client_id=${WEALTHBOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(WEALTHBOX_REDIRECT_URI)}&response_type=code&state=${req.user.id}`;
    res.json({ authUrl });
  });

// Save WealthBox configuration and associated advisor tokens
  app.post("/api/wealthbox/save-config", async (req, res) => {
    try {
      const { accessToken, settings } = req.body;
      const user = req.user as any;
      console.log("Saving Wealthbox configuration for user:", user.id);
      console.log("accessToken:", accessToken);
      console.log("settings:", settings);

      if (!accessToken) {
        return res
          .status(400)
          .json({ success: false, message: "Access token is required" });
      }

      // Test connection before saving
      try {
        const isConnected = await testWealthboxConnectionHandler(req, res);
        console.log("Wealthbox connection status:", isConnected);
        if (!isConnected) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid access token" });
        }
      } catch (error) {
        console.error("Error testing Wealthbox connection:", error);
        if (!res.headersSent) {
          return res
            .status(500)
            .json({
              success: false,
              message: "Failed to test Wealthbox connection",
            });
        }
        return; // Prevent further execution if headers are already sent
      }

      console.log({user});

      const integrationType =
        await storage.getIntegrationTypeByName("wealthbox");
      console.log("integrationType:", integrationType);

      // Get or create firm integration config
      let firmIntegration = await storage.getFirmIntegrationConfigByFirmId(
        user.organizationId,
      );
      console.log("Existing firm integration:", firmIntegration);
      if (!firmIntegration) {
        firmIntegration = await storage.createFirmIntegrationConfig({
          firmId: user.organizationId,
          integrationTypeId: integrationType?.id,
          credentials: { api_key: accessToken },
          settings: settings || { sync_frequency: "daily" },
          status: "active",
        });
        console.log("New firm integration created:", firmIntegration);
      }

      // Update firm integration config
      const updatedFirmIntegration = await storage.updateFirmIntegrationConfig(
        firmIntegration.id,
        {
          id: firmIntegration.id,
          integrationTypeId: integrationType?.id,
          firmId: user.organizationId,
          credentials: { api_key: accessToken },
          settings: settings || { sync_frequency: "daily" },
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      );
      console.log("Updated firm integration:", updatedFirmIntegration);

      // Get or create advisor auth token
      let advisorAuthToken = await storage.getAdvisorAuthTokenByUserId(
        user.id,
        user.organizationId,
      );
      console.log("Existing advisor auth token:", advisorAuthToken);
      if (!advisorAuthToken) {
        advisorAuthToken = await storage.createAdvisorAuthToken({
          advisorId: user.id,
          accessToken: accessToken,
          expiresAt: new Date(),
          firmIntegrationConfigId: updatedFirmIntegration.id,
          refreshToken: null,
          tokenType: null,
          scope: null,
          additionalData: {},
          integrationType: integrationType.id,
        });
        console.log("New advisor auth token created:", advisorAuthToken);
      }

      // Update advisor auth token
      await storage.updateAdvisorAuthToken(advisorAuthToken.id, {
        id: advisorAuthToken.id,
        createdAt: advisorAuthToken.createdAt,
        updatedAt: new Date(),
        firmIntegrationConfigId: updatedFirmIntegration.id,
        advisorId: user.id,
        accessToken: accessToken,
        refreshToken: advisorAuthToken.refreshToken,
        tokenType: advisorAuthToken.tokenType,
        expiresAt: advisorAuthToken.expiresAt,
        scope: advisorAuthToken.scope,
        additionalData: advisorAuthToken.additionalData,
        integrationType: integrationType.id,
      });
      console.log("Updated advisor auth token:", advisorAuthToken);

      // Push task to fetch Wealthbox users to the queue
      userFetchQueue.push(async () => {
        try {
          // console.log("Fetching Wealthbox users for firm:", user.organizationId);
          // try {
            const { users: wealthboxUsersData, success} = await getWealthboxUsers(user.id);

            if (!success) {
              throw new Error("Failed to fetch Wealthbox users");
            }
            console.log("Wealthbox users response:", wealthboxUsersData);
          // } catch (error) {
          //   console.error("Error fetching Wealthbox users:", error);
          //   throw new Error("Failed to fetch Wealthbox users");
          // }


          const saveUsersPromises = await Promise.all(wealthboxUsersData.map(async (wealthboxUser: any) => {
            const existingUser = await storage.getUserByEmail(wealthboxUser.email);
            if (!existingUser) {
              const userData = {
                // id: wealthboxUser.id,
                firstName: wealthboxUser.name.split(' ')[0],
                lastName: wealthboxUser.name.split(' ')[1] || '',
                email: wealthboxUser.email,
                roleId: '5',
                organizationId: user.organizationId,
                status:"inactive",
                wealthboxUserId: wealthboxUser.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              console.log(`Creating user: ${userData.email}`);
              return await storage.createUser(userData); 
            }
            else {
              console.log(`Updating user: ${existingUser.email}`);
              return await storage.updateUser(existingUser.id, {
                wealthboxUserId: wealthboxUser.id,
                firstNmae: wealthboxUser.name.split(' ')[0],
                lastName: wealthboxUser.name.split(' ')[1] || '',
                updatedAt: new Date(),
              });
            }
            return null;
          })).then(results => results.filter(Boolean));
          await Promise.all(saveUsersPromises);
          console.log("Wealthbox users saved successfully.");
        } catch (error) {
          console.error("Error fetching or saving Wealthbox users:", error);
        }
      });

      // Send success response
      return res.json({ success: true, data: updatedFirmIntegration });
    } catch (error: any) {
      console.error("Error saving Wealthbox configuration:", error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to save configuration",
        });
      }
    }
  });

  // async function fetchWealthboxUsers(accessToken: string) {
  //   const wealthboxUsersResponse = await fetch(
  //     `/api/wealthbox/users?access_token=${accessToken}`,
  //   );
  //   if (!wealthboxUsersResponse.ok) {
  //     throw new Error("Failed to fetch Wealthbox users");
  //   }

  //   console.log("Wealthbox users response:", wealthboxUsersResponse);

  //   const wealthboxUsersData = await wealthboxUsersResponse.json();
  //   // Save users to your storage
  //   const saveUsersPromises = wealthboxUsersData.data.users.map(
  //     async (wealthboxUser: any) => {
  //       const userData = {
  //         id: wealthboxUser.id,
  //         name: wealthboxUser.name,
  //         email: wealthboxUser.email,
  //         // Map other properties as necessary
  //       };
  //       return await storage.createUser(userData); // Ensure createUser handles existing users
  //     },
  //   );
  //   await Promise.all(saveUsersPromises);
  //   console.log("Wealthbox users saved successfully.");
  // }

  // AI query route
  app.post("/api/ai/query", requireAuth, aiQueryHandler);

  // Wealthbox integration routes - firm_admin and advisor users can access
  app.post("/api/wealthbox/test-connection", testWealthboxConnectionHandler);
  app.post(
    "/api/wealthbox/import-data",
    requireRole(["firm_admin", "advisor"]),
    importWealthboxDataHandler,
  );
  app.get("/api/wealthbox/token", requireAuth, getWealthboxTokenHandler);
  app.get("/api/data-mappings", requireAuth, getDataMappingsHandler);
  app.post("/api/data-mappings", requireAuth, saveDataMappingsHandler);
  app.get("/api/wealthbox/status", requireAuth, (req, res) => {
    const user = req.user as any;

    // Check if user is authorized to see Wealthbox status
    const isAuthorized = user.role === "firm_admin" || user.role === "advisor";

    // For client admin users, we need to treat them as connected even if they personally don't have tokens
    // This is because they can use WealthBox on behalf of the organization
    const isConnected =
      user.role === "firm_admin" ? true : user?.wealthboxConnected || false;
    const tokenExpiry =
      user.role === "firm_admin"
        ? new Date(Date.now() + 86400000).toISOString()
        : user?.wealthboxTokenExpiry || null;

    res.json({
      connected: isAuthorized && isConnected,
      tokenExpiry: isAuthorized ? tokenExpiry : null,
      authorized: isAuthorized,
    });
  });
  
  // Orion API Routes
  app.get("/api/orion/status", requireAuth, getOrionStatus);
  app.get("/api/orion/token", requireRole(["firm_admin", "advisor"]), getOrionToken);
  app.get("/api/orion/client/:clientId/aum", requireRole(["firm_admin", "advisor"]), getClientAumOverTime);

  // Wealthbox Opportunities routes - Direct token-based access for dashboard widget
  app.get(
    "/api/wealthbox/opportunities/by-pipeline",
    getOpportunitiesByPipelineHandler,
  );
  app.get("/api/wealthbox/opportunities/by-stage", getOpportunityStagesHandler);

  // Wealthbox Clients by State route for geographic distribution
  app.get("/api/wealthbox/clients/by-state", getActiveClientsByStateHandler);

  // Wealthbox Clients by Age route for age distribution
  app.get("/api/wealthbox/clients/by-age", getActiveClientsByAgeHandler);

  // Wealthbox Users route - Direct token-based access for advisors dropdown
  app.get("/api/wealthbox/users", getWealthboxUsersHandler);

  // Orion integration routes - firm_admin and advisor users can access
app.post("/api/orion/setup-connection", setupOrionConnectionHandler);
app.post("/api/orion/test-connection", testOrionConnectionHandler);
app.get("/api/orion/status", requireAuth, getOrionStatusHandler);
app.post("/api/orion/sync-clients", requireAuth, syncOrionClientsHandler);
app.post("/api/orion/sync-accounts", requireAuth, syncOrionAccountsHandler);
app.post("/api/orion/sync-aum-history", requireAuth, syncOrionAumHistoryHandler);
app.get("/api/orion/aum-time-series", requireAuth, getOrionAumTimeSeriesHandler);
app.get("/api/orion/sync-jobs/:jobId", requireAuth, getOrionSyncJobStatusHandler);
app.get("/api/orion/sync-jobs", requireAuth, getUserOrionSyncJobsHandler);
app.get("/api/orion/aum-chart-data", requireAuth, getOrionAumChartDataHandler);

  // Wealthbox sync routes
  app.post(
    "/api/wealthbox/sync",
    requireRole(["firm_admin", "advisor"]),
    async (req, res) => {
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
            message: "Wealthbox access token required",
          });
        }
        console.log("Using configured Wealthbox token for sync");
      }

      // Start synchronization
      try {
        const syncResult = await synchronizeWealthboxData(
          token,
          user.id,
          user.organizationId,
        );

        res.json({
          success: true,
          message: "Synchronization completed",
          contacts: syncResult.results.contacts,
          activities: syncResult.results.activities,
          opportunities: syncResult.results.opportunities,
        });
      } catch (error: any) {
        console.error("Error during synchronization:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          success: false,
          message: "Synchronization failed",
          error: errorMessage,
        });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
