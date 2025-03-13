import { storage } from './storage';
import { Client, Activity } from '@shared/schema';

// Wealthbox API base URL
const WEALTHBOX_API_BASE_URL = 'https://api.crmworkspace.com/v1';

// Wealthbox API endpoints
const ENDPOINTS = {
  CONTACTS: `${WEALTHBOX_API_BASE_URL}/contacts`,
  ACTIVITIES: `${WEALTHBOX_API_BASE_URL}/activities`,
  OPPORTUNITIES: `${WEALTHBOX_API_BASE_URL}/opportunities`,
  USERS: `${WEALTHBOX_API_BASE_URL}/users`,
};

// Track last sync time for different resources
interface SyncState {
  contacts: Date | null;
  activities: Date | null;
  opportunities: Date | null;
}

// Global sync state
const syncState: SyncState = {
  contacts: null,
  activities: null,
  opportunities: null,
};

/**
 * Synchronize data from Wealthbox since the last sync
 * @param accessToken Wealthbox API access token
 * @param userId User ID in our system
 * @param organizationId Organization ID in our system
 */
export async function synchronizeWealthboxData(
  accessToken: string,
  userId: number,
  organizationId: number
): Promise<{ success: boolean; results: any }> {
  try {
    // Check if token is valid
    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return { 
        success: false, 
        results: { error: 'Invalid Wealthbox access token' } 
      };
    }

    // Initialize results object
    const results = {
      contacts: { updated: 0, unchanged: 0, failed: 0 },
      activities: { updated: 0, unchanged: 0, failed: 0 },
      opportunities: { updated: 0, unchanged: 0, failed: 0 },
    };

    // Sync contacts (clients)
    const contactsResult = await syncContacts(accessToken, userId, organizationId);
    results.contacts = contactsResult;

    // Sync activities
    const activitiesResult = await syncActivities(accessToken, userId);
    results.activities = activitiesResult;

    // Update sync state timestamps
    syncState.contacts = new Date();
    syncState.activities = new Date();

    return { success: true, results };
  } catch (error) {
    console.error('Error synchronizing Wealthbox data:', error);
    return { 
      success: false, 
      results: { error: 'Failed to synchronize data' } 
    };
  }
}

/**
 * Tests connection to Wealthbox API with the provided access token
 */
