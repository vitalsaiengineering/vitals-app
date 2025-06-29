import { db } from "../server/db";
import { eq, and } from "drizzle-orm";
import {
  users,
  roles,
  organizations,
  Organization,
  InsertOrganization,
  User,
  InsertUser,
  Role,
  Client,
  FirmIntegrationConfigs,
  InsertFirmIntegrationConfig,
  AdvisorAuthTokens,
  firmIntegrationConfigs,
  advisorAuthTokens,
  InsertAdvisorAuthToken,
  IntegrationType,
  integrationTypes,
  Status,
  statusValues,
  clients,
  InsertClient,
  portfolios,
  Portfolio,
  Activity,
  DataMapping,
  InsertDataMapping,
  firmDataMappings
} from "@shared/schema";

// export interface IFirmIntegrationConfig {
//   id: number;
//   integrationTypeId: number;
//   firmId: number;
//   credentials: any;
//   settings: any;
//   status: "active" | "inactive" | "pending" | "suspended";
//   createdAt: Date;
//   updatedAt: Date;

// }

export interface IStorage {
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  getOrganizationsByType(type: string): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByOrganization(organizationId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Role methods
  getRole(id: number): Promise<Role | undefined>;

  // Other methods
  upsertFirmIntegrationConfig(
    integration: FirmIntegrationConfigs,
  ): Promise<FirmIntegrationConfigs>;
  getFirmIntegrationConfigByFirmId(
    id: number,
  ): Promise<FirmIntegrationConfigs | undefined>;
  createFirmIntegrationConfig(
    integration: InsertFirmIntegrationConfig,
  ): Promise<FirmIntegrationConfigs>;

  getAdvisorAuthTokenByUserId(
    id: number,
    organizationId: number,
  ): Promise<AdvisorAuthTokens | undefined>;

  getAdvisorAuthTokensByAdvisorId(
    advisorId: number,
  ): Promise<AdvisorAuthTokens[]>;

  createAdvisorAuthToken(
    token: InsertAdvisorAuthToken,
  ): Promise<AdvisorAuthTokens>;

  upsertAdvisorAuthToken(token: AdvisorAuthTokens): Promise<AdvisorAuthTokens>;

  getIntegrationTypeByName(name: string): Promise<IntegrationType | undefined>;

  updateFirmIntegrationConfig(
    id: number,
    integration: FirmIntegrationConfigs,
  ): Promise<FirmIntegrationConfigs>;

  updateAdvisorAuthToken(
    id: number,
    token: AdvisorAuthTokens,
  ): Promise<AdvisorAuthTokens>;

  getClientsByOrganization(organizationId: number): Promise<Client[]>;
  getUsersByOrganization(organizationId: number): Promise<User[]>;

  getRoles(): Promise<Role[]>
  getStatuses(): Promise<Status[]>
  
  // Client methods
  getClientsByAdvisor(advisorId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  upsertClientByWealthboxId(wealthboxId: string, client: Partial<Client>): Promise<Client>;
  
  // Activity methods
  upsertActivityByWealthboxId(wealthboxId: string, activity: Partial<Activity>): Promise<Activity>;
  
  // Data mapping methods
  getDataMappings(userId: number): Promise<DataMapping[]>;
  createDataMapping(mapping: InsertDataMapping): Promise<DataMapping>;
  deleteDataMapping(id: number): Promise<void>;
}

export class PostgresStorage implements IStorage {
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    const results = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return results[0];
  }

  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations);
  }

  async getOrganizationsByType(type: string): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.type, type));
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const results = await db.insert(organizations).values(org).returning();
    return results[0] as Organization;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.email, username));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async getUsersByOrganization(organizationId: number): Promise<(User & { role?: Role })[]> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId));

    // Get all role IDs from users (filtering out nulls)
    const roleIds = results
      .map((user) => user.roleId)
      .filter((id): id is number => id !== null);

    // Get all roles in one query if there are roleIds
    const rolesResults = roleIds.length > 0 
      ? await db.select().from(roles)
      : [];

    // add roles to users
    return results.map((user) => {
      const role = user.roleId 
        ? rolesResults.find((role) => role.id === user.roleId) 
        : undefined;

      return {
        ...user,
        role,
      };
    });
  }



  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<User | undefined> {
    const results = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  async getRole(id: number): Promise<Role | undefined> {
    const results = await db.select().from(roles).where(eq(roles.id, id));
    return results[0];
  }

  async upsertFirmIntegrationConfig(
    integration: FirmIntegrationConfigs,
  ): Promise<FirmIntegrationConfigs> {
    const results = await db
      .insert(firmIntegrationConfigs)
      .values(integration)
      .returning();
    return results[0];
  }

  async updateFirmIntegrationConfig(
    id: number,
    integration: Partial<FirmIntegrationConfigs>,
  ): Promise<FirmIntegrationConfigs> {
    const results = await db
      .update(firmIntegrationConfigs)
      .set(integration)
      .where(eq(firmIntegrationConfigs.id, id))
      .returning();
    return results[0];
  }

  async getFirmIntegrationConfigByFirmId(
    firmId: number,
  ): Promise<FirmIntegrationConfigs | undefined> {
    const results = await db
      .select()
      .from(firmIntegrationConfigs)
      .where(eq(firmIntegrationConfigs.firmId, firmId));
    return results[0];
  }

  async createFirmIntegrationConfig(
    integration: InsertFirmIntegrationConfig,
  ): Promise<FirmIntegrationConfigs> {
    const results = await db
      .insert(firmIntegrationConfigs)
      .values(integration)
      .returning();
    return results[0];
  }

  async getAdvisorAuthToken(
    id: number,
  ): Promise<AdvisorAuthTokens | undefined> {
    const results = await db
      .select()
      .from(advisorAuthTokens)
      .where(eq(advisorAuthTokens.id, id));
    return results[0];
  }

  async getIntegrationTypeByName(name: string): Promise<IntegrationType> {
    const results = await db
      .select()
      .from(integrationTypes)
      .where(eq(integrationTypes.name, name));
    return results[0];
  }

  async getAdvisorAuthTokenByUserId(
    advisorId: number,
    organizationId: number,
  ): Promise<AdvisorAuthTokens | undefined> {
    console.log("getAdvisorAuthTokenByUserId", { advisorId, organizationId });
    const wealthboxIntegration =
      await this.getIntegrationTypeByName("wealthbox");
    // console.log("wealthboxIntegration", wealthboxIntegration);
    // const integrationConfigs = await db
    //   .select()
    //   .from(firmIntegrationConfigs)
    //   .where(
    //     and(
    //       eq(firmIntegrationConfigs.firmId, organizationId),
    //       eq(firmIntegrationConfigs.integrationTypeId, wealthboxIntegration.id),
    //     ),
    //   );
    // console.log("integrationConfigs", integrationConfigs);
    const results = await db
      .select()
      .from(advisorAuthTokens)
      .where(
        and(
          eq(advisorAuthTokens.advisorId, advisorId),
          eq(advisorAuthTokens.integrationType, wealthboxIntegration.id),
          // eq(
          //   advisorAuthTokens.integrationType,
          //   wealthboxIntegration.id,
          // ),
        ),
      );
    console.log("results", results);
    return results[0];
  }

  async getAdvisorAuthTokensByAdvisorId(
    advisorId: number,
  ): Promise<AdvisorAuthTokens[]> {
    const results = await db
      .select()
      .from(advisorAuthTokens)
      .where(eq(advisorAuthTokens.advisorId, advisorId));
    return results;
  }

  async createAdvisorAuthToken(
    token: InsertAdvisorAuthToken,
  ): Promise<AdvisorAuthTokens> {
    const results = await db
      .insert(advisorAuthTokens)
      .values(token)
      .returning();
    return results[0];
  }

  async updateAdvisorAuthToken(
    id: number,
    token: AdvisorAuthTokens,
  ): Promise<AdvisorAuthTokens> {
    const results = await db
      .update(advisorAuthTokens)
      .set(token)
      .where(eq(advisorAuthTokens.id, token.id))
      .returning();
    return results[0];
  }

  async upsertAdvisorAuthToken(
    token: AdvisorAuthTokens,
  ): Promise<AdvisorAuthTokens> {
    const results = await db
      .insert(advisorAuthTokens)
      .values(token)
      .returning();
    return results[0];
  }

  async getClientsByOrganization(organizationId: number): Promise<Client[]> {
    const results = await db
      .select()
      .from(clients)
      .where(eq(clients.firmId, organizationId));
    return results;
  }



  async getRoles(): Promise<Role[]>{
    return db.select().from(roles);
  }

  async getStatuses(): Promise<Status[]> {
    return statusValues;
  }
  
  // Client methods
  async getClientsByAdvisor(advisorId: number): Promise<Client[]> {
    const results = await db
      .select()
      .from(clients)
      .where(eq(clients.primaryAdvisorId, advisorId));
    return results;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const results = await db.insert(clients).values(client).returning();
    return results[0];
  }

  async upsertClientByWealthboxId(wealthboxId: string, client: Partial<Client>): Promise<Client> {
    // First try to find existing client by wealthboxClientId
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.wealthboxClientId, wealthboxId))
      .limit(1);

    if (existingClient.length > 0) {
      // Update existing client
      const results = await db
        .update(clients)
        .set({
          ...client,
          updatedAt: new Date(),
        })
        .where(eq(clients.wealthboxClientId, wealthboxId))
        .returning();
      
      if (!results || results.length === 0) {
        throw new Error("Failed to update client");
      }
      return results[0];
    } else {
      // Create new client with wealthboxClientId
      const clientData: InsertClient = {
        firmId: client.firmId || 0,
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        title: client.title,
        contactType: client.contactType,
        segment: client.segment,
        wealthboxClientId: wealthboxId,
        primaryAdvisorId: client.primaryAdvisorId,
        age: client.age,
        emailAddress: client.emailAddress,
        phoneNumber: client.phoneNumber,
        aum: client.aum,
        isActive: client.isActive,
        representativeName: client.representativeName,
        representativeId: client.representativeId,
        startDate: client.startDate,
        contactInfo: client.contactInfo as any || {},
        source: client.source || 'wealthbox',
        status: client.status || 'active',
        ...client,
      };
      
      const results = await db
        .insert(clients)
        .values(clientData)
        .returning();
      
      if (!results || results.length === 0) {
        throw new Error("Failed to create client");
      }
      return results[0];
    }
  }
  
  // Activity methods
  async upsertActivityByWealthboxId(wealthboxId: string, activity: Partial<Activity>): Promise<Activity> {
    // Since there's no activities table in the schema, we'll return a mock activity
    // In a real implementation, you'd need to create an activities table
    console.warn('Activities table not implemented - returning mock activity');
    return {
      id: 1,
      clientId: activity.clientId || 0,
      type: activity.type || 'unknown',
      details: activity.details || {},
      date: activity.date || new Date(),
      createdAt: new Date(),
      advisorId: activity.advisorId || 0,
    } as Activity;
  }
  
  // Data mapping methods
  async getDataMappings(userId: number): Promise<DataMapping[]> {
    // Get user's organization first
    const user = await this.getUser(userId);
    if (!user || !user.organizationId) {
      return [];
    }

    const results = await db
      .select()
      .from(firmDataMappings)
      .where(eq(firmDataMappings.firmId, user.organizationId));
    return results;
  }

  async createDataMapping(mapping: InsertDataMapping): Promise<DataMapping> {
    const results = await db.insert(firmDataMappings).values(mapping).returning();
    return results[0];
  }

  async deleteDataMapping(id: number): Promise<void> {
    await db.delete(firmDataMappings).where(eq(firmDataMappings.id, id));
  }
}