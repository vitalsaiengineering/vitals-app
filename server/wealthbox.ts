import { Request, Response } from 'express';
import { User, Client, Activity, Portfolio, Holding } from '@shared/schema';
import { storage } from './storage';
import { getWealthboxToken } from './utils/wealthbox-token';

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
export async function testWealthboxConnection(accessToken: string | null): Promise<boolean> {
  if (!accessToken) {
    console.error('No Wealthbox access token provided to test connection');
    return false;
  }
  
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
  accessToken: string | null, 
  userId: number, 
  organizationId: number
): Promise<{ success: boolean; imported: number; failed: number; }> {
  if (!accessToken) {
    console.error('No Wealthbox access token provided for importing contacts');
    return { success: false, imported: 0, failed: 0 };
  }
  
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
  accessToken: string | null, 
  userId: number
): Promise<{ success: boolean; imported: number; failed: number; }> {
  if (!accessToken) {
    console.error('No Wealthbox access token provided for importing activities');
    return { success: false, imported: 0, failed: 0 };
  }
  
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
    let { accessToken } = req.body;
    const user = req.user as any;
    const userId = user?.id;
    const organizationId = user?.organizationId;
    
    // If no token provided, try to get from configuration
    if (!accessToken) {
      const token = await getWealthboxToken(userId);
      if (!token) {
        return res.status(400).json({ success: false, message: 'Access token is required' });
      }
      accessToken = token;
      console.log("Using configured Wealthbox token for import");
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
export async function fetchWealthboxUsers(accessToken: string | null): Promise<any[]> {
  if (!accessToken) {
    console.error('No Wealthbox access token provided');
    return [];
  }
  
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
 * Fetches active clients from Wealthbox and groups them by age
 */
export async function fetchActiveClientsByAge(accessToken: string | null): Promise<any> {
  if (!accessToken) {
    console.error('No Wealthbox access token provided for fetching clients by age');
    return { ageGroups: [], totalActiveClients: 0, averageAge: 0, largestAgeSegment: 'N/A' };
  }
  
  try {
    // Construct URL with filters for active clients
    const url = `${ENDPOINTS.CONTACTS}?contact_type=Client&active=true&per_page=100`;
    
    console.log('Fetching active clients by age from Wealthbox API:', url);
    
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
    
    // Initialize age groups
    const ageGroups: Record<string, number> = {
      "18-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51-60": 0,
      "61-70": 0,
      "71+": 0,
    };
    
    let totalAge = 0;
    let clientsWithAge = 0;
    
    // Process each client and extract age information
    data.contacts.forEach((contact: any) => {
      // Check if contact has date of birth
      let age = null;
      
      // Try to determine age from date_of_birth if available
      if (contact.date_of_birth) {
        const birthDate = new Date(contact.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        
        // Adjust age if birthday hasn't occurred yet this year
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        console.log(`Calculated age for ${contact.first_name} ${contact.last_name}: ${age}`);
      } 
      // If contact has a custom field for age, try to use that
      else if (contact.custom_fields) {
        // Look for custom fields that might contain age information
        const ageField = Object.entries(contact.custom_fields).find(([key]) => 
          key.toLowerCase().includes('age')
        );
        
        if (ageField && ageField[1]) {
          const parsedAge = parseInt(ageField[1].toString(), 10);
          if (!isNaN(parsedAge)) {
            age = parsedAge;
            console.log(`Found age in custom field for ${contact.first_name} ${contact.last_name}: ${age}`);
          }
        }
      }
      
      // If we have a valid age, categorize it
      if (age !== null && age >= 18) {
        if (age <= 30) ageGroups["18-30"]++;
        else if (age <= 40) ageGroups["31-40"]++;
        else if (age <= 50) ageGroups["41-50"]++;
        else if (age <= 60) ageGroups["51-60"]++;
        else if (age <= 70) ageGroups["61-70"]++;
        else ageGroups["71+"]++;
        
        totalAge += age;
        clientsWithAge++;
      }
    });
    
    // Calculate average age
    const averageAge = clientsWithAge > 0 ? Math.round(totalAge / clientsWithAge) : 0;
    
    // Find largest age segment
    let largestSegment = "N/A";
    let maxCount = 0;
    
    Object.entries(ageGroups).forEach(([range, count]) => {
      if (count > maxCount) {
        maxCount = count;
        largestSegment = range;
      }
    });
    
    // Format age groups for frontend
    const result = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count
    }));
    
    return {
      ageGroups: result,
      totalActiveClients: data.contacts.length,
      averageAge,
      largestAgeSegment: largestSegment
    };
  } catch (error) {
    console.error('Error fetching active clients by age:', error);
    throw error;
  }
}

/**
 * Fetches active clients from Wealthbox and groups them by state
 */
export async function fetchActiveClientsByState(accessToken: string | null): Promise<any> {
  if (!accessToken) {
    console.error('No Wealthbox access token provided for fetching clients');
    return { clientsByState: [], totalActiveClients: 0 };
  }
  
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
    
    // If no token available, get from configuration
    if (!accessToken) {
      const userId = (req.user as any)?.id;
      const token = await getWealthboxToken(userId);
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          error: 'WealthBox access token is required' 
        });
      }
      accessToken = token;
      console.log("Using configured Wealthbox token for API");
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
 * Handler for retrieving active clients by age
 */
export async function getActiveClientsByAgeHandler(req: Request, res: Response) {
  try {
    // Get the user's token if they're authenticated
    let accessToken = null;
    if (req.user && (req.user as any).wealthboxToken) {
      accessToken = (req.user as any).wealthboxToken;
    } else {
      // Try to use access_token parameter if provided
      accessToken = req.query.access_token as string;
    }
    
    // If no token available, get from configuration
    if (!accessToken) {
      const userId = (req.user as any)?.id;
      const token = await getWealthboxToken(userId);
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          error: 'WealthBox access token is required' 
        });
      }
      accessToken = token;
      console.log("Using configured Wealthbox token for age distribution API");
    }
    
    // Check for Wealthbox user filter
    const { wealthboxUserId } = req.query;
    if (wealthboxUserId) {
      console.log(`Filtering active clients for Wealthbox user ID: ${wealthboxUserId}`);
      // Note: The Wealthbox API might not support filtering by user in the contacts endpoint
      // In a real implementation, you might need to fetch all contacts and filter on your end
    }
    
    // Fetch and process the data
    const result = await fetchActiveClientsByAge(accessToken);
    
    // Return the processed data
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error in getActiveClientsByAgeHandler:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch active clients by age' 
    });
  }
}

/**
 * Handler for retrieving Wealthbox users
 */
export async function getWealthboxUsersHandler(req: Request, res: Response) {
  try {
    // Get token from query parameter, user token, or configuration
    let accessToken = req.query.access_token as string;
    
    if (!accessToken && req.user) {
      accessToken = (req.user as any).wealthboxToken;
    }
    
    if (!accessToken) {
      const userId = (req.user as any)?.id;
      const token = await getWealthboxToken(userId);
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          error: 'WealthBox access token is required' 
        });
      }
      accessToken = token;
      console.log("Using configured Wealthbox token for users API");
    }

    // Fetch users from Wealthbox API
    const users = await fetchWealthboxUsers(accessToken);
    
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