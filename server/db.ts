import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced pool configuration with error handling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Connection timeout
};

// Create pool with error handling
export const pool = new Pool(poolConfig);

// Add error event listeners
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't crash the application, just log the error
});

pool.on('connect', () => {
  console.log('Database connection established');
});

// Create drizzle instance
export const db = drizzle({ client: pool, schema });

// Database health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Graceful database shutdown
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

// Test database connection on startup
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    console.log('Testing database connection...');
    const isHealthy = await checkDatabaseHealth();
    if (isHealthy) {
      console.log('✅ Database connection successful');
    } else {
      throw new Error('Database health check failed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Database retry wrapper for critical operations
export const withDatabaseRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError!.message}`);
};