async function testWealthboxConnection(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINTS.CONTACTS}?limit=1`, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error connecting to Wealthbox API:', error);
    return false;
  }
}

/**
 * Synchronize contacts from Wealthbox since the last sync
 */
async function syncContacts(
  accessToken: string,
  userId: number,
  organizationId: number
): Promise<{ updated: number; unchanged: number; failed: number }> {
  try {
    // Construct URL with filters for updated contacts
    let url = `${ENDPOINTS.CONTACTS}?per_page=100`;
    
    // Add updated_since filter if we have a previous sync timestamp
    if (syncState.contacts) {
      const formattedDate = syncState.contacts.toISOString();
      url += `&updated_since=${formattedDate}`;
    }
    
    console.log(`Syncing contacts updated since: ${syncState.contacts || 'initial sync'}`);
    
    // Fetch updated contacts
    const contacts = await fetchAllPages(accessToken, url);
    
    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    // Process each contact
    for (const contact of contacts) {
      try {
        // Map Wealthbox contact to our client model
        const client = mapWealthboxContactToClient(contact, organizationId, userId);
        
        // Check if contact exists in our system
        const existingClient = await findClientByWealthboxId(contact.id.toString());
        
        if (existingClient) {
          // If contact exists and updated_at is newer, update it
          const existingUpdatedAt = existingClient.metadata && typeof existingClient.metadata === 'object' && 'updated_at' in existingClient.metadata ? 
            new Date(existingClient.metadata.updated_at as string) : 
            new Date(0);
          
          const contactUpdatedAt = new Date(contact.updated_at);
          
          if (contactUpdatedAt > existingUpdatedAt) {
            // Update the client in our system
            await storage.upsertClientByWealthboxId(contact.id.toString(), client);
            updated++;
          } else {
            unchanged++;
          }
        } else {
          // If contact doesn't exist, create it
          await storage.upsertClientByWealthboxId(contact.id.toString(), client);
          updated++;
        }
      } catch (error) {
        console.error(`Failed to sync contact ${contact.id}:`, error);
        failed++;
      }
    }

    return { updated, unchanged, failed };
  } catch (error) {
    console.error('Error syncing contacts:', error);
    return { updated: 0, unchanged: 0, failed: 0 };
  }
}

/**
 * Synchronize activities from Wealthbox since the last sync
 */
async function syncActivities(
  accessToken: string,
  userId: number
): Promise<{ updated: number; unchanged: number; failed: number }> {
  try {
    // Construct URL with filters for updated activities
    let url = `${ENDPOINTS.ACTIVITIES}?per_page=100`;
    
    // Add updated_since filter if we have a previous sync timestamp
    if (syncState.activities) {
      const formattedDate = syncState.activities.toISOString();
      url += `&updated_since=${formattedDate}`;
    }
    
    console.log(`Syncing activities updated since: ${syncState.activities || 'initial sync'}`);
    
    // Fetch updated activities
    const activities = await fetchAllPages(accessToken, url);
    
    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    // Process each activity
    for (const activity of activities) {
      try {
        // Find the associated client
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
        
        // Check if activity exists in our system
        const existingActivity = await findActivityByWealthboxId(activity.id.toString());
        
        if (existingActivity) {
          // If activity exists and updated_at is newer, update it
          const existingUpdatedAt = existingActivity.metadata && typeof existingActivity.metadata === 'object' && 'updated_at' in existingActivity.metadata ? 
            new Date(existingActivity.metadata.updated_at as string) : 
            new Date(0);
          
          const activityUpdatedAt = new Date(activity.updated_at);
          
          if (activityUpdatedAt > existingUpdatedAt) {
            // Update the activity in our system
            await storage.upsertActivityByWealthboxId(activity.id.toString(), mappedActivity);
            updated++;
          } else {
            unchanged++;
          }
        } else {
          // If activity doesn't exist, create it
          await storage.upsertActivityByWealthboxId(activity.id.toString(), mappedActivity);
          updated++;
        }
      } catch (error) {
        console.error(`Failed to sync activity ${activity.id}:`, error);
        failed++;
      }
    }

    return { updated, unchanged, failed };
  } catch (error) {
    console.error('Error syncing activities:', error);
    return { updated: 0, unchanged: 0, failed: 0 };
  }
}

/**
 * Fetch all pages of results from a paginated API endpoint
 */
async function fetchAllPages(accessToken: string, initialUrl: string): Promise<any[]> {
  let allResults: any[] = [];
  let url = initialUrl;
  let hasMorePages = true;
  let page = 1;
  
  while (hasMorePages) {
    const pageUrl = url.includes('page=') ? 
      url.replace(/page=\d+/, `page=${page}`) : 
      `${url}&page=${page}`;
    
    const response = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        'ACCESS_TOKEN': accessToken,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract results based on endpoint type
    let results: any[] = [];
    if (pageUrl.includes('/contacts')) {
      results = data.contacts || [];
    } else if (pageUrl.includes('/activities')) {
      results = data.activities || [];
    } else if (pageUrl.includes('/opportunities')) {
      results = data.opportunities || [];
    } else {
      results = data.results || [];
    }
    
    allResults = [...allResults, ...results];
    
    // Check if there are more pages (assuming 100 per page)
    hasMorePages = results.length === 100;
    page++;
  }
  
  return allResults;
}

/**
 * Find a client by Wealthbox ID
 */
async function findClientByWealthboxId(wealthboxId: string): Promise<Client | null> {
  // This is a simplified implementation - in a real app you'd use a proper lookup
  const allClients = await storage.getClientsByOrganization(1); // Using org ID 1 as an example
  return allClients.find(c => c.wealthboxClientId === wealthboxId) || null;
}

/**
 * Find an activity by Wealthbox ID
 */
async function findActivityByWealthboxId(wealthboxId: string): Promise<Activity | null> {
  // This is a simplified implementation - in a real app you'd use a proper lookup
  const allActivities = await storage.getActivitiesByAdvisor(1); // Using advisor ID 1 as an example
  return allActivities.find(a => a.wealthboxActivityId === wealthboxId) || null;
}

/**
 * Maps a Wealthbox contact to our client model
 */
function mapWealthboxContactToClient(contact: any, organizationId: number, advisorId: number): Partial<Client> {
  return {
    name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    email: contact.email || null,
    organizationId,
    advisorId,
    address: contact.addresses && contact.addresses.length > 0 ? 
      `${contact.addresses[0].street || ''}, ${contact.addresses[0].city || ''}, ${contact.addresses[0].state || ''} ${contact.addresses[0].zip || ''}`.trim() : 
      null,
    state: contact.addresses && contact.addresses.length > 0 ? contact.addresses[0].state || null : null,
    age: contact.age || null,
    aum: contact.aum || null,
    revenue: contact.revenue || null,
    wealthboxClientId: contact.id.toString(),
    metadata: contact // Store the full Wealthbox contact for reference
  };
}

/**
 * Maps a Wealthbox activity to our activity model
 */
function mapWealthboxActivityToActivity(activity: any, advisorId: number, clientId: number): Partial<Activity> {
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
 * Start a scheduled synchronization process
 * @param accessToken Wealthbox API access token
 * @param userId User ID in our system
 * @param organizationId Organization ID in our system
 * @param intervalMinutes How often to sync (in minutes)
 * @returns Cleanup function to stop syncing
 */
export function startScheduledSync(
  accessToken: string,
  userId: number,
  organizationId: number,
  intervalMinutes: number = 15
): () => void {
  console.log(`Starting scheduled Wealthbox sync every ${intervalMinutes} minutes`);
  
  // Run initial sync
  synchronizeWealthboxData(accessToken, userId, organizationId)
    .then(result => {
      console.log('Initial Wealthbox sync complete:', result);
    })
    .catch(error => {
      console.error('Error during initial Wealthbox sync:', error);
    });
  
  // Set up recurring sync
  const intervalId = setInterval(() => {
    synchronizeWealthboxData(accessToken, userId, organizationId)
      .then(result => {
        console.log(`Scheduled Wealthbox sync complete at ${new Date().toISOString()}:`, result);
      })
      .catch(error => {
        console.error(`Error during scheduled Wealthbox sync at ${new Date().toISOString()}:`, error);
      });
  }, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    console.log('Stopping scheduled Wealthbox sync');
    clearInterval(intervalId);
  };
}