import { Request, Response } from "express";
import { storage } from "./storage";
import { and, or } from "drizzle-orm";

// Orion API base URL
const ORION_API_BASE_URL = "https://stagingapi.orionadvisor.com/api/v1";

// Orion API credentials
const ORION_CLIENT_ID = "2112";
const ORION_CLIENT_SECRET = "4dc339e2-7ab1-41cb-8d7f-104262ab4ed4";
const ORION_BASIC_AUTH = "c3VwcG9ydEBhZHZpc29ydml0YWxzLmNvbTp0ZW5vUHlaOXppeFJveXlmZnFNQw==";

// Orion API endpoints
const ENDPOINTS = {
  TOKEN: `${ORION_API_BASE_URL}/security/token`,
  PORTFOLIO_CLIENTS: `${ORION_API_BASE_URL}/Portfolio/Clients`,
  AUM_OVER_TIME: (clientId: string) => `${ORION_API_BASE_URL}/Portfolio/Clients/${clientId}/AumOverTime`,
};

/**
 * Get Orion auth token by user ID and firm integration config ID
 */
export async function getOrionAdvisorAuthToken(
  userId: number,
  organizationId: number,
  firmIntegrationConfigId: number
): Promise<any> {
  const { db } = await import("./db");
  const { advisorAuthTokens } = await import("../shared/schema");
  const { eq, and } = await import("drizzle-orm");

  const results = await db
    .select()
    .from(advisorAuthTokens)
    .where(
      and(
        eq(advisorAuthTokens.advisorId, userId),
        eq(advisorAuthTokens.firmIntegrationConfigId, firmIntegrationConfigId),
      ),
    );

  return results[0];
}

/**
 * Get Orion authentication token
 */
