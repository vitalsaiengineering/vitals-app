
import { faker } from '@faker-js/faker';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { organizationTypeEnum, statusEnum, roleNameEnum } from '@shared/schema';

export const isDemoMode = process.env.DEMO_MODE === 'true';

async function seedRoles() {
  const roles = [
    { name: 'global_admin', permissions: { admin: true } },
    { name: 'client_admin', permissions: { client: true } },
    { name: 'financial_advisor', permissions: { advisor: true } },
    { name: 'home_office', permissions: { home_office: true } },
    { name: 'firm_admin', permissions: { firm: true } }
  ];

  for (const role of roles) {
    await storage.db.insert(storage.roles).values(role).onConflictDoNothing();
  }
}

async function seedOrganizations() {
  const orgs = [];
  // Create one global org
  orgs.push({
    name: 'Global Admin Organization',
    type: 'global',
    status: 'active'
  });

  // Create 5 firms
  for (let i = 0; i < 5; i++) {
    orgs.push({
      name: faker.company.name(),
      type: 'firm',
      status: 'active'
    });
  }

  for (const org of orgs) {
    await storage.db.insert(storage.organizations).values(org).onConflictDoNothing();
  }
}

async function seedUsers() {
  const users = [];
  const orgs = await storage.getOrganizations();
  const roles = await storage.db.select().from(storage.roles);

  // Add a reliable demo user first
  users.push({
    email: 'demo@example.com',
    passwordHash: await bcrypt.hash('demo123', 10),
    firstName: 'Demo',
    lastName: 'User',
    roleId: 1, // global_admin role
    organizationId: 1, // global org
    status: 'active'
  });

  // Create 50 users across different organizations and roles
  for (let i = 0; i < 50; i++) {
    const org = faker.helpers.arrayElement(orgs);
    const role = faker.helpers.arrayElement(roles);
    
    users.push({
      email: faker.internet.email(),
      passwordHash: await bcrypt.hash('demo123', 10),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      roleId: role.id,
      organizationId: org.id,
      status: 'active'
    });
  }

  for (const user of users) {
    await storage.db.insert(storage.users).values(user).onConflictDoNothing();
  }
}

async function seedClients() {
  const clients = [];
  const orgs = await storage.getOrganizations();
  const advisors = await storage.db.select().from(storage.users)
    .where(eq(storage.users.roleId, 3)); // Financial advisor role

  // Create 50 clients
  for (let i = 0; i < 50; i++) {
    const org = faker.helpers.arrayElement(orgs);
    const advisor = faker.helpers.arrayElement(advisors);
    
    clients.push({
      externalId: faker.string.uuid(),
      firmId: org.id,
      primaryAdvisorId: advisor.id,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      contactInfo: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode()
        }
      },
      source: 'demo'
    });
  }

  for (const client of clients) {
    await storage.db.insert(storage.clients).values(client).onConflictDoNothing();
  }
}

async function seedPortfolios() {
  const portfolios = [];
  const clients = await storage.db.select().from(storage.clients);

  // Create 50 portfolios
  for (let i = 0; i < 50; i++) {
    const client = faker.helpers.arrayElement(clients);
    
    portfolios.push({
      externalId: faker.string.uuid(),
      clientId: client.id,
      name: faker.finance.accountName(),
      accountNumber: faker.finance.accountNumber(),
      accountType: faker.helpers.arrayElement(['IRA', '401k', 'Brokerage', 'Trust']),
      source: 'demo'
    });
  }

  for (const portfolio of portfolios) {
    await storage.db.insert(storage.portfolios).values(portfolio).onConflictDoNothing();
  }
}

