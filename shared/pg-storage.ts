import { db } from './db'; // You'll need to create this file with database connection
import { users, organizations, roles, clients, portfolios, assets } from './schema'; // Your Drizzle schema
import { eq, and } from 'drizzle-orm';
import {
  Organization,
  InsertOrganization,
  User,
  InsertUser,
  Client,
  InsertClient,
} from "@shared/schema";

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
}

export class PostgresStorage implements IStorage {
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    const results = await db.select().from(organizations).where(eq(organizations.id, id));
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
    return results[0];
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const results = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }
}