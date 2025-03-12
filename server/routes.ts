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
  app.get("/api/users", requireRole(["global_admin", "client_admin"]), async (req, res) => {
    const user = req.user as any;
    let users;
    
    if (user.role === "global_admin") {
      users = await storage.getUsersByOrganization(user.organizationId);
    } else {
      users = await storage.getUsersByOrganization(user.organizationId);
      // Filter out global_admin users for client_admin
      users = users.filter(u => u.role !== "global_admin");
    }
    
    res.json(users);
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

  app.post("/api/organizations", requireRole(["global_admin"]), async (req, res) => {
    try {
      const newOrg = await storage.createOrganization(req.body);
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

  // Data Mapping routes
  app.get("/api/mappings", requireRole(["financial_advisor"]), async (req, res) => {
    const user = req.user as any;
    const mappings = await storage.getDataMappings(user.id);
    res.json(mappings);
  });

  app.post("/api/mappings", requireRole(["financial_advisor"]), async (req, res) => {
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

  app.delete("/api/mappings/:id", requireRole(["financial_advisor"]), async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteDataMapping(id);
    res.status(204).send();
  });

  // Analytics routes
  app.get("/api/analytics/advisor-metrics", requireRole(["financial_advisor"]), async (req, res) => {
    const user = req.user as any;
    const metrics = await storage.getAdvisorMetrics(user.id);
    res.json(metrics);
  });

  app.get("/api/analytics/client-demographics", requireRole(["financial_advisor"]), async (req, res) => {
    const user = req.user as any;
    const demographics = await storage.getClientDemographics(user.id);
    res.json(demographics);
  });

  // AI query route
  app.post("/api/ai/query", requireAuth, aiQueryHandler);
  
  // Wealthbox integration routes
  app.post("/api/wealthbox/test-connection", requireAuth, testWealthboxConnectionHandler);
  app.post("/api/wealthbox/import-data", requireAuth, importWealthboxDataHandler);

  const httpServer = createServer(app);
  return httpServer;
}