async function seedAssets() {
  const assets = [];
  const portfolios = await storage.db.select().from(storage.portfolios);
  const clients = await storage.db.select().from(storage.clients);
  const advisors = await storage.db.select().from(storage.users)
    .where(eq(storage.users.roleId, 3)); // Financial advisor role
    
  // Create a map to track which portfolios belong to which client
  const clientPortfolios = new Map();
  portfolios.forEach(portfolio => {
    if (!clientPortfolios.has(portfolio.clientId)) {
      clientPortfolios.set(portfolio.clientId, []);
    }
    clientPortfolios.get(portfolio.clientId).push(portfolio.id);
  });
  
  // For each client, make sure they have at least one portfolio with assets
  for (const client of clients) {
    // Create between 1-4 portfolios for each client
    const portfolioCount = clientPortfolios.has(client.id) ? 
      clientPortfolios.get(client.id).length : 0;
    
    if (portfolioCount === 0) {
      // Create a new portfolio for this client
      const newPortfolio = {
        externalId: faker.string.uuid(),
        clientId: client.id,
        name: faker.finance.accountName(),
        accountNumber: faker.finance.accountNumber(),
        accountType: faker.helpers.arrayElement(['IRA', '401k', 'Brokerage', 'Trust']),
        source: 'demo'
      };
      
      const result = await storage.db.insert(storage.portfolios).values(newPortfolio).returning();
      const portfolioId = result[0].id;
      
      if (!clientPortfolios.has(client.id)) {
        clientPortfolios.set(client.id, []);
      }
      clientPortfolios.get(client.id).push(portfolioId);
    }
    
    // Now create assets for each portfolio this client has
    const clientPortfolioIds = clientPortfolios.get(client.id);
    
    for (const portfolioId of clientPortfolioIds) {
      // Create between 3-8 different asset types per portfolio
      const assetCount = faker.number.int({ min: 3, max: 8 });
      
      // Define asset classes and their allocations
      const assetClasses = [
        'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity',  // 60% chance for equity
        'Fixed Income', 'Fixed Income', 'Fixed Income',  // 30% chance for fixed income
        'Cash',  // 5% chance for cash
        'Alternative'  // 5% chance for alternatives
      ];
      
      // Generate total portfolio value - higher for affluent clients
      const isHighNetWorthClient = Math.random() < 0.2; // 20% chance for high net worth
      const basePortfolioValue = isHighNetWorthClient ? 
        faker.number.float({ min: 1000000, max: 10000000, precision: 0.01 }) :
        faker.number.float({ min: 50000, max: 750000, precision: 0.01 });
        
      for (let i = 0; i < assetCount; i++) {
        const assetType = faker.helpers.arrayElement(assetClasses);
        const allocationPercentage = faker.number.float({ min: 0.05, max: 0.3, precision: 0.01 });
        const marketValue = (basePortfolioValue * allocationPercentage).toFixed(2);
        
        // For equity assets, create a real ticker symbol
        let symbol = '';
        if (assetType === 'Equity') {
          symbol = faker.helpers.arrayElement([
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'DIS', 'NFLX',
            'VTI', 'SPY', 'QQQ', 'IWM', 'VEA', 'VWO', 'BND', 'AGG', 'VNQ', 'GLD'
          ]);
        } else if (assetType === 'Fixed Income') {
          symbol = faker.helpers.arrayElement([
            'BND', 'AGG', 'TLT', 'IEF', 'SHY', 'VCIT', 'VCSH', 'HYG', 'LQD', 'MUB'
          ]);
        } else if (assetType === 'Alternative') {
          symbol = faker.helpers.arrayElement([
            'GLD', 'IAU', 'SLV', 'USO', 'BTC', 'ETH', 'REIT', 'VNQ', 'USDC', 'XLM'
          ]);
        } else {
          symbol = 'CASH';
        }
        
        // Use a realistic price per share
        const price = assetType === 'Equity' ? 
          faker.number.float({ min: 10, max: 500, precision: 0.01 }) :
          faker.number.float({ min: 20, max: 100, precision: 0.01 });
          
        // Calculate quantity based on market value and price
        const quantity = (parseFloat(marketValue) / price).toFixed(4);
        
        assets.push({
          portfolioId: portfolioId,
          symbol: symbol,
          assetType: assetType,
          quantity: quantity,
          marketValue: marketValue,
          valuationDate: faker.date.recent(),
          source: 'demo'
        });
      }
    }
  }

  // Insert all the assets in batches
  const batchSize = 100;
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize);
    await storage.db.insert(storage.assets).values(batch).onConflictDoNothing();
  }
  
  console.log(`Seeded ${assets.length} assets for ${clients.length} clients`);
}

export async function seedDemoData() {
  if (!isDemoMode) return;

  try {
    console.log('Starting demo data seeding...');
    await seedRoles();
    await seedOrganizations();
    await seedUsers();
    await seedClients();
    await seedPortfolios();
    await seedAssets();
    console.log('Demo data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}
