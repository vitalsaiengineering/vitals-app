// schema.ts
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
  json,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const organizationTypeEnum = pgEnum("organization_type", [
  "global",
  "multi_network",
  "network",
  "firm",
]);
export const roleNameEnum = pgEnum("role_name", [
  "global_admin",
  "multi_network_admin",
  "network_admin",
  "firm_admin",
  "advisor",
]);
export const statusEnum = pgEnum("status", [
  "active",
  "inactive",
  "pending",
  "suspended",
]);
export const statusValues = statusEnum.enumValues;


export const accessLevelEnum = pgEnum("access_level", [
  "read",
  "write",
  "admin",
]);

// Tables
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: roleNameEnum("name").notNull(),
  permissions: json("permissions").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizations: any = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: organizationTypeEnum("type").notNull(),
  parentId: integer("parent_id").references((): any => organizations.id),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  status: statusEnum("status").notNull().default("active"),
  wealthboxUserId: varchar("wealthbox_user_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationHierarchy = pgTable("organization_hierarchy", {
  id: serial("id").primaryKey(),
  parentOrgId: integer("parent_org_id")
    .notNull()
    .references(() => organizations.id),
  childOrgId: integer("child_org_id")
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationTypes = pgTable("integration_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  apiVersion: varchar("api_version", { length: 20 }).notNull(),
  endpointBaseUrl: varchar("endpoint_base_url", { length: 255 }).notNull(),
  requiredCredentials: json("required_credentials").notNull(),
  defaultFieldMappings: json("default_field_mappings").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const firmIntegrationConfigs = pgTable("firm_integration_configs", {
  id: serial("id").primaryKey(),
  integrationTypeId: integer("integration_type_id")
    .notNull()
    .references(() => integrationTypes.id),
  firmId: integer("firm_id")
    .notNull()
    .references(() => organizations.id),
  credentials: json("credentials").notNull(),
  settings: json("settings").notNull().default({}),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const firmDataMappings = pgTable("firm_data_mappings", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id")
    .notNull()
    .references(() => organizations.id),
  integrationTypeId: integer("integration_type_id")
    .notNull()
    .references(() => integrationTypes.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  sourceField: varchar("source_field", { length: 100 }).notNull(),
  targetField: varchar("target_field", { length: 100 }).notNull(),
  transformationRule: text("transformation_rule"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const advisorIntegrationAccess = pgTable("advisor_integration_access", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id")
    .notNull()
    .references(() => users.id),
  firmIntegrationConfigId: integer("firm_integration_config_id")
    .notNull()
    .references(() => firmIntegrationConfigs.id),
  canAccess: boolean("can_access").notNull().default(false),
  accessScope: json("access_scope").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationDataStorage = pgTable("integration_data_storage", {
  id: serial("id").primaryKey(),
  firmIntegrationConfigId: integer("firm_integration_config_id")
    .notNull()
    .references(() => firmIntegrationConfigs.id),
  dataType: varchar("data_type", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 100 }),
  rawData: json("raw_data").notNull(),
  mappedData: json("mapped_data").notNull(),
  lastSyncedAt: timestamp("last_synced_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 100 }),
  orionClientId: varchar("orion_client_id", { length: 100 }),
  wealthboxClientId: varchar("wealthbox_client_id", { length: 100 }),
  firmId: integer("firm_id")
    .notNull()
    .references(() => organizations.id),
  primaryAdvisorId: integer("primary_advisor_id").references(() => users.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  age: integer("age"),
  emailAddress: varchar("email_address", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 30 }),
  aum: varchar("aum", { length: 50 }).default("0"), // Using varchar to match DECIMAL(20,2)
  isActive: boolean("is_active").default(true),
  representativeName: varchar("representative_name", { length: 255 }),
  representativeId: integer("representative_id"),
  startDate: timestamp("start_date", { mode: "date" }),
  contactInfo: json("contact_info").notNull().default({}),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: statusEnum("status").notNull().default("active"),
});

export const clientAdvisorRelationships = pgTable(
  "client_advisor_relationships",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id),
    advisorId: integer("advisor_id")
      .notNull()
      .references(() => users.id),
    relationshipType: varchar("relationship_type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 100 }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  name: varchar("name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }),
  accountType: varchar("account_type", { length: 50 }),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  symbol: varchar("symbol", { length: 20 }),
  assetType: varchar("asset_type", { length: 50 }).notNull(),
  quantity: varchar("quantity", { length: 50 }).notNull(),
  marketValue: varchar("market_value", { length: 50 }).notNull(),
  valuationDate: timestamp("valuation_date").notNull(),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dataAccessPolicies = pgTable("data_access_policies", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id),
  dataType: varchar("data_type", { length: 50 }).notNull(),
  accessRules: json("access_rules").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userDataAccess = pgTable("user_data_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  dataAccessPolicyId: integer("data_access_policy_id")
    .notNull()
    .references(() => dataAccessPolicies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const advisorAuthTokens = pgTable("advisor_auth_tokens", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id")
    .notNull()
    .references(() => users.id),
  firmIntegrationConfigId: integer("firm_integration_config_id")
    .references(() => firmIntegrationConfigs.id),
  accessToken: varchar("access_token", { length: 1000 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 1000 }),
  tokenType: varchar("token_type", { length: 50 }).default("Bearer"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scope: varchar("scope", { length: 500 }),
  additionalData: json("additional_data").default({}),
  integrationType: integer("integration_type").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});


export const orionAccountData = pgTable("orion_account_data", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id")
    .references(() => portfolios.id),
  orionAccountId: varchar("orion_account_id", { length: 100 }).notNull(),
  firmIntegrationConfigId: integer("firm_integration_config_id")
    .notNull()
    .references(() => firmIntegrationConfigs.id),
  
  // Core account information from Orion
  name: varchar("name", { length: 255 }),
  number: varchar("number", { length: 100 }),
  accountType: varchar("account_type", { length: 100 }),
  isActive: boolean("is_active").default(true),
  
  // Financial data
  currentValue: varchar("current_value", { length: 50 }), // Using varchar to match decimal precision
  accountStartValue: varchar("account_start_value", { length: 50 }),
  
  // Dates
  accountStartDate: timestamp("account_start_date", { mode: "date" }),
  cancelDate: timestamp("cancel_date", { mode: "date" }),
  
  // Management and custodian information
  custodian: varchar("custodian", { length: 255 }),
  managementStyle: varchar("management_style", { length: 255 }),
  managementStyleId: integer("management_style_id"),
  fundFamily: varchar("fund_family", { length: 255 }),
  fundFamilyId: integer("fund_family_id"),
  registrationId: integer("registration_id"),
  modelName: varchar("model_name", { length: 255 }),
  subAdvisor: varchar("sub_advisor", { length: 255 }),
  
  // Representative information
  representative: varchar("representative", { length: 255 }),
  representativeId: integer("representative_id"),
  
  // Client and household information
  clientIdOrion: integer("client_id_orion"), // Orion's client ID
  household: varchar("household", { length: 255 }),
  
  // JSONB fields for additional data
  rawData: json("raw_data").notNull().default({}),
  mappedData: json("mapped_data").notNull().default({}),
  balanceData: json("balance_data").default({}),
  performanceData: json("performance_data").default({}),
  holdingsData: json("holdings_data").default({}),
  
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orionAumHistory = pgTable("orion_aum_history", {
  internalId: serial("internal_id").primaryKey(),
  orionEntityId: integer("orion_entity_id").notNull(),
  asOfDate: timestamp("as_of_date", { mode: "date" }).notNull(),
  value: varchar("value", { length: 50 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  firmIntegrationConfigId: integer("firm_integration_config_id")
    .notNull()
    .references(() => firmIntegrationConfigs.id),
  rawData: json("raw_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    parent: one(organizations, {
      fields: [organizations.parentId],
      references: [organizations.id],
    }),
    children: many(organizations),
    users: many(users),
    parentInHierarchy: many(organizationHierarchy, {
      relationName: "parentOrgs",
    }),
    childInHierarchy: many(organizationHierarchy, {
      relationName: "childOrgs",
    }),
    firmIntegrationConfigs: many(firmIntegrationConfigs),
    firmDataMappings: many(firmDataMappings),
    clients: many(clients),
    dataAccessPolicies: many(dataAccessPolicies),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  advisorIntegrationAccess: many(advisorIntegrationAccess),
  primaryAdvisorForClients: many(clients, { relationName: "primaryAdvisor" }),
  clientAdvisorRelationships: many(clientAdvisorRelationships, {
    relationName: "advisor",
  }),
  userDataAccess: many(userDataAccess),
}));

export const organizationHierarchyRelations = relations(
  organizationHierarchy,
  ({ one }) => ({
    parentOrg: one(organizations, {
      fields: [organizationHierarchy.parentOrgId],
      references: [organizations.id],
      relationName: "parentOrgs",
    }),
    childOrg: one(organizations, {
      fields: [organizationHierarchy.childOrgId],
      references: [organizations.id],
      relationName: "childOrgs",
    }),
  }),
);

export const integrationTypesRelations = relations(
  integrationTypes,
  ({ many }) => ({
    firmIntegrationConfigs: many(firmIntegrationConfigs),
    firmDataMappings: many(firmDataMappings),
  }),
);

export const firmIntegrationConfigsRelations = relations(
  firmIntegrationConfigs,
  ({ one, many }) => ({
    integrationType: one(integrationTypes, {
      fields: [firmIntegrationConfigs.integrationTypeId],
      references: [integrationTypes.id],
    }),
    firm: one(organizations, {
      fields: [firmIntegrationConfigs.firmId],
      references: [organizations.id],
    }),
    advisorIntegrationAccess: many(advisorIntegrationAccess),
    integrationDataStorage: many(integrationDataStorage),
  }),
);

export const advisorAuthTokensRelations = relations(
  advisorAuthTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [advisorAuthTokens.advisorId],
      references: [users.id],
    }),
    firmIntegrationConfig: one(firmIntegrationConfigs, {
      fields: [advisorAuthTokens.firmIntegrationConfigId],
      references: [firmIntegrationConfigs.id],
    }),
  }),
);

export const firmDataMappingsRelations = relations(
  firmDataMappings,
  ({ one }) => ({
    firm: one(organizations, {
      fields: [firmDataMappings.firmId],
      references: [organizations.id],
    }),
    integrationType: one(integrationTypes, {
      fields: [firmDataMappings.integrationTypeId],
      references: [integrationTypes.id],
    }),
  }),
);

export const advisorIntegrationAccessRelations = relations(
  advisorIntegrationAccess,
  ({ one }) => ({
    advisor: one(users, {
      fields: [advisorIntegrationAccess.advisorId],
      references: [users.id],
    }),
    firmIntegrationConfig: one(firmIntegrationConfigs, {
      fields: [advisorIntegrationAccess.firmIntegrationConfigId],
      references: [firmIntegrationConfigs.id],
    }),
  }),
);

export const integrationDataStorageRelations = relations(
  integrationDataStorage,
  ({ one }) => ({
    firmIntegrationConfig: one(firmIntegrationConfigs, {
      fields: [integrationDataStorage.firmIntegrationConfigId],
      references: [firmIntegrationConfigs.id],
    }),
  }),
);

export const clientsRelations = relations(clients, ({ one, many }) => ({
  firm: one(organizations, {
    fields: [clients.firmId],
    references: [organizations.id],
  }),
  primaryAdvisor: one(users, {
    fields: [clients.primaryAdvisorId],
    references: [users.id],
    relationName: "primaryAdvisor",
  }),
  clientAdvisorRelationships: many(clientAdvisorRelationships),
  portfolios: many(portfolios),
}));

export const clientAdvisorRelationshipsRelations = relations(
  clientAdvisorRelationships,
  ({ one }) => ({
    client: one(clients, {
      fields: [clientAdvisorRelationships.clientId],
      references: [clients.id],
    }),
    advisor: one(users, {
      fields: [clientAdvisorRelationships.advisorId],
      references: [users.id],
      relationName: "advisor",
    }),
  }),
);

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  client: one(clients, {
    fields: [portfolios.clientId],
    references: [clients.id],
  }),
  assets: many(assets),
  orionAccountData: many(orionAccountData),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [assets.portfolioId],
    references: [portfolios.id],
  }),
}));

export const dataAccessPoliciesRelations = relations(
  dataAccessPolicies,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [dataAccessPolicies.organizationId],
      references: [organizations.id],
    }),
    userDataAccess: many(userDataAccess),
  }),
);

