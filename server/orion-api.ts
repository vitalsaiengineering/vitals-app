/**
 * Orion API integration
 * This file contains functions to interact with the Orion Portfolio Solutions API
 */
import { Request, Response } from "express";
import axios from "axios";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { advisorAuthTokens, User } from "@shared/schema";

// Orion API constants
const ORION_API_BASE_URL = "https://stagingapi.orionadvisor.com/api/v1";
const ORION_INTEGRATION_TYPE = 2; // Use type 2 for Orion, assuming 1 is for WealthBox

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Gets an Orion API token
 */
export async function getOrionToken(
  req: Request,
  res: Response
) {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    // Redirect to Orion authorization endpoint
    // For now, we'll simulate the OAuth flow by getting a token directly
    // In a real implementation, we would redirect the user to Orion's OAuth page
    
    // Make request to get token
    const tokenResponse = await axios.post(
      `${ORION_API_BASE_URL}/security/token`,
      {
        grant_type: "client_credentials",
        // In a real implementation, these would be stored in environment variables
        client_id: process.env.ORION_CLIENT_ID || "your-client-id",
        client_secret: process.env.ORION_CLIENT_SECRET || "your-client-secret"
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const tokenData = tokenResponse.data as TokenResponse;
    
    if (tokenData.refresh_token) {
      // Store the refresh token in the database for this user
      const existingToken = await db.select()
        .from(advisorAuthTokens)
        .where(
          and(
            eq(advisorAuthTokens.advisorId, req.user.id),
            eq(advisorAuthTokens.integrationType, ORION_INTEGRATION_TYPE)
          )
        )
        .limit(1);

      if (existingToken.length > 0) {
        // Update existing token
        await db.update(advisorAuthTokens)
          .set({
            accessToken: tokenData.refresh_token,
            expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000)
          })
          .where(eq(advisorAuthTokens.id, existingToken[0].id));
      } else {
        // Insert new token
        await db.insert(advisorAuthTokens)
          .values({
            advisorId: req.user.id,
            integrationType: ORION_INTEGRATION_TYPE,
            accessToken: tokenData.refresh_token,
            expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000)
          });
      }

      return res.json({
        success: true,
        message: "Successfully connected to Orion API"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to obtain refresh token from Orion API"
      });
    }
  } catch (error: any) {
    console.error("Error connecting to Orion API:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to connect to Orion API"
    });
  }
}

/**
 * Gets the status of the Orion connection for the current user
 */
export async function getOrionStatus(
  req: Request,
  res: Response
) {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ connected: false, message: "Unauthorized" });
  }

  try {
    // Check if a token exists for this user
    const tokens = await db.select()
      .from(advisorAuthTokens)
      .where(
        and(
          eq(advisorAuthTokens.advisorId, req.user.id),
          eq(advisorAuthTokens.integrationType, ORION_INTEGRATION_TYPE)
        )
      )
      .limit(1);

    if (tokens.length === 0) {
      return res.json({
        connected: false,
        message: "Not connected to Orion"
      });
    }

    const token = tokens[0];
    
    // Check if token is expired
    if (token.expiresAt && token.expiresAt < new Date()) {
      return res.json({
        connected: false,
        message: "Orion connection expired, please reconnect"
      });
    }

    return res.json({
      connected: true,
      message: "Connected to Orion API"
    });
  } catch (error: any) {
    console.error("Error checking Orion status:", error);
    return res.status(500).json({
      connected: false,
      message: error.message || "Error checking Orion connection status"
    });
  }
}

/**
 * Makes a request to the Orion API using the stored refresh token
 * @param userId The user ID to use for looking up the token
 * @param endpoint The API endpoint to call (without the base URL)
 * @param method The HTTP method to use
 * @param data Optional data to send with the request
 * @returns The API response data
 */
export async function callOrionApi(
  userId: number,
  endpoint: string,
  method: string = "GET",
  data?: any
): Promise<any> {
  // Get the refresh token for this user
  const tokens = await db.select()
    .from(advisorAuthTokens)
    .where(
      and(
        eq(advisorAuthTokens.advisorId, userId),
        eq(advisorAuthTokens.integrationType, ORION_INTEGRATION_TYPE)
      )
    )
    .limit(1);

  if (tokens.length === 0) {
    throw new Error("No Orion API token found for this user");
  }

  const token = tokens[0];
  
  // Check if token is expired
  if (token.expiresAt && token.expiresAt < new Date()) {
    throw new Error("Orion API token has expired");
  }

  // Make the API request using the refresh token
  const response = await axios({
    method,
    url: `${ORION_API_BASE_URL}/${endpoint}`,
    headers: {
      "Authorization": `Bearer ${token.accessToken}`,
      "Content-Type": "application/json"
    },
    data: data
  });

  return response.data;
}

/**
 * Example endpoint to get AUM over time for a client
 */
export async function getClientAumOverTime(
  req: Request,
  res: Response
) {
  const { clientId } = req.params;

  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    // Call Orion API to get client AUM data
    // This is a placeholder implementation - in a real app, you would call the actual Orion API endpoint
    // const aumData = await callOrionApi(req.user.id, `portfolio/client/${clientId}/aum`);
    
    // For now, return sample data
    const aumData = [
      { date: "2022-01-01", aum: 1200000 },
      { date: "2022-02-01", aum: 1250000 },
      { date: "2022-03-01", aum: 1300000 },
      { date: "2022-04-01", aum: 1280000 },
      { date: "2022-05-01", aum: 1320000 },
      { date: "2022-06-01", aum: 1350000 },
    ];

    return res.json(aumData);
  } catch (error: any) {
    console.error("Error getting client AUM data:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get client AUM data"
    });
  }
}