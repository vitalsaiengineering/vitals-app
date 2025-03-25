// Simple script to seed demo data
import { storage } from './server/storage';
import bcrypt from 'bcrypt';
import { roleNameEnum, statusEnum, organizationTypeEnum } from './shared/schema';
import { db } from './shared/db';

async function seedDemoUser() {
  console.log('Seeding demo user...');
  
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail('demo@example.com');
    if (existingUser) {
      console.log('Demo user already exists. Skipping creation.');
      return;
    }
    
    // Create or get an organization for the demo user
    let org;
    const orgs = await storage.getOrganizations();
    if (orgs.length > 0) {
      org = orgs[0];
    } else {
      org = await storage.createOrganization({
        name: 'Demo Organization',
        type: 'firm',
        status: 'active'
      });
    }
    
    // Create demo user
    const demoUser = await storage.createUser({
      email: 'demo@example.com',
      passwordHash: await bcrypt.hash('demo123', 10),
      firstName: 'Demo',
      lastName: 'User',
      roleId: 1, // Global admin role
      organizationId: org.id,
      status: 'active'
    });
    
    console.log('Demo user created successfully:', demoUser);
  } catch (error) {
    console.error('Error seeding demo user:', error);
  }
}

// Execute demo seeding
seedDemoUser()
  .then(() => console.log('Demo seeding completed.'))
  .catch(err => console.error('Demo seeding failed:', err))
  .finally(() => {
    // Just exit without trying to close the pool
    process.exit(0);
  });