export const userDataAccessRelations = relations(userDataAccess, ({ one }) => ({
  user: one(users, {
    fields: [userDataAccess.userId],
    references: [users.id],
  }),
  dataAccessPolicy: one(dataAccessPolicies, {
    fields: [userDataAccess.dataAccessPolicyId],
    references: [dataAccessPolicies.id],
  }),
}));


export const orionAccountDataRelations = relations(orionAccountData, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [orionAccountData.portfolioId],
    references: [portfolios.id],
  }),
  firmIntegrationConfig: one(firmIntegrationConfigs, {
    fields: [orionAccountData.firmIntegrationConfigId],
    references: [firmIntegrationConfigs.id],
  }),
}));

export const orionAumHistoryRelations = relations(orionAumHistory, ({ one }) => ({
  firmIntegrationConfig: one(firmIntegrationConfigs, {
    fields: [orionAumHistory.firmIntegrationConfigId],
    references: [firmIntegrationConfigs.id],
  }),
}));

// Create insert schemas for Zod validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataMappingSchema = createInsertSchema(
  firmDataMappings,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationTypeSchema = createInsertSchema(
  integrationTypes,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFirmIntegrationConfigSchema = createInsertSchema(
  firmIntegrationConfigs,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdvisorAuthTokenSchema = createInsertSchema(
  advisorAuthTokens,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Create insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertDataMapping = z.infer<typeof insertDataMappingSchema>;
export type InsertIntegrationType = z.infer<typeof insertIntegrationTypeSchema>;
export type InsertFirmIntegrationConfig = z.infer<
  typeof insertFirmIntegrationConfigSchema
>;
export type InsertAdvisorAuthToken = z.infer<
  typeof insertAdvisorAuthTokenSchema
>;

// Create select types
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Status = (typeof statusEnum.enumValues)[number];


export type DataMapping = typeof firmDataMappings.$inferSelect;
export type Activity = {
  id: number;
  clientId: number;
  type: string;
  details: any;
  date: Date;
  createdAt: Date;
  advisorId: number;
};
export type Portfolio = typeof portfolios.$inferSelect;
export type Holding = typeof assets.$inferSelect;
export type FirmIntegrationConfigs = typeof firmIntegrationConfigs.$inferSelect;
export type AdvisorIntegrationAccess =
  typeof advisorIntegrationAccess.$inferSelect;
export type IntegrationDataStorage = typeof integrationDataStorage.$inferSelect;
export type AataAccessPolicies = typeof dataAccessPolicies.$inferSelect;
export type UserDataAccess = typeof userDataAccess.$inferSelect;
export type AdvisorAuthTokens = typeof advisorAuthTokens.$inferSelect;
export type IntegrationType = typeof integrationTypes.$inferSelect;
export type OrionAccountData = typeof orionAccountData.$inferSelect;
export type OrionAumHistory = typeof orionAumHistory.$inferSelect;
