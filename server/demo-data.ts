
import { faker } from '@faker-js/faker';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../shared/db';
import { 
  organizationTypeEnum, statusEnum, roleNameEnum,
  roles, organizations, users, clients, portfolios, assets 
} from '../shared/schema';

export const isDemoMode = process.env.DEMO_MODE === 'true';

async function seedRoles() {
  // Make sure we use only valid role names from the roleNameEnum
  const roleList = [
    { name: roleNameEnum.enumValues[0], permissions: { admin: true } },
    { name: roleNameEnum.enumValues[1], permissions: { multi_network: true } },
    { name: roleNameEnum.enumValues[2], permissions: { network: true } },
    { name: roleNameEnum.enumValues[3], permissions: { firm: true } },
    { name: roleNameEnum.enumValues[4], permissions: { advisor: true } }
  ];

  for (const role of roleList) {
    await db.insert(roles).values(role).onConflictDoNothing();
  }
}

async function seedOrganizations() {
  const orgs = [];
  // Create one global org
  orgs.push({
    name: 'Global Admin Organization',
    type: organizationTypeEnum.enumValues[0], // global
    status: statusEnum.enumValues[0] // active
  });

  // Create 5 firms
  for (let i = 0; i < 5; i++) {
    orgs.push({
      name: faker.company.name(),
      type: organizationTypeEnum.enumValues[3], // firm
      status: statusEnum.enumValues[0] // active
    });
  }

  for (const org of orgs) {
    await db.insert(organizations).values(org).onConflictDoNothing();
  }
}

async function seedUsers() {
  const orgs = await db.select().from(organizations);
  const rolesList = await db.select().from(roles);

  // Add a reliable demo user first
  const demoUser = {
    email: 'demo@example.com',
    passwordHash: await bcrypt.hash('demo123', 10),
    firstName: 'Demo',
    lastName: 'User',
    roleId: 1, // global_admin role
    organizationId: 1, // global org
    status: statusEnum.enumValues[0] // active
  };
  
  await db.insert(users).values(demoUser).onConflictDoNothing();

  // Create 10 users across different organizations and roles (fewer for testing)
  for (let i = 0; i < 10; i++) {
    const org = faker.helpers.arrayElement(orgs);
    const role = faker.helpers.arrayElement(rolesList);
    
    const newUser = {
      email: faker.internet.email(),
      passwordHash: await bcrypt.hash('demo123', 10),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      roleId: role.id,
      organizationId: org.id,
      status: statusEnum.enumValues[0] // active
    };
    
    await db.insert(users).values(newUser).onConflictDoNothing();
  }
}

async function seedClients() {
  const orgs = await db.select().from(organizations);
  // Get any user to use as an advisor
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.log("No users found to use as advisors, skipping client creation");
    return;
  }

  // Create 5 clients for testing (smaller number for testing)
  for (let i = 0; i < 5; i++) {
    const org = faker.helpers.arrayElement(orgs);
    const advisor = faker.helpers.arrayElement(allUsers);
    
    const client = {
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
    };
    
    await db.insert(clients).values(client).onConflictDoNothing();
  }
}

async function seedPortfolios() {
  const clientsList = await db.select().from(clients);

  // Create 2-3 portfolios per client
  for (const client of clientsList) {
    const portfolioCount = faker.number.int({ min: 2, max: 3 });
    
    for (let i = 0; i < portfolioCount; i++) {
      const portfolio = {
        externalId: faker.string.uuid(),
        clientId: client.id,
        name: faker.finance.accountName(),
        accountNumber: faker.finance.accountNumber(),
        accountType: faker.helpers.arrayElement(['IRA', '401k', 'Brokerage', 'Trust']),
        source: 'demo'
      };
      
      await db.insert(portfolios).values(portfolio).onConflictDoNothing();
    }
  }
}

async function seedAssets() {
  const assetsToCreate = [];
  const portfoliosList = await db.select().from(portfolios);
  
  // For each portfolio, create multiple assets
  for (const portfolio of portfoliosList) {
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
      faker.number.float({ min: 1000000, max: 10000000, fractionDigits: 2 }) :
      faker.number.float({ min: 50000, max: 750000, fractionDigits: 2 });
      
    for (let i = 0; i < assetCount; i++) {
      const assetType = faker.helpers.arrayElement(assetClasses);
      const allocationPercentage = faker.number.float({ min: 0.05, max: 0.3, fractionDigits: 2 });
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
        faker.number.float({ min: 10, max: 500, fractionDigits: 2 }) :
        faker.number.float({ min: 20, max: 100, fractionDigits: 2 });
        
      // Calculate quantity based on market value and price
      const quantity = (parseFloat(marketValue) / price).toFixed(4);
      
      assetsToCreate.push({
        portfolioId: portfolio.id,
        symbol: symbol,
        assetType: assetType,
        quantity: quantity,
        marketValue: marketValue,
        valuationDate: faker.date.recent(),
        source: 'demo'
      });
    }
  }

  // Insert all the assets in batches
  const batchSize = 50;
  for (let i = 0; i < assetsToCreate.length; i += batchSize) {
    const batch = assetsToCreate.slice(i, i + batchSize);
    await db.insert(assets).values(batch).onConflictDoNothing();
  }
  
  console.log(`Seeded ${assetsToCreate.length} assets for ${portfoliosList.length} portfolios`);
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
