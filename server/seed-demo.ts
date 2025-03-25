import { db } from '../shared/db';
import { storage } from './storage';
import { organizations, roles, users } from '../shared/schema';
import bcrypt from 'bcrypt';

// Sample data for the demo account
const demoData = {
  // Portfolio data
  portfolios: [
    {
      name: 'Retirement Fund',
      accountNumber: 'RT345678',
      accountType: '401(k)',
      assets: [
        { symbol: 'AAPL', assetType: 'equity', quantity: '50', marketValue: '8500', valuation_date: new Date() },
        { symbol: 'MSFT', assetType: 'equity', quantity: '40', marketValue: '12000', valuation_date: new Date() },
        { symbol: 'VBTLX', assetType: 'bond', quantity: '200', marketValue: '22000', valuation_date: new Date() },
      ]
    },
    {
      name: 'College Savings',
      accountNumber: 'CS123456',
      accountType: '529',
      assets: [
        { symbol: 'VTI', assetType: 'equity', quantity: '80', marketValue: '17600', valuation_date: new Date() },
        { symbol: 'VGIT', assetType: 'bond', quantity: '100', marketValue: '10500', valuation_date: new Date() },
      ]
    },
    {
      name: 'Taxable Investment',
      accountNumber: 'TX789012',
      accountType: 'brokerage',
      assets: [
        { symbol: 'AMZN', assetType: 'equity', quantity: '10', marketValue: '13500', valuation_date: new Date() },
        { symbol: 'GOOGL', assetType: 'equity', quantity: '15', marketValue: '18000', valuation_date: new Date() },
        { symbol: 'BND', assetType: 'bond', quantity: '150', marketValue: '12300', valuation_date: new Date() },
        { symbol: 'GLD', assetType: 'commodity', quantity: '25', marketValue: '4750', valuation_date: new Date() },
      ]
    }
  ],
  
  // Client data
  clients: [
    {
      firstName: 'John',
      lastName: 'Smith',
      contactInfo: {
        email: 'john.smith@example.com',
        phone: '555-123-4567',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001'
        }
      }
    },
    {
      firstName: 'Jane',
      lastName: 'Doe',
      contactInfo: {
        email: 'jane.doe@example.com',
        phone: '555-234-5678',
        address: {
          street: '456 Oak Ave',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102'
        }
      }
    },
    {
      firstName: 'Robert',
      lastName: 'Johnson',
      contactInfo: {
        email: 'robert.johnson@example.com',
        phone: '555-345-6789',
        address: {
          street: '789 Elm St',
          city: 'Chicago',
          state: 'IL',
          zip: '60601'
        }
      }
    },
    {
      firstName: 'Emily',
      lastName: 'Williams',
      contactInfo: {
        email: 'emily.williams@example.com',
        phone: '555-456-7890',
        address: {
          street: '321 Pine St',
          city: 'Seattle',
          state: 'WA',
          zip: '98101'
        }
      }
    },
    {
      firstName: 'Michael',
      lastName: 'Brown',
      contactInfo: {
        email: 'michael.brown@example.com',
        phone: '555-567-8901',
        address: {
          street: '654 Maple Ave',
          city: 'Austin',
          state: 'TX',
          zip: '78701'
        }
      }
    }
  ]
};

async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');
    
    // 1. Create role if not exists
    let advisorRole = await db.query.roles.findFirst({
      where: (roles, { eq }) => eq(roles.name, 'advisor')
    });
    
    if (!advisorRole) {
      console.log('Creating advisor role...');
      const [insertedRole] = await db.insert(roles).values({
        name: 'advisor',
        permissions: {}
      }).returning();
      advisorRole = insertedRole;
    }
    
    // 2. Create firm organization if not exists
    let demoFirm = await db.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.name, 'Demo Financial Advisors')
    });
    
    if (!demoFirm) {
      console.log('Creating demo firm...');
      const [insertedFirm] = await db.insert(organizations).values({
        name: 'Demo Financial Advisors',
        type: 'firm',
        status: 'active'
      }).returning();
      demoFirm = insertedFirm;
    }
    
    // 3. Create demo user if not exists
    let demoUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'demo@example.com')
    });
    
    if (!demoUser) {
      console.log('Creating demo user...');
      const passwordHash = await bcrypt.hash('demo123', 10);
      const [insertedUser] = await db.insert(users).values({
        email: 'demo@example.com',
        password_hash: passwordHash,
        first_name: 'Demo',
        last_name: 'User',
        role_id: advisorRole.id,
        organization_id: demoFirm.id,
        status: 'active'
      }).returning();
      demoUser = insertedUser;
    }
    
    // 4. Create demo clients
    console.log('Creating demo clients...');
    for (const clientData of demoData.clients) {
      const existingClient = await db.query.clients.findFirst({
        where: (clients, { and, eq }) => and(
          eq(clients.first_name, clientData.firstName),
          eq(clients.last_name, clientData.lastName),
          eq(clients.firm_id, demoFirm.id)
        )
      });
      
      if (!existingClient) {
        await storage.createClient({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          organizationId: demoFirm.id,
          primaryAdvisorId: demoUser.id,
          contactInfo: clientData.contactInfo,
          source: 'demo'
        });
      }
    }
    
    // 5. Get all clients to create portfolios
    const clients = await db.query.clients.findMany({
      where: (clients, { eq }) => eq(clients.firm_id, demoFirm.id)
    });
    
    // 6. Create portfolios and assets for each client
    if (clients.length > 0) {
      console.log('Creating portfolios and assets...');
      
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        const portfoliosToCreate = demoData.portfolios.slice(0, Math.min(i + 1, demoData.portfolios.length));
        
        for (const portfolioData of portfoliosToCreate) {
          // Check if portfolio already exists
          const existingPortfolio = await db.query.portfolios.findFirst({
            where: (portfolios, { and, eq }) => and(
              eq(portfolios.client_id, client.id),
              eq(portfolios.name, portfolioData.name)
            )
          });
          
          if (existingPortfolio) continue;
          
          // Create portfolio
          const [portfolio] = await db.insert(db.portfolios).values({
            client_id: client.id,
            name: portfolioData.name,
            account_number: portfolioData.accountNumber,
            account_type: portfolioData.accountType,
            source: 'demo'
          }).returning();
          
          // Create assets for this portfolio
          for (const assetData of portfolioData.assets) {
            await db.insert(db.assets).values({
              portfolio_id: portfolio.id,
              symbol: assetData.symbol,
              asset_type: assetData.assetType,
              quantity: assetData.quantity,
              market_value: assetData.marketValue,
              valuation_date: assetData.valuation_date,
              source: 'demo'
            });
          }
        }
      }
    }
    
    console.log('Demo data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to seed demo data:', error);
      process.exit(1);
    });
}

export { seedDemoData };