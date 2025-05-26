import { storage } from './storage';
import {
  getOrionToken,
  getPortfolioClients,
  getPortfolioAccounts,
  getClientAumOverTime,
  storeOrionClientData,
  storeOrionAccountData,
  storeOrionAumHistory,
  getOrionAdvisorAuthToken
} from './orion';

// Track sync jobs and their progress
interface SyncJob {
  id: string;
  userId: number;
  organizationId: number;
  firmIntegrationConfigId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    clients: { total: number; processed: number; failed: number };
    accounts: { total: number; processed: number; failed: number };
    aumHistory: { total: number; processed: number; failed: number };
  };
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

// Global sync job tracking
const syncJobs = new Map<string, SyncJob>();

// Sync queue for processing jobs sequentially
const syncQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

/**
 * Generate a unique sync job ID
 */
function generateSyncJobId(userId: number, organizationId: number): string {
  return `orion-sync-${userId}-${organizationId}-${Date.now()}`;
}

/**
 * Start the sync queue processor
 */
async function processSyncQueue() {
  if (isProcessingQueue) return;
  
  isProcessingQueue = true;
  
  while (syncQueue.length > 0) {
    const syncTask = syncQueue.shift();
    if (syncTask) {
      try {
        await syncTask();
      } catch (error) {
        console.error('Error processing Orion sync task:', error);
      }
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Queue an initial Orion data sync for a user
 */
export async function queueInitialOrionSync(
  userId: number,
  organizationId: number,
  firmIntegrationConfigId: number
): Promise<{ success: boolean; jobId: string; error?: string }> {
  try {
    const jobId = generateSyncJobId(userId, organizationId);
    
    // Create sync job record
    const syncJob: SyncJob = {
      id: jobId,
      userId,
      organizationId,
      firmIntegrationConfigId,
      status: 'pending',
      progress: {
        clients: { total: 0, processed: 0, failed: 0 },
        accounts: { total: 0, processed: 0, failed: 0 },
        aumHistory: { total: 0, processed: 0, failed: 0 }
      },
      startedAt: new Date()
    };
    
    syncJobs.set(jobId, syncJob);
    
    // Add sync task to queue
    syncQueue.push(async () => {
      await performInitialOrionSync(jobId);
    });
    
    // Start processing queue if not already running
    if (!isProcessingQueue) {
      setImmediate(processSyncQueue);
    }
    
    return { success: true, jobId };
  } catch (error) {
    console.error('Error queueing Orion sync:', error);
    return { 
      success: false, 
      jobId: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get sync job status
 */
export function getSyncJobStatus(jobId: string): SyncJob | null {
  return syncJobs.get(jobId) || null;
}

/**
 * Get all sync jobs for a user
 */
export function getUserSyncJobs(userId: number): SyncJob[] {
  return Array.from(syncJobs.values()).filter(job => job.userId === userId);
}

/**
 * Perform the complete initial Orion data synchronization
 */
async function performInitialOrionSync(jobId: string): Promise<void> {
  const job = syncJobs.get(jobId);
  if (!job) {
    console.error(`Sync job ${jobId} not found`);
    return;
  }
  
  try {
    console.log(`Starting Orion initial sync for job ${jobId}`);
    job.status = 'running';
    
    // Get auth token for the user
    const authToken = await getOrionAdvisorAuthToken(
      job.userId,
      job.organizationId,
      job.firmIntegrationConfigId
    );
    
    if (!authToken || !authToken.accessToken) {
      throw new Error('Orion auth token not found');
    }
    
    // Step 1: Sync all clients
    console.log(`[${jobId}] Syncing clients...`);
    await syncAllClients(job, authToken.accessToken);
    
    // Step 2: Sync all accounts
    console.log(`[${jobId}] Syncing accounts...`);
    await syncAllAccounts(job, authToken.accessToken);
    
    // Step 3: Sync AUM history for all clients
    console.log(`[${jobId}] Syncing AUM history...`);
    await syncAllAumHistory(job, authToken.accessToken);
    
    // Mark job as completed
    job.status = 'completed';
    job.completedAt = new Date();
    
    console.log(`[${jobId}] Orion initial sync completed successfully`);
    console.log(`[${jobId}] Summary:`, {
      clients: `${job.progress.clients.processed}/${job.progress.clients.total} (${job.progress.clients.failed} failed)`,
      accounts: `${job.progress.accounts.processed}/${job.progress.accounts.total} (${job.progress.accounts.failed} failed)`,
      aumHistory: `${job.progress.aumHistory.processed}/${job.progress.aumHistory.total} (${job.progress.aumHistory.failed} failed)`
    });
    
  } catch (error) {
    console.error(`[${jobId}] Orion sync failed:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
  }
}

/**
 * Sync all clients from Orion
 */
async function syncAllClients(job: SyncJob, accessToken: string): Promise<void> {
  try {
    // Fetch all clients from Orion
    const clientsResult = await getPortfolioClients(accessToken);
    
    if (!clientsResult.success || !clientsResult.data) {
      throw new Error(`Failed to fetch clients: ${clientsResult.error}`);
    }
    
    const clients = Array.isArray(clientsResult.data) ? clientsResult.data : [];
    job.progress.clients.total = clients.length;
    
    console.log(`[${job.id}] Found ${clients.length} clients to sync`);
    
    // Process each client
    for (const clientData of clients) {
      try {
        const result = await storeOrionClientData(
          clientData,
          job.firmIntegrationConfigId,
          job.organizationId,
          job.userId
        );
        
        if (result.success) {
          job.progress.clients.processed++;
        } else {
          console.error(`[${job.id}] Failed to store client ${clientData.id}:`, result.error);
          job.progress.clients.failed++;
        }
      } catch (error) {
        console.error(`[${job.id}] Error processing client ${clientData.id}:`, error);
        job.progress.clients.failed++;
      }
    }
    
  } catch (error) {
    console.error(`[${job.id}] Error syncing clients:`, error);
    throw error;
  }
}

/**
 * Sync all accounts from Orion
 */
async function syncAllAccounts(job: SyncJob, accessToken: string): Promise<void> {
  try {
    // Fetch all accounts from Orion
    const accountsResult = await getPortfolioAccounts(accessToken);
    
    if (!accountsResult.success || !accountsResult.data) {
      throw new Error(`Failed to fetch accounts: ${accountsResult.error}`);
    }
    
    const accounts = Array.isArray(accountsResult.data) ? accountsResult.data : [];
    job.progress.accounts.total = accounts.length;
    
    console.log(`[${job.id}] Found ${accounts.length} accounts to sync`);
    
    // Process each account
    for (const accountData of accounts) {
      try {
        // Find the associated client by Orion client ID
        const { db } = await import("./db");
        const { clients } = await import("../shared/schema");
        const { eq } = await import("drizzle-orm");

        const clientResults = await db
          .select()
          .from(clients)
          .where(eq(clients.orionClientId, accountData.clientId?.toString()));

        if (clientResults.length === 0) {
          console.warn(`[${job.id}] No client found for account ${accountData.id} with client ID ${accountData.clientId}`);
          job.progress.accounts.failed++;
          continue;
        }

        const result = await storeOrionAccountData(
          accountData,
          clientResults[0].id,
          job.firmIntegrationConfigId
        );

        if (result.success) {
          job.progress.accounts.processed++;
        } else {
          console.error(`[${job.id}] Failed to store account ${accountData.id}:`, result.error);
          job.progress.accounts.failed++;
        }
      } catch (error) {
        console.error(`[${job.id}] Error processing account ${accountData.id}:`, error);
        job.progress.accounts.failed++;
      }
    }
    
  } catch (error) {
    console.error(`[${job.id}] Error syncing accounts:`, error);
    throw error;
  }
}

/**
 * Sync AUM history for all clients
 */
async function syncAllAumHistory(job: SyncJob, accessToken: string): Promise<void> {
  try {
    // Get all clients that were synced
    const { db } = await import("./db");
    const { clients } = await import("../shared/schema");
    const { eq, and, isNotNull } = await import("drizzle-orm");

    const clientResults = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.firmId, job.organizationId),
          isNotNull(clients.orionClientId)
        )
      );

    job.progress.aumHistory.total = clientResults.length;
    
    console.log(`[${job.id}] Found ${clientResults.length} clients for AUM history sync`);
    
    // Process AUM history for each client
    for (const client of clientResults) {
      try {
        if (!client.orionClientId) {
          job.progress.aumHistory.failed++;
          continue;
        }
        
        // Fetch AUM over time for this client
        const aumResult = await getClientAumOverTime(accessToken, client.orionClientId);
        
        if (!aumResult.success || !aumResult.data) {
          console.warn(`[${job.id}] Failed to fetch AUM for client ${client.orionClientId}:`, aumResult.error);
          job.progress.aumHistory.failed++;
          continue;
        }
        
        // Store AUM history data
        const storeResult = await storeOrionAumHistory(
          aumResult.data,
          job.firmIntegrationConfigId
        );
        
        if (storeResult.success) {
          job.progress.aumHistory.processed++;
          console.log(`[${job.id}] Stored ${storeResult.inserted || 0} AUM records for client ${client.orionClientId}`);
        } else {
          console.error(`[${job.id}] Failed to store AUM history for client ${client.orionClientId}:`, storeResult.error);
          job.progress.aumHistory.failed++;
        }
        
      } catch (error) {
        console.error(`[${job.id}] Error processing AUM history for client ${client.orionClientId}:`, error);
        job.progress.aumHistory.failed++;
      }
    }
    
  } catch (error) {
    console.error(`[${job.id}] Error syncing AUM history:`, error);
    throw error;
  }
}

/**
 * Clean up old completed sync jobs (keep last 10 per user)
 */
export function cleanupOldSyncJobs(): void {
  const userJobs = new Map<number, SyncJob[]>();
  
  // Group jobs by user - use Array.from to avoid iteration issues
  const allJobs = Array.from(syncJobs.values());
  for (const job of allJobs) {
    if (!userJobs.has(job.userId)) {
      userJobs.set(job.userId, []);
    }
    userJobs.get(job.userId)!.push(job);
  }
  
  // Keep only the latest 10 jobs per user - use Array.from to avoid iteration issues
  const userEntries = Array.from(userJobs.entries());
  for (const [userId, jobs] of userEntries) {
    const sortedJobs = jobs.sort((a: SyncJob, b: SyncJob) => b.startedAt.getTime() - a.startedAt.getTime());
    const jobsToRemove = sortedJobs.slice(10);
    
    for (const job of jobsToRemove) {
      syncJobs.delete(job.id);
    }
  }
}

// Clean up old jobs every hour
setInterval(cleanupOldSyncJobs, 60 * 60 * 1000); 