export async function getOrionToken(): Promise<{ success: boolean; refreshToken?: string; accessToken?: string; error?: string }> {
  try {
    const response = await fetch(ENDPOINTS.TOKEN, {
      method: "GET",
      headers: {
        "Client_id": ORION_CLIENT_ID,
        "Client_secret": ORION_CLIENT_SECRET,
        "Authorization": `Basic ${ORION_BASIC_AUTH}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Orion token request failed: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    
    if (data.access_token) {
      return { success: true, refreshToken: data.refresh_token, accessToken: data.access_token };
    } else {
      console.error("No access_token in Orion response:", data);
      return { success: false, error: "No access_token received from Orion API" };
    }
  } catch (error) {
    console.error("Error getting Orion token:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Test connection to Orion API with a refresh token
 */
export async function testOrionConnection(accessToken: string): Promise<boolean> {
  try {
    // Test the connection by making a simple API call
    const response = await fetch(`${ENDPOINTS.PORTFOLIO_CLIENTS}?limit=1`, {
      method: "GET",
      headers: {
        "Authorization": `Session ${accessToken}`,
        "Client_id": ORION_CLIENT_ID,
        "Client_secret": ORION_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error testing Orion connection:", error);
    return false;
  }
}

/**
 * Get AUM over time for a specific client
 */
export async function getClientAumOverTime(
  accessToken: string,
  clientId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(ENDPOINTS.AUM_OVER_TIME(clientId), {
      method: "GET",
      headers: {
        "Authorization": `Session ${accessToken}`,
        "Client_id": ORION_CLIENT_ID,
        "Client_secret": ORION_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Orion AUM request failed: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error getting client AUM over time:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get portfolio clients
 */
export async function getPortfolioClients(
  accessToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(ENDPOINTS.PORTFOLIO_CLIENTS, {
      method: "GET",
      headers: {
        "Authorization": `Session ${accessToken}`,
        "Client_id": ORION_CLIENT_ID,
        "Client_secret": ORION_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Orion portfolio clients request failed: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error getting portfolio clients:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get portfolio accounts
 */
export async function getPortfolioAccounts(
  accessToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${ORION_API_BASE_URL}/Portfolio/Accounts`, {
      method: "GET",
      headers: {
        "Authorization": `Session ${accessToken}`,
        "Client_id": ORION_CLIENT_ID,
        "Client_secret": ORION_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Orion portfolio accounts request failed: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error getting portfolio accounts:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Store Orion client data in database
 */
export async function storeOrionClientData(
  clientData: any,
  firmIntegrationConfigId: number,
  organizationId: number,
  advisorId: number
): Promise<{ success: boolean; clientId?: number; error?: string }> {
  try {
    // Map Orion client data to our client model
    const mappedClient = {
      orionClientId: clientData.id?.toString(),
      firmId: organizationId,
      primaryAdvisorId: advisorId,
      firstName: clientData.firstName || clientData.name?.split(' ')[0] || '',
      lastName: clientData.lastName || clientData.name?.split(' ').slice(1).join(' ') || '',
      age: clientData.age,
      emailAddress: clientData.email || clientData.emailAddress,
      phoneNumber: clientData.phone || clientData.phoneNumber,
      aum: clientData.aum || 0,
      isActive: clientData.isActive !== undefined ? clientData.isActive : true,
      representativeName: clientData.representativeName,
      representativeId: clientData.representativeId,
      startDate: clientData.startDate ? new Date(clientData.startDate) : null,
      contactInfo: {
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        zip: clientData.zip,
        country: clientData.country,
      },
      source: 'orion',
      status: 'active' as const,
    };

    // Store or update client in main clients table
    const { db: clientDb } = await import("./db");
    const { clients } = await import("../shared/schema");
    const { eq: clientEq } = await import("drizzle-orm");

    // Check if client already exists by name and email 
    const existingClients = await clientDb
      .select()
      .from(clients)
      .where(
        and(
          clientEq(clients.firstName, mappedClient.firstName),
          clientEq(clients.lastName, mappedClient.lastName),
          clientEq(clients.emailAddress, mappedClient.emailAddress)
        )
      );

    let client;
    if (existingClients.length > 0) {
      // Update existing client
      const updated = await clientDb
        .update(clients)
        .set({
          ...mappedClient,
          updatedAt: new Date(),
        })
        .where(clientEq(clients.id, existingClients[0].id))
        .returning();
      client = updated[0];
    } else {
      // Create new client
      const created = await clientDb
        .insert(clients)
        .values({
          ...mappedClient,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      client = created[0];
    }

    if (!client) {
      return { success: false, error: "Failed to create/update client" };
    }


    return { success: true, clientId: client.id };
  } catch (error) {
    console.error("Error storing Orion client data:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Store Orion account data in database
 */
export async function storeOrionAccountData(
  accountData: any,
  clientId: number,
  firmIntegrationConfigId: number
): Promise<{ success: boolean; accountDataId?: number; error?: string }> {
  try {
    // Store Orion-specific data in orion_account_data table only
    const { db } = await import("./db");
    const { orionAccountData } = await import("../shared/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if Orion account data already exists
    const existingOrionData = await db
      .select()
      .from(orionAccountData)
      .where(
        and(
          eq(orionAccountData.orionAccountId, accountData.id?.toString()),
          eq(orionAccountData.firmIntegrationConfigId, firmIntegrationConfigId)
        )
      );

    const orionDataPayload = {
      portfolioId: null, // No longer linking to portfolios table
      orionAccountId: accountData.id?.toString(),
      firmIntegrationConfigId,
      
      // Core account information from Orion
      name: accountData.name,
      number: accountData.number,
      accountType: accountData.accountType,
      isActive: accountData.isActive !== undefined ? accountData.isActive : true,
      
      // Financial data
      currentValue: accountData.currentValue?.toString(),
      accountStartValue: accountData.accountStartValue?.toString(),
      
      // Dates
      accountStartDate: accountData.accountStartDate ? new Date(accountData.accountStartDate) : null,
      cancelDate: accountData.cancelDate ? new Date(accountData.cancelDate) : null,
      
      // Management and custodian information
      custodian: accountData.custodian,
      managementStyle: accountData.managementStyle,
      managementStyleId: accountData.managementStyleId,
      fundFamily: accountData.fundFamily,
      fundFamilyId: accountData.fundFamilyId,
      registrationId: accountData.registrationId,
      modelName: accountData.modelName,
      subAdvisor: accountData.subAdvisor,
      
      // Representative information
      representative: accountData.representative,
      representativeId: accountData.representativeId,
      
      // Client and household information
      clientIdOrion: accountData.clientId, // Orion's client ID
      household: accountData.household,
      
      // JSONB fields for additional data
      rawData: accountData,
      mappedData: {
        clientId,
        name: accountData.name || accountData.accountName || `Account ${accountData.accountNumber}`,
        accountNumber: accountData.accountNumber,
        accountType: accountData.accountType,
        source: 'orion',
      },
      balanceData: {
        marketValue: accountData.marketValue,
        totalValue: accountData.totalValue,
        currentValue: accountData.currentValue,
        asOfDate: accountData.asOfDate,
      },
      performanceData: {
        ytdReturn: accountData.ytdReturn,
        oneYearReturn: accountData.oneYearReturn,
        threeYearReturn: accountData.threeYearReturn,
        fiveYearReturn: accountData.fiveYearReturn,
        inceptionReturn: accountData.inceptionReturn,
      },
      holdingsData: accountData.holdings || [],
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    };

    let result;
    if (existingOrionData.length > 0) {
      // Update existing record
      const updated = await db
        .update(orionAccountData)
        .set(orionDataPayload)
        .where(eq(orionAccountData.id, existingOrionData[0].id))
        .returning();
      result = updated[0];
    } else {
      // Insert new record
      const created = await db.insert(orionAccountData).values({
        ...orionDataPayload,
        createdAt: new Date(),
      }).returning();
      result = created[0];
    }

    return { success: true, accountDataId: result.id };
  } catch (error) {
    console.error("Error storing Orion account data:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Store AUM history data using optimized batch insert
 */
export async function storeOrionAumHistory(
  aumData: any,
  firmIntegrationConfigId: number
): Promise<{ success: boolean; inserted?: number; error?: string }> {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");

    // Process AUM data (could be an array of historical data points)
    const aumEntries = Array.isArray(aumData) ? aumData : [aumData];

    if (aumEntries.length === 0) {
      return { success: true, inserted: 0 };
    }

    // Use the optimized batch insert function
    const result = await db.execute(sql`
      SELECT insert_orion_aum_batch(${JSON.stringify(aumEntries)}::jsonb, ${firmIntegrationConfigId}::integer) as inserted_count
    `);

    const insertedCount = (result as any)[0]?.inserted_count || 0;

    return { success: true, inserted: insertedCount };
  } catch (error) {
    console.error("Error storing Orion AUM history:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get AUM time series data for an entity
 */
export async function getOrionAumTimeSeries(
  orionEntityId: number,
  options: {
    startDate?: string;
    endDate?: string;
    firmIntegrationConfigId?: number;
  } = {}
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");

    const result = await db.execute(sql`
      SELECT * FROM get_orion_aum_time_series(
        ${orionEntityId}::integer, 
        ${options.startDate || null}::date, 
        ${options.endDate || null}::date, 
        ${options.firmIntegrationConfigId || null}::integer
      )
    `);

    return { success: true, data: result as any };
  } catch (error) {
    console.error("Error getting Orion AUM time series:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Handle Orion connection setup
 */
export async function setupOrionConnectionHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("Setting up Orion connection for user:", user.id);

    // Get Orion token
    const tokenResult = await getOrionToken();
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      return res.status(500).json({ 
        success: false, 
        message: tokenResult.error || "Failed to get Orion token" 
      });
    }

    // Test the connection
    const isConnected = await testOrionConnection(tokenResult.accessToken);
    
    if (!isConnected) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to establish connection with Orion API" 
      });
    }

    // Get Orion integration type
    const integrationType = await storage.getIntegrationTypeByName("orion");
    
    if (!integrationType) {
      return res.status(500).json({ 
        success: false, 
        message: "Orion integration type not found" 
      });
    }

    // Get or create firm integration config for Orion
    // Note: The existing method getFirmIntegrationConfigByFirmId gets the first config for the firm
    // We need to check if it's for Orion specifically
    let firmIntegration = await storage.getFirmIntegrationConfigByFirmId(
      user.organizationId
    );

    // Check if the existing integration is for Orion, if not create a new one
    if (!firmIntegration || firmIntegration.integrationTypeId !== integrationType.id) {
      firmIntegration = await storage.createFirmIntegrationConfig({
        firmId: user.organizationId,
        integrationTypeId: integrationType.id,
        credentials: {
          client_id: ORION_CLIENT_ID,
          client_secret: ORION_CLIENT_SECRET,
        },
        settings: { sync_frequency: "daily" },
        status: "active",
      });
    } else {
      // Update existing firm integration
      firmIntegration = await storage.updateFirmIntegrationConfig(
        firmIntegration.id,
        {
          ...firmIntegration,
          credentials: {
            client_id: ORION_CLIENT_ID,
            client_secret: ORION_CLIENT_SECRET,
          },
          settings: { sync_frequency: "daily" },
          status: "active",
          updatedAt: new Date(),
        }
      );
    }

    // Get or create advisor auth token for Orion
    // We need to modify the existing method to work with Orion
    let advisorAuthToken;

    if (!advisorAuthToken) {
      advisorAuthToken = await storage.createAdvisorAuthToken({
        advisorId: user.id,
        firmIntegrationConfigId: firmIntegration.id,
        accessToken: tokenResult.accessToken, // Using refresh token as access token for Orion
        refreshToken: tokenResult.refreshToken,
        tokenType: "Session",
        expiresAt: null, // Orion tokens don't seem to have expiry in the example
        scope: null,
        additionalData: {},
        integrationType: integrationType.id,
      });
    }

    // Queue initial data sync asynchronously
    const { queueInitialOrionSync } = await import("./orion-sync-service");
    const syncResult = await queueInitialOrionSync(
      user.id,
      user.organizationId,
      firmIntegration.id
    );

    if (syncResult.success) {
      console.log(`Queued initial Orion sync with job ID: ${syncResult.jobId}`);
    } else {
      console.error(`Failed to queue initial Orion sync: ${syncResult.error}`);
    }

    return res.json({ 
      success: true, 
      message: "Orion connection established successfully. Initial data sync has been queued.",
      data: {
        firmIntegration,
        advisorAuthToken: {
          id: advisorAuthToken.id,
          tokenType: advisorAuthToken.tokenType,
          expiresAt: advisorAuthToken.expiresAt,
        },
        syncJob: syncResult.success ? {
          jobId: syncResult.jobId,
          status: 'queued'
        } : null
      }
    });

  } catch (error: any) {
    console.error("Error setting up Orion connection:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to setup Orion connection",
    });
  }
}

/**
 * Handle testing Orion connection
 */
export async function testOrionConnectionHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get the user's Orion token
    const integrationType = await storage.getIntegrationTypeByName("orion");
    
    if (!integrationType) {
      return res.status(404).json({ 
        success: false, 
        message: "Orion integration not found" 
      });
    }

    // Get firm integration config for Orion
    const firmIntegration = await storage.getFirmIntegrationConfigByFirmId(
      user.organizationId
    );

    if (!firmIntegration || firmIntegration.integrationTypeId !== integrationType.id) {
      return res.status(404).json({ 
        success: false, 
        message: "Orion integration not configured for this organization" 
      });
    }

    const advisorAuthToken = await getOrionAdvisorAuthToken(
      user.id,
      user.organizationId,
      firmIntegration.id
    );

    if (!advisorAuthToken || !advisorAuthToken.accessToken) {
      return res.status(404).json({ 
        success: false, 
        message: "Orion token not found. Please connect to Orion first." 
      });
    }

    // Test the connection
    const isConnected = await testOrionConnection(advisorAuthToken.accessToken);

    return res.json({
      success: isConnected,
      message: isConnected ? "Orion connection is active" : "Orion connection failed",
    });

  } catch (error: any) {
    console.error("Error testing Orion connection:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to test Orion connection",
    });
  }
}

/**
 * Get Orion connection status
 */
export async function getOrionStatusHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const integrationType = await storage.getIntegrationTypeByName("orion");
    
    if (!integrationType) {
      return res.json({ 
        connected: false, 
        message: "Orion integration not configured" 
      });
    }

    // Get firm integration config for Orion
    const firmIntegration = await storage.getFirmIntegrationConfigByFirmId(
      user.organizationId
    );

    if (!firmIntegration || firmIntegration.integrationTypeId !== integrationType.id) {
      return res.json({ 
        connected: false, 
        message: "Orion integration not configured for this organization" 
      });
    }

    const advisorAuthToken = await getOrionAdvisorAuthToken(
      user.id,
      user.organizationId,
      firmIntegration.id
    );

    if (!advisorAuthToken) {
      return res.json({ 
        connected: false, 
        message: "No Orion token found" 
      });
    }

    // Test if the token is still valid
    const isConnected = await testOrionConnection(advisorAuthToken.accessToken || "");

    return res.json({
      connected: isConnected,
      tokenExpiry: advisorAuthToken.expiresAt,
      message: isConnected ? "Connected to Orion" : "Orion token is invalid",
    });

  } catch (error: any) {
    console.error("Error getting Orion status:", error);
    return res.status(500).json({
      connected: false,
      message: error.message || "Failed to get Orion status",
    });
  }
}

/**
 * Sync Orion clients handler
 */
export async function syncOrionClientsHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get firm integration config
    const firmConfig = await storage.getFirmIntegrationConfigByFirmId(user.organizationId);
    if (!firmConfig) {
      return res.status(400).json({
        success: false,
        error: "Firm integration config not found",
      });
    }

    // Get Orion auth token
    const authToken = await getOrionAdvisorAuthToken(user.id, user.organizationId, firmConfig.id);
    if (!authToken) {
      return res.status(400).json({
        success: false,
        error: "Orion not configured for this organization",
      });
    }
    console.log("authToken", authToken);
    // Fetch clients from Orion
    const clientsResult = await getPortfolioClients(authToken.accessToken);
    if (!clientsResult.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to fetch clients from Orion: ${clientsResult.error}`,
      });
    }

    let synced = 0;
    let failed = 0;

    // Process each client
    for (const clientData of clientsResult.data || []) {
      try {
        const result = await storeOrionClientData(
          clientData,
          firmConfig.id,
          user.organizationId,
          user.id
        );

        if (result.success) {
          synced++;
        } else {
          console.error(`Failed to store client ${clientData.id}:`, result.error);
          failed++;
        }
      } catch (error) {
        console.error(`Error processing client ${clientData.id}:`, error);
        failed++;
      }
    }

    return res.json({
      success: true,
      synced,
      failed,
      message: `Synced ${synced} clients, ${failed} failed`,
    });
  } catch (error) {
    console.error("Error syncing Orion clients:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync Orion clients",
    });
  }
}

/**
 * Sync Orion AUM history handler
 */
export async function syncOrionAumHistoryHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const { aumData } = req.body;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!aumData) {
      return res.status(400).json({
        success: false,
        error: "AUM data is required",
      });
    }

    // Get firm integration config
    const firmConfig = await storage.getFirmIntegrationConfigByFirmId(user.organizationId);
    if (!firmConfig) {
      return res.status(400).json({
        success: false,
        error: "Firm integration config not found",
      });
    }

    // Store AUM history data
    const result = await storeOrionAumHistory(aumData, firmConfig.id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to store AUM history: ${result.error}`,
      });
    }

    return res.json({
      success: true,
      inserted: result.inserted,
      message: `Successfully stored ${result.inserted} AUM history records`,
    });
  } catch (error) {
    console.error("Error syncing Orion AUM history:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync Orion AUM history",
    });
  }
}

/**
 * Get Orion AUM time series handler
 */
export async function getOrionAumTimeSeriesHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const { orionEntityId, startDate, endDate } = req.query;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!orionEntityId) {
      return res.status(400).json({
        success: false,
        error: "orionEntityId is required",
      });
    }

    // Get firm integration config
    const firmConfig = await storage.getFirmIntegrationConfigByFirmId(user.organizationId);
    if (!firmConfig) {
      return res.status(400).json({
        success: false,
        error: "Firm integration config not found",
      });
    }

    // Get AUM time series data
    const result = await getOrionAumTimeSeries(parseInt(orionEntityId as string), {
      startDate: startDate as string,
      endDate: endDate as string,
      firmIntegrationConfigId: firmConfig.id,
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get AUM time series: ${result.error}`,
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting Orion AUM time series:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get Orion AUM time series",
    });
  }
}

/**
 * Get Orion sync job status handler
 */
export async function getOrionSyncJobStatusHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const { jobId } = req.params;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { getSyncJobStatus } = await import("./orion-sync-service");
    const job = getSyncJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Sync job not found",
      });
    }

    // Ensure user can only see their own jobs
    if (job.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error getting Orion sync job status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get sync job status",
    });
  }
}

/**
 * Get all Orion sync jobs for user handler
 */
export async function getUserOrionSyncJobsHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { getUserSyncJobs } = await import("./orion-sync-service");
    const jobs = getUserSyncJobs(user.id);
    
    return res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Error getting user Orion sync jobs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get sync jobs",
    });
  }
}

/**
 * Sync Orion accounts handler
 */
export async function syncOrionAccountsHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get firm integration config
    const firmConfig = await storage.getFirmIntegrationConfigByFirmId(user.organizationId);
    if (!firmConfig) {
      return res.status(400).json({
        success: false,
        error: "Firm integration config not found",
      });
    }

    // Get Orion auth token
    const authToken = await getOrionAdvisorAuthToken(user.id, user.organizationId, firmConfig.id);
    if (!authToken) {
      return res.status(400).json({
        success: false,
        error: "Orion not configured for this organization",
      });
    }

    // Fetch accounts from Orion
    const accountsResult = await getPortfolioAccounts(authToken.accessToken);
    if (!accountsResult.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to fetch accounts from Orion: ${accountsResult.error}`,
      });
    }

    let synced = 0;
    let failed = 0;

    // Process each account
    for (const accountData of accountsResult.data || []) {
      try {
        // Find the associated client by Orion client ID
        const { db: accountDb } = await import("./db");
        const { clients } = await import("../shared/schema");
        const { eq: accountEq } = await import("drizzle-orm");

        const clientResults = await accountDb
          .select()
          .from(clients)
          .where(accountEq(clients.orionClientId, accountData.clientId?.toString()));

        if (clientResults.length === 0) {
          console.warn(`No client found for account ${accountData.id} with client ID ${accountData.clientId}`);
          failed++;
          continue;
        }

        const result = await storeOrionAccountData(
          accountData,
          clientResults[0].id,
          firmConfig.id
        );

        if (result.success) {
          synced++;
        } else {
          console.error(`Failed to store account ${accountData.id}:`, result.error);
          failed++;
        }
      } catch (error) {
        console.error(`Error processing account ${accountData.id}:`, error);
        failed++;
      }
    }

    return res.json({
      success: true,
      synced,
      failed,
      message: `Synced ${synced} accounts, ${failed} failed`,
    });
  } catch (error) {
    console.error("Error syncing Orion accounts:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync Orion accounts",
    });
  }
}

