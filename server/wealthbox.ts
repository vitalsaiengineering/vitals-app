import { Request, Response } from 'express';
import { User, Client, Activity, Portfolio, Holding } from '@shared/schema';
import { storage } from './storage';

// Wealthbox API base URL
const WEALTHBOX_API_BASE_URL = 'https://api.crmworkspace.com/v1';

// Wealthbox API endpoints
const ENDPOINTS = {
  CONTACTS: `${WEALTHBOX_API_BASE_URL}/contacts`,
  ACTIVITIES: `${WEALTHBOX_API_BASE_URL}/activities`,
  WORKFLOWS: `${WEALTHBOX_API_BASE_URL}/workflows`,
  PORTFOLIOS: `${WEALTHBOX_API_BASE_URL}/portfolios`,  // Assuming this exists
  HOLDINGS: `${WEALTHBOX_API_BASE_URL}/holdings`,      // Assuming this exists
};

/**
 * Tests connection to Wealthbox API with the provided access token
 */
export async function testWealthboxConnection(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.CONTACTS}?limit=1`, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      return true;
    }
    
    console.error(`Wealthbox API connection failed: ${response.status} ${response.statusText}`);
    return false;
  } catch (error) {
    console.error('Error connecting to Wealthbox API:', error);
    return false;
  }
}

/**
 * Import contacts from Wealthbox and store them as clients
 */
export async function importWealthboxContacts(
  accessToken: string, 
  userId: number, 
  organizationId: number
): Promise<{ success: boolean; imported: number; failed: number; }> {
  try {
    // Get all contacts from Wealthbox (paginated)
    let allContacts = await fetchAllContacts(accessToken);
    
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let imported = 0;
    let failed = 0;

    // Process each contact
    for (const contact of allContacts) {
      try {
        // Map Wealthbox contact to our client model
        const client = mapWealthboxContactToClient(contact, organizationId, userId);
        
        // Store the client in our system
        await storage.upsertClientByWealthboxId(contact.id.toString(), client);
        imported++;
      } catch (error) {
        console.error(`Failed to import contact ${contact.id}:`, error);
        failed++;
      }
    }

    return { success: true, imported, failed };
  } catch (error) {
    console.error('Error importing Wealthbox contacts:', error);
    return { success: false, imported: 0, failed: 0 };
  }
}

/**
 * Import activities from Wealthbox
 */
export async function importWealthboxActivities(
  accessToken: string, 
  userId: number
): Promise<{ success: boolean; imported: number; failed: number; }> {
  try {
    // Get all activities from Wealthbox (paginated)
    let allActivities = await fetchAllActivities(accessToken);
    
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let imported = 0;
    let failed = 0;

    // Process each activity
    for (const activity of allActivities) {
      try {
        // We need to find the client for this activity
        let clientId: number | null = null;
        
        if (activity.contact_ids && activity.contact_ids.length > 0) {
          // Find the first client that matches any of the contact_ids
          const clients = await storage.getClientsByAdvisor(userId);
          const matchingClient = clients.find(c => 
            c.wealthboxClientId && activity.contact_ids.includes(c.wealthboxClientId)
          );
          
          if (matchingClient) {
            clientId = matchingClient.id;
          }
        }
        
        // If we couldn't find a client, skip this activity
        if (!clientId) {
          console.warn(`No matching client found for activity ${activity.id}`);
          failed++;
          continue;
        }
        
        // Map Wealthbox activity to our activity model
        const mappedActivity = mapWealthboxActivityToActivity(activity, userId, clientId);
        
        // Store the activity in our system
        await storage.upsertActivityByWealthboxId(activity.id.toString(), mappedActivity);
        imported++;
      } catch (error) {
        console.error(`Failed to import activity ${activity.id}:`, error);
        failed++;
      }
    }

    return { success: true, imported, failed };
  } catch (error) {
    console.error('Error importing Wealthbox activities:', error);
    return { success: false, imported: 0, failed: 0 };
  }
}

/**
 * Handles requests to test Wealthbox connection
 */
export async function testWealthboxConnectionHandler(req: Request, res: Response) {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token is required' });
    }

    const isConnected = await testWealthboxConnection(accessToken);
    
    if (isConnected) {
      return res.json({ success: true, message: 'Successfully connected to Wealthbox API' });
    } else {
      return res.status(401).json({ success: false, message: 'Failed to connect to Wealthbox API' });
    }
  } catch (error) {
    console.error('Error in testWealthboxConnectionHandler:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Handles requests to import data from Wealthbox
 */
export async function importWealthboxDataHandler(req: Request, res: Response) {
  try {
    const { accessToken } = req.body;
    const user = req.user as any;
    const userId = user?.id;
    const organizationId = user?.organizationId;
    
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token is required' });
    }

    if (!userId || !organizationId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // First test the connection
    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return res.status(401).json({ success: false, message: 'Failed to connect to Wealthbox API' });
    }

    // Import contacts
    const contactsResult = await importWealthboxContacts(accessToken, userId, organizationId);
    
    // Import activities
    const activitiesResult = await importWealthboxActivities(accessToken, userId);
    
    // Return combined results
    return res.json({
      success: contactsResult.success && activitiesResult.success,
      contacts: {
        imported: contactsResult.imported,
        failed: contactsResult.failed
      },
      activities: {
        imported: activitiesResult.imported,
        failed: activitiesResult.failed
      }
    });
  } catch (error) {
    console.error('Error in importWealthboxDataHandler:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Fetches all contacts from Wealthbox using pagination
 */
async function fetchAllContacts(accessToken: string, limit: number = 100): Promise<any[]> {
  let allContacts: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${ENDPOINTS.CONTACTS}?limit=${limit}&page=${page}`, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    allContacts = [...allContacts, ...data.contacts];
    
    // Check if there are more pages
    hasMore = data.contacts.length === limit;
    page++;
  }
  
  return allContacts;
}

