
import { faker } from '@faker-js/faker';
import { db } from '../shared/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { users, organizations, roles, clients, portfolios, assets } from '../shared/schema';

export const isDemoMode = process.env.DEMO_MODE === 'true';

// Create a mock data object to return directly instead of seeding the database
export const mockDemoData = {
  advisorMetrics: {
    totalAum: 2500000,
    totalRevenue: 75000,
    totalClients: 25,
    totalActivities: 120,
    assetAllocation: [
      { class: 'Equity', value: 1250000, percentage: 50 },
      { class: 'Fixed Income', value: 750000, percentage: 30 },
      { class: 'Cash', value: 250000, percentage: 10 },
      { class: 'Alternative', value: 250000, percentage: 10 }
    ]
  },
  clientDemographics: {
    ageGroups: [
      { range: '18-30', count: 3 },
      { range: '31-45', count: 8 },
      { range: '46-60', count: 10 },
      { range: '61-75', count: 3 },
      { range: '76+', count: 1 }
    ],
    stateDistribution: [
      { state: 'CA', count: 5, percentage: 20 },
      { state: 'NY', count: 4, percentage: 16 },
      { state: 'TX', count: 3, percentage: 12 },
      { state: 'FL', count: 3, percentage: 12 },
      { state: 'IL', count: 2, percentage: 8 },
      { state: 'Other', count: 8, percentage: 32 }
    ]
  },
  portfolios: [
    {
      name: 'Retirement Fund',
      accountNumber: 'RT345678',
      accountType: '401(k)',
      assets: [
        { symbol: 'AAPL', assetType: 'Equity', quantity: '50', marketValue: 8500, valuation_date: new Date() },
        { symbol: 'MSFT', assetType: 'Equity', quantity: '40', marketValue: 12000, valuation_date: new Date() },
        { symbol: 'VBTLX', assetType: 'Fixed Income', quantity: '200', marketValue: 22000, valuation_date: new Date() },
      ]
    },
    {
      name: 'College Savings',
      accountNumber: 'CS123456',
      accountType: '529',
      assets: [
        { symbol: 'VTI', assetType: 'Equity', quantity: '80', marketValue: 17600, valuation_date: new Date() },
        { symbol: 'VGIT', assetType: 'Fixed Income', quantity: '100', marketValue: 10500, valuation_date: new Date() },
      ]
    },
    {
      name: 'Taxable Investment',
      accountNumber: 'TX789012',
      accountType: 'Brokerage',
      assets: [
        { symbol: 'AMZN', assetType: 'Equity', quantity: '10', marketValue: 13500, valuation_date: new Date() },
        { symbol: 'GOOGL', assetType: 'Equity', quantity: '15', marketValue: 18000, valuation_date: new Date() },
        { symbol: 'BND', assetType: 'Fixed Income', quantity: '150', marketValue: 12300, valuation_date: new Date() },
        { symbol: 'GLD', assetType: 'Alternative', quantity: '25', marketValue: 4750, valuation_date: new Date() },
      ]
    }
  ],
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
    }
  ],
  opportunitiesByPipeline: [
    {
      pipeline: 'New Clients',
      stages: [
        { stage: 'Prospecting', count: 10 },
        { stage: 'Qualification', count: 5 },
        { stage: 'Proposal', count: 3 },
        { stage: 'Negotiation', count: 2 },
        { stage: 'Closed Won', count: 1 }
      ],
      totalCount: 21
    },
    {
      pipeline: 'Existing Clients',
      stages: [
        { stage: 'Additional Services', count: 8 },
        { stage: 'Review', count: 12 },
        { stage: 'Proposal', count: 5 },
        { stage: 'Decision', count: 3 }
      ],
      totalCount: 28
    }
  ],
  activities: [
    { type: 'Email', count: 45 },
    { type: 'Call', count: 30 },
    { type: 'Meeting', count: 15 },
    { type: 'Task', count: 20 },
    { type: 'Note', count: 10 }
  ],
  revenueByQuarter: [
    { quarter: 'Q1', revenue: 15000 },
    { quarter: 'Q2', revenue: 18000 },
    { quarter: 'Q3', revenue: 22000 },
    { quarter: 'Q4', revenue: 20000 }
  ]
};

// No need for database seeding as we're using mock data directly
export async function getDemoData() {
  return mockDemoData;
}
