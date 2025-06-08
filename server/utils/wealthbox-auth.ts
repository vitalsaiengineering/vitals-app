/**
 * Utilities for Wealthbox API authentication and token management
 */

import { storage } from '../storage';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Gets a valid Wealthbox access token for Bearer authentication
 * Automatically refreshes the token if it's expired
 */
export async function getValidWealthboxToken(userId: number): Promise<string | null> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.organizationId) {
      console.error('User or organization not found');
      return null;
    }

    // Get user's Wealthbox tokens from advisor_auth_tokens table
    const tokenData = await storage.getAdvisorAuthTokenByUserId(user.id, user.organizationId);
    if (!tokenData || !tokenData.accessToken || !tokenData.expiresAt) {
      console.error('No valid Wealthbox token found for user');
      return null;
    }

    // Check if token is expired (with 5-minute buffer)
    const now = new Date();
    const expiryTime = new Date(tokenData.expiresAt);
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (now.getTime() > (expiryTime.getTime() - bufferTime)) {
      console.log('Token is expired or about to expire, attempting to refresh...');
      
      // Only attempt refresh if we have a refresh token
      if (!tokenData.refreshToken) {
        console.error('No refresh token available');
        return null;
      }
      
      // Attempt to refresh the token
      const refreshedToken = await refreshWealthboxToken(tokenData.refreshToken, tokenData.id);
      if (refreshedToken) {
        return refreshedToken.access_token;
      } else {
        console.error('Failed to refresh token');
        return null;
      }
    }

    return tokenData.accessToken;
  } catch (error) {
    console.error('Error getting valid Wealthbox token:', error);
    return null;
  }
}

/**
 * Refreshes a Wealthbox access token using the refresh token
 */
async function refreshWealthboxToken(refreshToken: string, tokenId: number): Promise<TokenResponse | null> {
  try {
    const tokenUrl = "https://app.crmworkspace.com/oauth/token";
    
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "MbnIzrEtWejPZ96qHXFwxbkU1R9euNqfrSeynciUgL0",
      client_secret: "oWxszypXFkNm-SKLwpnwRBS2zbzWhTa2ciJDbAFTxJA"
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token refresh failed:", errorText);
      return null;
    }

    const tokenData: TokenResponse = await response.json();

    // Update the token in the database
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    const existingToken = await storage.getAdvisorAuthToken(tokenId);
    if (existingToken) {
      await storage.updateAdvisorAuthToken(tokenId, {
        ...existingToken,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || "Bearer",
        expiresAt: expiresAt,
        scope: tokenData.scope,
        updatedAt: new Date(),
      });
    }

    console.log('Token refreshed successfully');
    return tokenData;
  } catch (error) {
    console.error('Error refreshing Wealthbox token:', error);
    return null;
  }
}

/**
 * Creates headers for Wealthbox API requests with Bearer token authentication
 */
export function createWealthboxHeaders(accessToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Makes an authenticated request to the Wealthbox API
 */
export async function makeWealthboxRequest(
  userId: number,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response | null> {
  const accessToken = await getValidWealthboxToken(userId);
  if (!accessToken) {
    throw new Error('No valid Wealthbox access token available');
  }

  const headers = createWealthboxHeaders(accessToken);
  
  const response = await fetch(`https://api.crmworkspace.com/v1${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

/**
 * Convenient wrapper for GET requests to Wealthbox API using stored user tokens
 */
export async function fetchFromWealthboxWithUserToken(
  userId: number,
  endpoint: string
): Promise<any> {
  const response = await makeWealthboxRequest(userId, endpoint, { method: 'GET' });
  
  if (!response) {
    throw new Error('Failed to make request to Wealthbox API');
  }
  
  if (!response.ok) {
    throw new Error(`Wealthbox API request failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Gets a token for direct API calls (legacy support)
 * Use this for functions that still need to pass tokens directly
 */
export async function getWealthboxBearerToken(userId: number): Promise<string | null> {
  return await getValidWealthboxToken(userId);
} 