/**
 * Fetches all activities from Wealthbox using pagination
 */
async function fetchAllActivities(accessToken: string, limit: number = 100): Promise<any[]> {
  let allActivities: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${ENDPOINTS.ACTIVITIES}?limit=${limit}&page=${page}`, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    allActivities = [...allActivities, ...data.activities];
    
    // Check if there are more pages
    hasMore = data.activities.length === limit;
    page++;
  }
  
  return allActivities;
}

/**
 * Maps a Wealthbox contact to our client model
 */
function mapWealthboxContactToClient(contact: any, organizationId: number, advisorId: number): Partial<Client> {
  // Example mapping - adjust based on actual Wealthbox API response structure
  return {
    name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    email: contact.email || null,
    organizationId,
    advisorId,
    address: contact.addresses && contact.addresses.length > 0 ? 
      `${contact.addresses[0].street || ''}, ${contact.addresses[0].city || ''}, ${contact.addresses[0].state || ''} ${contact.addresses[0].zip || ''}`.trim() : 
      null,
    state: contact.addresses && contact.addresses.length > 0 ? contact.addresses[0].state || null : null,
    age: contact.age || null, // Assuming Wealthbox has this field
    aum: contact.aum || null, // Assuming Wealthbox has this field
    revenue: contact.revenue || null, // Assuming Wealthbox has this field
    wealthboxClientId: contact.id.toString(),
    metadata: contact // Store the full Wealthbox contact for reference
  };
}

/**
 * Maps a Wealthbox activity to our activity model
 */
function mapWealthboxActivityToActivity(activity: any, advisorId: number, clientId: number): Partial<Activity> {
  // Example mapping - adjust based on actual Wealthbox API response structure
  return {
    date: new Date(activity.created_at || activity.date || Date.now()),
    title: activity.title || activity.summary || 'Untitled Activity',
    type: activity.type || 'other',
    advisorId,
    clientId,
    description: activity.description || activity.notes || null,
    wealthboxActivityId: activity.id.toString(),
    metadata: activity // Store the full Wealthbox activity for reference
  };
}