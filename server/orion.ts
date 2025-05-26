import { Request, Response } from "express";
import { storage } from "./storage";

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
 * Get Orion advisor auth token by user ID and firm integration config ID
 */
async function getOrionAdvisorAuthToken(
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
        eq(advisorAuthTokens.userId, userId),
        eq(advisorAuthTokens.firmIntegrationConfigId, firmIntegrationConfigId),
      ),
    );

  return results[0];
}

/**
 * Get Orion authentication token
 */
export async function getOrionToken(): Promise<{ success: boolean; refreshToken?: string; error?: string }> {
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
    
    if (data.refresh_token) {
      return { success: true, refreshToken: data.refresh_token };
    } else {
      console.error("No refresh_token in Orion response:", data);
      return { success: false, error: "No refresh_token received from Orion API" };
    }
  } catch (error) {
    console.error("Error getting Orion token:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Test connection to Orion API with a refresh token
 */
export async function testOrionConnection(refreshToken: string): Promise<boolean> {
  try {
    // Test the connection by making a simple API call
    const response = await fetch(`${ENDPOINTS.PORTFOLIO_CLIENTS}?limit=1`, {
      method: "GET",
      headers: {
        "Authorization": `Session ${refreshToken}`,
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
  refreshToken: string,
  clientId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(ENDPOINTS.AUM_OVER_TIME(clientId), {
      method: "GET",
      headers: {
        "Authorization": `Session ${refreshToken}`,
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
  refreshToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(ENDPOINTS.PORTFOLIO_CLIENTS, {
      method: "GET",
      headers: {
        "Authorization": `Session ${refreshToken}`,
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
    
    if (!tokenResult.success || !tokenResult.refreshToken) {
      return res.status(500).json({ 
        success: false, 
        message: tokenResult.error || "Failed to get Orion token" 
      });
    }

    // Test the connection
    const isConnected = await testOrionConnection(tokenResult.refreshToken);
    
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
    let advisorAuthToken = await getOrionAdvisorAuthToken(
      user.id,
      user.organizationId,
      firmIntegration.id
    );

    if (!advisorAuthToken) {
      advisorAuthToken = await storage.createAdvisorAuthToken({
        userId: user.id,
        firmIntegrationConfigId: firmIntegration.id,
        accessToken: tokenResult.refreshToken, // Using refresh token as access token for Orion
        refreshToken: tokenResult.refreshToken,
        tokenType: "Session",
        expiresAt: null, // Orion tokens don't seem to have expiry in the example
        scope: null,
        additionalData: {},
      });
    } else {
      // Update existing advisor auth token
      await storage.updateAdvisorAuthToken(advisorAuthToken.id, {
        ...advisorAuthToken,
        accessToken: tokenResult.refreshToken,
        refreshToken: tokenResult.refreshToken,
        tokenType: "Session",
        updatedAt: new Date(),
      });
    }

    return res.json({ 
      success: true, 
      message: "Orion connection established successfully",
      data: {
        firmIntegration,
        advisorAuthToken: {
          id: advisorAuthToken.id,
          tokenType: advisorAuthToken.tokenType,
          expiresAt: advisorAuthToken.expiresAt,
        }
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

    if (!advisorAuthToken || !advisorAuthToken.refreshToken) {
      return res.status(404).json({ 
        success: false, 
        message: "Orion token not found. Please connect to Orion first." 
      });
    }

    // Test the connection
    const isConnected = await testOrionConnection(advisorAuthToken.refreshToken);

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
    const isConnected = await testOrionConnection(advisorAuthToken.refreshToken || "");

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