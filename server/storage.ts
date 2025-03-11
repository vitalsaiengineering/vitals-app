import {
  Organization, InsertOrganization,
  User, InsertUser,
  Client, InsertClient,
  Activity, InsertActivity,
  Portfolio, InsertPortfolio,
  Holding, InsertHolding,
  DataMapping, InsertDataMapping,
  ClientWithMetrics, AdvisorMetrics, ClientDemographics
} from "@shared/schema";

export interface IStorage {
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUsersByOrganization(organizationId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserWealthboxConnection(
    id: number, 
    token: string, 
    refreshToken: string, 
    expiryDate: Date
  ): Promise<User | undefined>;
  updateUserGoogleConnection(
    id: number,
    googleId: string,
    token: string,
    refreshToken: string | null
  ): Promise<User | undefined>;

  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getClientsByOrganization(organizationId: number): Promise<Client[]>;
  getClientsByAdvisor(advisorId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  upsertClientByWealthboxId(wealthboxClientId: string, client: Partial<Client>): Promise<Client>;

  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByClient(clientId: number): Promise<Activity[]>;
  getActivitiesByAdvisor(advisorId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  upsertActivityByWealthboxId(wealthboxActivityId: string, activity: Partial<Activity>): Promise<Activity>;

  // Portfolio methods
  getPortfolio(id: number): Promise<Portfolio | undefined>;
  getPortfoliosByClient(clientId: number): Promise<Portfolio[]>;
  getPortfoliosByAdvisor(advisorId: number): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  upsertPortfolioByWealthboxId(wealthboxPortfolioId: string, portfolio: Partial<Portfolio>): Promise<Portfolio>;

  // Holding methods
  getHolding(id: number): Promise<Holding | undefined>;
  getHoldingsByPortfolio(portfolioId: number): Promise<Holding[]>;
  createHolding(holding: InsertHolding): Promise<Holding>;
  upsertHoldingByWealthboxId(wealthboxHoldingId: string, holding: Partial<Holding>): Promise<Holding>;

  // Data Mapping methods
  getDataMappings(userId: number): Promise<DataMapping[]>;
  createDataMapping(mapping: InsertDataMapping): Promise<DataMapping>;
  deleteDataMapping(id: number): Promise<void>;

  // Analytics methods
  getClientWithMetrics(clientId: number): Promise<ClientWithMetrics | undefined>;
  getClientsByAdvisorWithMetrics(advisorId: number): Promise<ClientWithMetrics[]>;
  getAdvisorMetrics(advisorId: number): Promise<AdvisorMetrics>;
  getClientDemographics(advisorId: number): Promise<ClientDemographics>;
}

export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private activities: Map<number, Activity>;
  private portfolios: Map<number, Portfolio>;
  private holdings: Map<number, Holding>;
  private dataMappings: Map<number, DataMapping>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.organizations = new Map();
    this.users = new Map();
    this.clients = new Map();
    this.activities = new Map();
    this.portfolios = new Map();
    this.holdings = new Map();
    this.dataMappings = new Map();
    this.currentIds = {
      organizations: 1,
      users: 1,
      clients: 1,
      activities: 1,
      portfolios: 1,
      holdings: 1,
      dataMappings: 1
    };

    // Initialize with default organization and admin user
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create default organization
    const org: Organization = {
      id: 1,
      name: "Default Financial Group",
      createdAt: new Date()
    };
    this.organizations.set(1, org);

    // Create default global admin
    const admin: User = {
      id: 1,
      username: "admin",
      password: "password", // In a real app, this would be hashed
      email: "admin@example.com",
      fullName: "System Administrator",
      role: "global_admin",
      organizationId: 1,
      wealthboxConnected: false,
      wealthboxToken: null,
      wealthboxRefreshToken: null,
      wealthboxTokenExpiry: null,
      // OAuth fields
      googleId: null,
      googleToken: null,
      googleRefreshToken: null,
      microsoftId: null,
      microsoftToken: null,
      microsoftRefreshToken: null,
      createdAt: new Date()
    };
    this.users.set(1, admin);
    
    // Create a client admin
    const clientAdmin: User = {
      id: 2,
      username: "clientadmin",
      password: "password", // In a real app, this would be hashed
      email: "clientadmin@example.com",
      fullName: "Client Administrator",
      role: "client_admin",
      organizationId: 1,
      wealthboxConnected: false,
      wealthboxToken: null,
      wealthboxRefreshToken: null,
      wealthboxTokenExpiry: null,
      // OAuth fields
      googleId: null,
      googleToken: null,
      googleRefreshToken: null,
      microsoftId: null,
      microsoftToken: null,
      microsoftRefreshToken: null,
      createdAt: new Date()
    };
    this.users.set(2, clientAdmin);
    
    // Create a financial advisor
    const advisor: User = {
      id: 3,
      username: "advisor",
      password: "password", // In a real app, this would be hashed
      email: "advisor@example.com",
      fullName: "Sarah Johnson",
      role: "financial_advisor",
      organizationId: 1,
      wealthboxConnected: true,
      wealthboxToken: "mock_token",
      wealthboxRefreshToken: "mock_refresh_token",
      wealthboxTokenExpiry: new Date(Date.now() + 3600000),
      // OAuth fields
      googleId: null,
      googleToken: null,
      googleRefreshToken: null,
      microsoftId: null,
      microsoftToken: null,
      microsoftRefreshToken: null,
      createdAt: new Date()
    };
    this.users.set(3, advisor);

    // Set next ID
    this.currentIds.organizations = 2;
    this.currentIds.users = 4;
  }

  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = this.currentIds.organizations++;
    const newOrg: Organization = { 
      ...org, 
      id, 
      createdAt: new Date() 
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
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.organizationId === organizationId
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser: User = {
      ...user,
      id,
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
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserWealthboxConnection(
    id: number, 
    token: string, 
    refreshToken: string, 
    expiryDate: Date
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      wealthboxConnected: true,
      wealthboxToken: token,
      wealthboxRefreshToken: refreshToken,
      wealthboxTokenExpiry: expiryDate
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserGoogleConnection(
    id: number,
    googleId: string,
    token: string,
    refreshToken: string | null
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      googleId,
      googleToken: token,
      googleRefreshToken: refreshToken
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientsByOrganization(organizationId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.organizationId === organizationId
    );
  }

  async getClientsByAdvisor(advisorId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.advisorId === advisorId
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.currentIds.clients++;
    const newClient: Client = {
      ...client,
      id,
      createdAt: new Date()
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async upsertClientByWealthboxId(wealthboxClientId: string, clientData: Partial<Client>): Promise<Client> {
    // Find if client with this wealthboxId exists
    const existingClient = Array.from(this.clients.values()).find(
      (client) => client.wealthboxClientId === wealthboxClientId
    );
    
    if (existingClient) {
      const updatedClient = { ...existingClient, ...clientData };
      this.clients.set(existingClient.id, updatedClient);
      return updatedClient;
    } else {
      // Create new client
      const id = this.currentIds.clients++;
      const newClient: Client = {
        id,
        name: clientData.name || "Unknown Client",
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        zip: clientData.zip,
        age: clientData.age,
        aum: clientData.aum || 0,
        revenue: clientData.revenue || 0,
        organizationId: clientData.organizationId!,
        advisorId: clientData.advisorId,
        wealthboxClientId,
        metadata: clientData.metadata,
        createdAt: new Date()
      };
      this.clients.set(id, newClient);
      return newClient;
    }
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByClient(clientId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.clientId === clientId
    );
  }

  async getActivitiesByAdvisor(advisorId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.advisorId === advisorId
    );
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentIds.activities++;
    const newActivity: Activity = {
      ...activity,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async upsertActivityByWealthboxId(wealthboxActivityId: string, activityData: Partial<Activity>): Promise<Activity> {
    // Find if activity with this wealthboxId exists
    const existingActivity = Array.from(this.activities.values()).find(
      (activity) => activity.wealthboxActivityId === wealthboxActivityId
    );
    
    if (existingActivity) {
      const updatedActivity = { ...existingActivity, ...activityData };
      this.activities.set(existingActivity.id, updatedActivity);
      return updatedActivity;
    } else {
      // Create new activity
      const id = this.currentIds.activities++;
      const newActivity: Activity = {
        id,
        type: activityData.type || "other",
        title: activityData.title || "Unknown Activity",
        description: activityData.description,
        date: activityData.date || new Date(),
        clientId: activityData.clientId!,
        advisorId: activityData.advisorId!,
        wealthboxActivityId,
        metadata: activityData.metadata,
        createdAt: new Date()
      };
      this.activities.set(id, newActivity);
      return newActivity;
    }
  }

  // Portfolio methods
  async getPortfolio(id: number): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async getPortfoliosByClient(clientId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      (portfolio) => portfolio.clientId === clientId
    );
  }

  async getPortfoliosByAdvisor(advisorId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      (portfolio) => portfolio.advisorId === advisorId
    );
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.currentIds.portfolios++;
    const newPortfolio: Portfolio = {
      ...portfolio,
      id,
      createdAt: new Date()
    };
    this.portfolios.set(id, newPortfolio);
    return newPortfolio;
  }

  async upsertPortfolioByWealthboxId(wealthboxPortfolioId: string, portfolioData: Partial<Portfolio>): Promise<Portfolio> {
    // Find if portfolio with this wealthboxId exists
    const existingPortfolio = Array.from(this.portfolios.values()).find(
      (portfolio) => portfolio.wealthboxPortfolioId === wealthboxPortfolioId
    );
    
    if (existingPortfolio) {
      const updatedPortfolio = { ...existingPortfolio, ...portfolioData };
      this.portfolios.set(existingPortfolio.id, updatedPortfolio);
      return updatedPortfolio;
    } else {
      // Create new portfolio
      const id = this.currentIds.portfolios++;
      const newPortfolio: Portfolio = {
        id,
        name: portfolioData.name || "Unknown Portfolio",
        clientId: portfolioData.clientId!,
        advisorId: portfolioData.advisorId!,
        totalValue: portfolioData.totalValue || 0,
        wealthboxPortfolioId,
        metadata: portfolioData.metadata,
        createdAt: new Date()
      };
      this.portfolios.set(id, newPortfolio);
      return newPortfolio;
    }
  }

  // Holding methods
  async getHolding(id: number): Promise<Holding | undefined> {
    return this.holdings.get(id);
  }

  async getHoldingsByPortfolio(portfolioId: number): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(
      (holding) => holding.portfolioId === portfolioId
    );
  }

  async createHolding(holding: InsertHolding): Promise<Holding> {
    const id = this.currentIds.holdings++;
    const newHolding: Holding = {
      ...holding,
      id,
      createdAt: new Date()
    };
    this.holdings.set(id, newHolding);
    return newHolding;
  }

  async upsertHoldingByWealthboxId(wealthboxHoldingId: string, holdingData: Partial<Holding>): Promise<Holding> {
    // Find if holding with this wealthboxId exists
    const existingHolding = Array.from(this.holdings.values()).find(
      (holding) => holding.wealthboxHoldingId === wealthboxHoldingId
    );
    
    if (existingHolding) {
      const updatedHolding = { ...existingHolding, ...holdingData };
      this.holdings.set(existingHolding.id, updatedHolding);
      return updatedHolding;
    } else {
      // Create new holding
      const id = this.currentIds.holdings++;
      const newHolding: Holding = {
        id,
        assetClass: holdingData.assetClass || "other",
        name: holdingData.name || "Unknown Holding",
        value: holdingData.value || 0,
        allocation: holdingData.allocation || 0,
        performance: holdingData.performance || 0,
        portfolioId: holdingData.portfolioId!,
        wealthboxHoldingId,
        metadata: holdingData.metadata,
        createdAt: new Date()
      };
      this.holdings.set(id, newHolding);
      return newHolding;
    }
  }

  // Data Mapping methods
  async getDataMappings(userId: number): Promise<DataMapping[]> {
    return Array.from(this.dataMappings.values()).filter(
      (mapping) => mapping.userId === userId
    );
  }

  async createDataMapping(mapping: InsertDataMapping): Promise<DataMapping> {
    const id = this.currentIds.dataMappings++;
    const newMapping: DataMapping = {
      ...mapping,
      id,
      createdAt: new Date()
    };
    this.dataMappings.set(id, newMapping);
    return newMapping;
  }

  async deleteDataMapping(id: number): Promise<void> {
    this.dataMappings.delete(id);
  }

  // Analytics methods
  async getClientWithMetrics(clientId: number): Promise<ClientWithMetrics | undefined> {
    const client = this.clients.get(clientId);
    if (!client) return undefined;
    
    const clientActivities = await this.getActivitiesByClient(clientId);
    
    return {
      ...client,
      activityCount: clientActivities.length
    };
  }

  async getClientsByAdvisorWithMetrics(advisorId: number): Promise<ClientWithMetrics[]> {
    const clients = await this.getClientsByAdvisor(advisorId);
    const clientsWithMetrics: ClientWithMetrics[] = [];
    
    for (const client of clients) {
      const clientActivities = await this.getActivitiesByClient(client.id);
      clientsWithMetrics.push({
        ...client,
        activityCount: clientActivities.length
      });
    }
    
    return clientsWithMetrics;
  }

  async getAdvisorMetrics(advisorId: number): Promise<AdvisorMetrics> {
    const clients = await this.getClientsByAdvisor(advisorId);
    const activities = await this.getActivitiesByAdvisor(advisorId);
    const portfolios = await this.getPortfoliosByAdvisor(advisorId);
    
    let totalAum = 0;
    let totalRevenue = 0;
    
    // Calculate total AUM and revenue
    for (const client of clients) {
      totalAum += client.aum || 0;
      totalRevenue += client.revenue || 0;
    }
    
    // Calculate asset allocation
    const assetAllocation: { [key: string]: number } = {
      equities: 0,
      'fixed income': 0,
      alternatives: 0,
      cash: 0
    };
    
    for (const portfolio of portfolios) {
      const holdings = await this.getHoldingsByPortfolio(portfolio.id);
      for (const holding of holdings) {
        assetAllocation[holding.assetClass] = (assetAllocation[holding.assetClass] || 0) + holding.value;
      }
    }
    
    const totalAssetValue = Object.values(assetAllocation).reduce((sum, value) => sum + value, 0);
    
    // Convert asset allocation to the required format
    const formattedAssetAllocation = Object.entries(assetAllocation).map(([className, value]) => ({
      class: className,
      value,
      percentage: totalAssetValue > 0 ? (value / totalAssetValue) * 100 : 0
    }));
    
    return {
      totalAum,
      totalRevenue,
      totalClients: clients.length,
      totalActivities: activities.length,
      assetAllocation: formattedAssetAllocation
    };
  }

  async getClientDemographics(advisorId: number): Promise<ClientDemographics> {
    const clients = await this.getClientsByAdvisor(advisorId);
    
    // Calculate age groups
    const ageGroups: { [key: string]: number } = {
      '18-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61-70': 0,
      '71+': 0
    };
    
    // Calculate state distribution
    const states: { [key: string]: number } = {};
    
    for (const client of clients) {
      // Age grouping
      if (client.age) {
        if (client.age <= 30) ageGroups['18-30']++;
        else if (client.age <= 40) ageGroups['31-40']++;
        else if (client.age <= 50) ageGroups['41-50']++;
        else if (client.age <= 60) ageGroups['51-60']++;
        else if (client.age <= 70) ageGroups['61-70']++;
        else ageGroups['71+']++;
      }
      
      // State counting
      if (client.state) {
        states[client.state] = (states[client.state] || 0) + 1;
      }
    }
    
    // Format age groups
    const formattedAgeGroups = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count
    }));
    
    // Format state distribution
    const totalClients = clients.length;
    const formattedStateDistribution = Object.entries(states)
      .map(([state, count]) => ({
        state,
        count,
        percentage: totalClients > 0 ? (count / totalClients) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      ageGroups: formattedAgeGroups,
      stateDistribution: formattedStateDistribution
    };
  }
}

export const storage = new MemStorage();
