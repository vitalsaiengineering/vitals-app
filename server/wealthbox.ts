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
  USERS: `${WEALTHBOX_API_BASE_URL}/users`,            // Users endpoint from API docs
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

/**
 * Fetches all users from Wealthbox API
 */
export async function fetchWealthboxUsers(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${ENDPOINTS.USERS}`, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error fetching Wealthbox users:', error);
    throw error;
  }
}

/**
 * Fetches active clients from Wealthbox and groups them by state
 */
export async function fetchActiveClientsByState(accessToken: string): Promise<any> {
  try {
    // Construct URL with filters for active clients
    const url = `${ENDPOINTS.CONTACTS}?contact_type=Client&active=true&per_page=100`;
    
    console.log('Fetching active clients by state from Wealthbox API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch active clients: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch active clients: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.contacts?.length || 0} active clients from Wealthbox`);
    
    // Group clients by state
    const clientsByState: Record<string, number> = {};
    
    // Process each client and extract state information
    data.contacts.forEach((contact: any) => {
      // Check for street addresses
      let state = 'Unknown';
      
      // Log the contact structure to debug address fields
      console.log(`Processing contact: ${contact.id} - ${contact.first_name} ${contact.last_name}`);
      console.log('Address fields:', JSON.stringify({
        hasStreetAddresses: !!contact.street_addresses,
        hasAddresses: !!contact.addresses,
        email: contact.email || contact.email_address || (contact.email_addresses && contact.email_addresses.length > 0 ? contact.email_addresses[0].address : null)
      }));
      
      // Try street_addresses first (as per API docs)
      if (contact.street_addresses && contact.street_addresses.length > 0) {
        const principalAddress = contact.street_addresses.find((addr: any) => addr.principal) || contact.street_addresses[0];
        state = principalAddress.state || 'Unknown';
        console.log(`Found state in street_addresses: ${state}`);
      }
      // Fall back to addresses if available
      else if (contact.addresses && contact.addresses.length > 0) {
        const principalAddress = contact.addresses.find((addr: any) => addr.principal) || contact.addresses[0];
        state = principalAddress.state || 'Unknown';
        console.log(`Found state in addresses: ${state}`);
      }
      
      // Increment count for this state
      if (state in clientsByState) {
        clientsByState[state]++;
      } else {
        clientsByState[state] = 1;
      }
    });
    
    // Convert to format expected by frontend
    const result = Object.entries(clientsByState).map(([state, count]) => ({
      state,
      count,
      percentage: Math.round((count / data.contacts.length) * 100) / 100
    }));
    
    // Sort by count descending
    result.sort((a, b) => b.count - a.count);
    
    return {
      clientsByState: result,
      totalActiveClients: data.contacts.length
    };
  } catch (error) {
    console.error('Error fetching active clients by state:', error);
    throw error;
  }
}

/**
 * Handler for retrieving active clients by state
 */
export async function getActiveClientsByStateHandler(req: Request, res: Response) {
  try {
    // Get the user's token if they're authenticated
    let accessToken = null;
    if (req.user && (req.user as any).wealthboxToken) {
      accessToken = (req.user as any).wealthboxToken;
    } else {
      // Try to use access_token parameter if provided
      accessToken = req.query.access_token as string;
    }
    
    // If no token available, fall back to development token
    if (!accessToken) {
      accessToken = "a362b9c57ca349e5af99a6d8d4af6b3a";
      console.log("Using default development token for Wealthbox API");
    }
    
    // Check for Wealthbox user filter
    const { wealthboxUserId } = req.query;
    if (wealthboxUserId) {
      console.log(`Filtering active clients for Wealthbox user ID: ${wealthboxUserId}`);
      // Note: The Wealthbox API might not support filtering by user in the contacts endpoint
      // In a real implementation, you might need to fetch all contacts and filter on your end
    }
    
    // Fetch and process the data
    const result = await fetchActiveClientsByState(accessToken);
    
    // Return the processed data
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in getActiveClientsByStateHandler:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch active clients by state' 
    });
  }
}

/**
 * Handler for retrieving Wealthbox users
 */
export async function getWealthboxUsersHandler(req: Request, res: Response) {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'WealthBox access token is required' 
      });
    }

    // Fetch users from Wealthbox API
    const users = await fetchWealthboxUsers(access_token as string);
    
    // Return the users
    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching Wealthbox users:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch Wealthbox users' 
    });
  }
}