/**
 * Get Orion AUM chart data handler - optimized for chart display
 */
export async function getOrionAumChartDataHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get firm integration config
    const firmConfig = await storage.getFirmIntegrationConfigByFirmId(user.organizationId);
    if (!firmConfig) {
      return res.status(400).json({
        success: false,
        error: "Firm integration config not found",
      });
    }

    // Get aggregation level from query params (default to monthly)
    const { aggregation = 'monthly', startDate, endDate } = req.query;

    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");

    let dateFormat: string;
    let groupByClause: string;

    // Determine aggregation level
    switch (aggregation) {
      case 'yearly':
        dateFormat = 'YYYY';
        groupByClause = "DATE_TRUNC('year', as_of_date)";
        break;
      case 'quarterly':
        dateFormat = 'YYYY-Q';
        groupByClause = "DATE_TRUNC('quarter', as_of_date)";
        break;
      case 'weekly':
        dateFormat = 'YYYY-WW';
        groupByClause = "DATE_TRUNC('week', as_of_date)";
        break;
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        groupByClause = "as_of_date";
        break;
      default: // monthly
        dateFormat = 'YYYY-MM';
        groupByClause = "DATE_TRUNC('month', as_of_date)";
    }

    // Build the query with optional date filtering
    let whereClause = `WHERE firm_integration_config_id = ${firmConfig.id}`;
    
    if (startDate) {
      whereClause += ` AND as_of_date >= '${startDate}'`;
    }
    
    if (endDate) {
      whereClause += ` AND as_of_date <= '${endDate}'`;
    }

    const query = `
      SELECT 
        ${groupByClause} as period,
        TO_CHAR(${groupByClause}, '${dateFormat}') as period_label,
        AVG(CAST(value AS DECIMAL)) as average_aum,
        COUNT(*) as data_points,
        MIN(as_of_date) as period_start,
        MAX(as_of_date) as period_end
      FROM orion_aum_history 
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    const result = await db.execute(sql.raw(query));

    // Transform the data for the chart
    const chartData = (result?.rows as any[]).map((row: any) => ({
      period: row.period_label,
      date: row.period_start,
      aum: parseFloat(row.average_aum),
      dataPoints: parseInt(row.data_points),
      periodStart: row.period_start,
      periodEnd: row.period_end,
    }));

    // Calculate summary statistics
    const totalRecords = chartData.length;
    const latestAum = chartData.length > 0 ? chartData[chartData.length - 1].aum : 0;
    const earliestAum = chartData.length > 0 ? chartData[0].aum : 0;
    const growth = earliestAum > 0 ? ((latestAum - earliestAum) / earliestAum) * 100 : 0;

    return res.json({
      success: true,
      data: chartData,
      summary: {
        totalRecords,
        latestAum,
        earliestAum,
        growth: parseFloat(growth.toFixed(2)),
        aggregation,
        dateRange: {
          start: chartData.length > 0 ? chartData[0].periodStart : null,
          end: chartData.length > 0 ? chartData[chartData.length - 1].periodEnd : null,
        },
      },
    });
  } catch (error) {
    console.error("Error getting Orion AUM chart data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get Orion AUM chart data",
    });
  }
} 