import { db, closeConnection } from './shared/db.ts';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to query an existing table
    const result = await db.query.users.findMany({
      limit: 5,
    });
    
    console.log('Connection successful! Found users:', result.length);
    if (result.length > 0) {
      console.log('Sample user data:', result[0]);
    } else {
      console.log('No users found in the database.');
    }
    
    // Close connection when done
    await closeConnection();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

testConnection();