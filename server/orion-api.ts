import axios from 'axios';
import { Request, Response } from 'express';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { advisorAuthTokens, integrationTypes, firmIntegrationConfigs } from '@shared/schema';
import { log } from './vite';

// Orion API configuration
const ORION_API_BASE_URL = 'https://stagingapi.orionadvisor.com/api/v1';
const ORION_CLIENT_ID = '2112';
const ORION_CLIENT_SECRET = '4dc339e2-7ab1-41cb-8d7f-104262ab4ed4';
const ORION_INTEGRATION_TYPE_ID = 2;

/**
 * Makes a request to get an Orion API token
 */
export async function getOrionToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    
    const userId = req.user.id;

    const basicAuth = 'Basic c3VwcG9ydEBhZHZpc29ydml0YWxzLmNvbTp0ZW5vUHlaOXppeFJveXlmZnFNQw==';

    const response = await axios.get(
      `${ORION_API_BASE_URL}/security/token`,
      {
        headers: {
          'Client_id': ORION_CLIENT_ID,
          'Client_secret': ORION_CLIENT_SECRET,
          'Authorization': basicAuth
        }
      }
    );

    if (response.data && response.data.refresh_token) {
      // Store the refresh token in the database
      const refreshToken = response.data.refresh_token;
      
      // Check if a token already exists for this user and integration type
      const existingToken = await db.select().from(advisor_auth_tokens).where(
        and(
          eq(advisor_auth_tokens.advisor_id, userId),
          eq(advisor_auth_tokens.integration_type_id, ORION_INTEGRATION_TYPE_ID)
        )
      );

      if (existingToken.length > 0) {
        // Update existing token
        await db.update(advisor_auth_tokens)
          .set({ 
            access_token: refreshToken,
            updated_at: new Date() 
          })
          .where(
            and(
              eq(advisor_auth_tokens.advisor_id, userId),
              eq(advisor_auth_tokens.integration_type_id, ORION_INTEGRATION_TYPE_ID)
            )
          );
      } else {
        // Insert new token
        await db.insert(advisor_auth_tokens).values({
          advisor_id: userId,
          integration_type_id: ORION_INTEGRATION_TYPE_ID,
          access_token: refreshToken,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      res.json({ 
        success: true, 
        message: 'Successfully connected to Orion API'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to get refresh token from Orion API'
      });
    }
  } catch (error: any) {
    console.error('Error connecting to Orion API:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect to Orion API'
    });
  }
}

/**
 * Gets the status of the Orion connection for the current user
 */
export async function getOrionStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if a token exists for this user and integration type
    const tokens = await db.select().from(advisor_auth_tokens).where(
      and(
        eq(advisor_auth_tokens.advisor_id, userId),
        eq(advisor_auth_tokens.integration_type_id, ORION_INTEGRATION_TYPE_ID)
      )
    );

    if (tokens.length > 0) {
      res.json({
        connected: true,
        message: 'Connected to Orion API'
      });
    } else {
      res.json({
        connected: false,
        message: 'Not connected to Orion API'
      });
    }
  } catch (error: any) {
    console.error('Error checking Orion connection status:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check Orion connection status'
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<any> {
  // Get the token from the database
  const tokens = await db.select().from(advisor_auth_tokens).where(
    and(
      eq(advisor_auth_tokens.advisor_id, userId),
      eq(advisor_auth_tokens.integration_type_id, ORION_INTEGRATION_TYPE_ID)
    )
  );

  if (tokens.length === 0) {
    throw new Error('No Orion token found for this user');
  }

  const refreshToken = tokens[0].access_token;

  // Make the API request
  const response = await axios({
    method,
    url: `${ORION_API_BASE_URL}/${endpoint.replace(/^\//, '')}`, // Remove leading slash if present
    headers: {
      'Authorization': `Session ${refreshToken}`,
      'Client_id': ORION_CLIENT_ID,
      'Client_secret': ORION_CLIENT_SECRET
    },
    data
  });

  return response.data;
}

/**
 * Example endpoint to get AUM over time for a client
 */
export async function getClientAumOverTime(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.session?.userId;
    const clientId = req.params.clientId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!clientId) {
      res.status(400).json({ success: false, message: 'Client ID is required' });
      return;
    }

    const data = await callOrionApi(userId, `Portfolio/Clients/${clientId}/AumOverTime`);
    
    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error getting client AUM over time:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get client AUM over time'
    });
  }
}