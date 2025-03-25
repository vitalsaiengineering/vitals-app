import {
  Organization,
  InsertOrganization,
  User,
  InsertUser,
} from "@shared/schema";


import { PostgresStorage } from 'shared/pg-storage';
export const storage = new PostgresStorage();


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

export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private users: Map<number, User>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.organizations = new Map();
    this.users = new Map();
    this.currentIds = {
      organizations: 1,
      users: 1,
    };
  }

  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganizationsByType(type: string): Promise<Organization[]> {
    return Array.from(this.organizations.values()).filter(
      (org) => org.type === type,
    );
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = this.currentIds.organizations++;
    const newOrg: Organization = {
      id,
      name: org.name,
      type: org.type || "firm",
      parentId: org.parentId || null,
      createdAt: new Date(),
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.organizationId === organizationId,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser: User = {
      id,
      username: user.username,
      password: user.password || null,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: new Date(),
      organizationId: user.organizationId,
      wealthboxConnected: false,
      wealthboxToken: null,
      wealthboxRefreshToken: null,
      wealthboxTokenExpiry: null,
      googleId: null,
      googleToken: null,
      googleRefreshToken: null,
      microsoftId: null,
      microsoftToken: null,
      microsoftRefreshToken: null,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

// // This code defines an interface called IStorage that outlines methods for interacting with organizations and users.
// // The MemStorage class implements this interface, providing in-memory storage for organizations and users.
// // This implementation uses Maps to store data and increments IDs for each new organization and user.
// // It defines methods for creating, retrieving, updating, and deleting organizations and users. 
// export const storage = new MemStorage();
