import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for our schema
export const userRoleEnum = pgEnum('user_role', ['global_admin', 'client_admin', 'financial_advisor', 'home_office', 'firm_admin']);

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default('firm'), // 'home_office', 'firm'
  parentId: integer("parent_id").references(() => organizations.id), // For home_office -> firm relationship
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Can be null for OAuth users
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  // Wealthbox Connection
  wealthboxConnected: boolean("wealthbox_connected").default(false),
  wealthboxToken: text("wealthbox_token"),
  wealthboxRefreshToken: text("wealthbox_refresh_token"),
  wealthboxTokenExpiry: timestamp("wealthbox_token_expiry"),
  // Google OAuth fields
  googleId: text("google_id"),
  googleToken: text("google_token"),
  googleRefreshToken: text("google_refresh_token"),
  // Microsoft OAuth fields (for future use)
  microsoftId: text("microsoft_id"),
  microsoftToken: text("microsoft_token"),
  microsoftRefreshToken: text("microsoft_refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  age: integer("age"),
  aum: integer("aum"), // Assets Under Management in cents
  revenue: integer("revenue"), // Revenue in cents
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  advisorId: integer("advisor_id").references(() => users.id),
  wealthboxClientId: text("wealthbox_client_id"),
  metadata: jsonb("metadata"), // Additional client data from WealthBox
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, call, meeting, etc.
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  advisorId: integer("advisor_id").references(() => users.id).notNull(),
  wealthboxActivityId: text("wealthbox_activity_id"),
  metadata: jsonb("metadata"), // Additional activity data from WealthBox
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio table
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  advisorId: integer("advisor_id").references(() => users.id).notNull(),
  totalValue: integer("total_value").notNull(), // in cents
  wealthboxPortfolioId: text("wealthbox_portfolio_id"),
  metadata: jsonb("metadata"), // Additional portfolio data from WealthBox
  createdAt: timestamp("created_at").defaultNow(),
});

// Holdings table
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  assetClass: text("asset_class").notNull(), // equities, fixed income, alternatives, cash
  name: text("name").notNull(),
  value: integer("value").notNull(), // in cents
  allocation: integer("allocation").notNull(), // percentage x 100 (e.g. 10.5% = 1050)
  performance: integer("performance").notNull(), // percentage x 100 (e.g. 5.2% = 520)
  portfolioId: integer("portfolio_id").references(() => portfolios.id).notNull(),
  wealthboxHoldingId: text("wealthbox_holding_id"),
  metadata: jsonb("metadata"), // Additional holding data from WealthBox
  createdAt: timestamp("created_at").defaultNow(),
});

// Data Mapping table
export const dataMappings = pgTable("data_mappings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sourceField: text("source_field").notNull(),
  targetField: text("target_field").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  wealthboxConnected: true, 
  wealthboxToken: true, 
  wealthboxRefreshToken: true, 
  wealthboxTokenExpiry: true,
  googleId: true,
  googleToken: true,
  googleRefreshToken: true,
  microsoftId: true,
  microsoftToken: true,
  microsoftRefreshToken: true
});
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, wealthboxClientId: true, metadata: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true, wealthboxActivityId: true, metadata: true });
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true, createdAt: true, wealthboxPortfolioId: true, metadata: true });
export const insertHoldingSchema = createInsertSchema(holdings).omit({ id: true, createdAt: true, wealthboxHoldingId: true, metadata: true });
export const insertDataMappingSchema = createInsertSchema(dataMappings).omit({ id: true, createdAt: true });

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;

export type DataMapping = typeof dataMappings.$inferSelect;
export type InsertDataMapping = z.infer<typeof insertDataMappingSchema>;

// Extended types for the frontend
export type ClientWithMetrics = Client & {
  activityCount: number;
};

export type ClientDemographics = {
  ageGroups: { range: string; count: number }[];
  stateDistribution: { state: string; count: number; percentage: number }[];
};

export type AdvisorMetrics = {
  totalAum: number;
  totalRevenue: number;
  totalClients: number;
  totalActivities: number;
  assetAllocation: { class: string; value: number; percentage: number }[];
};
