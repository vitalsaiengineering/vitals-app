/**
 * Utilities for managing Wealthbox API tokens
 */

import config from '../config';
import { storage } from '../storage';

/**
 * Gets the appropriate Wealthbox API token based on user and context
 * 
 * @param userId User ID - if provided, will attempt to get user's token first
 * @returns API token to use for Wealthbox API calls
 */
export async function getWealthboxToken(userId?: number): Promise<string | null> {
  // If a user ID is provided, try to get their Wealthbox token
  if (userId) {
    const user = await storage.getUser(userId);
    if (user?.wealthboxToken) {
      return user.wealthboxToken;
    }
  }
  
  // Fall back to the default token from environment variables
  return config.wealthbox.defaultToken;
}

/**
 * Checks if a Wealthbox token is available
 * 
 * @param userId User ID (optional)
 * @returns True if a token is available, false otherwise
 */
export async function hasWealthboxToken(userId?: number): Promise<boolean> {
  const token = await getWealthboxToken(userId);
  return !!token;
}