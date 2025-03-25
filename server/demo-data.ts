
import { faker } from '@faker-js/faker';
import { storage } from './storage';
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

  // Create 50 assets
  for (let i = 0; i < 50; i++) {
    const portfolio = faker.helpers.arrayElement(portfolios);
    
    assets.push({
      portfolioId: portfolio.id,
      symbol: faker.finance.currencyCode(),
      assetType: faker.helpers.arrayElement(['Equity', 'Fixed Income', 'Cash', 'Alternative']),
      quantity: faker.number.float({ min: 1, max: 1000, precision: 0.01 }).toString(),
      marketValue: faker.number.float({ min: 1000, max: 1000000, precision: 0.01 }).toString(),
      valuationDate: faker.date.recent(),
      source: 'demo'
    });
  }

  for (const asset of assets) {
    await storage.db.insert(storage.assets).values(asset).onConflictDoNothing();
  }
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
