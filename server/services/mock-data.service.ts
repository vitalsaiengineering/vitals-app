/**
 * Mock Data Service
 * Provides the same interface as ClientService but uses mock JSON data
 * Supports identical filtering and pagination behavior for consistent API responses
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { 
  StandardClient, 
  ClientFilters, 
  PaginationOptions, 
  FilterableClientResponse 
} from '../types/client';

interface MockClientData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: string;
  segment: string;
  aum: number;
  advisor: string;
  advisorId: string;
  inceptionDate: string;
  state: string;
  stateCode: string;
  city: string;
  email: string;
  phone: string;
  household: string;
  isActive: boolean;
  contactType?: string;
  title?: string;
  status: string;
  referredBy?: string;
}

interface MockDataFile {
  clients: MockClientData[];
}

export class MockDataService {
  private mockData: MockClientData[] = [];
  private advisors: { id: string; name: string }[] = [];
  private isLoaded = false;

  /**
   * Load mock data from JSON file
   */
  private async loadMockData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Get current file directory (ES module equivalent of __dirname)
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const mockDataPath = path.join(__dirname, '../data/mockClients.json');
      const rawData = fs.readFileSync(mockDataPath, 'utf8');
      const data: MockDataFile = JSON.parse(rawData);
      
      this.mockData = data.clients;
      
      // Extract unique advisors from client data
      const advisorMap = new Map<string, string>();
      this.mockData.forEach(client => {
        if (client.advisorId && client.advisor) {
          advisorMap.set(client.advisorId, client.advisor);
        }
      });
      
      this.advisors = Array.from(advisorMap.entries()).map(([id, name]) => ({
        id,
        name
      }));
      
      this.isLoaded = true;
      console.log(`Loaded ${this.mockData.length} mock clients with ${this.advisors.length} advisors`);
    } catch (error) {
      console.error('Error loading mock data:', error);
      this.mockData = [];
      this.advisors = [];
      this.isLoaded = true;
    }
  }

  /**
   * Transform mock client data to StandardClient format
   */
  private transformToStandardClient(mockClient: MockClientData): StandardClient {
    return {
      id: mockClient.id,
      name: mockClient.name,
      firstName: mockClient.firstName,
      lastName: mockClient.lastName,
      age: mockClient.age,
      dateOfBirth: mockClient.dateOfBirth,
      segment: mockClient.segment as 'platinum' | 'gold' | 'silver',
      aum: mockClient.aum,
      advisor: mockClient.advisor,
      primaryAdvisorId: mockClient.advisorId,
      inceptionDate: mockClient.inceptionDate,
      state: mockClient.state,
      stateCode: mockClient.stateCode,
      city: mockClient.city,
      email: mockClient.email,
      phone: mockClient.phone,
      household: mockClient.household,
      isActive: mockClient.isActive,
      contactType: mockClient.contactType,
      title: mockClient.title,
      referredBy: mockClient.referredBy,
      status: mockClient.status as 'active' | 'inactive' | 'archived' | 'pending' | 'suspended'
    };
  }

  /**
   * Apply filters to mock data (matching real database filtering logic)
   */
  private applyFilters(clients: MockClientData[], filters: ClientFilters): MockClientData[] {
    let filtered = [...clients];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
      );
    }

    // Segment filter
    if (filters.segments?.length) {
      filtered = filtered.filter(client =>
        filters.segments!.some(seg => 
          client.segment.toLowerCase() === seg.toLowerCase()
        )
      );
    }

    // Advisor filter
    if (filters.advisorIds?.length) {
      filtered = filtered.filter(client =>
        filters.advisorIds!.includes(client.advisorId)
      );
    }

    // State filter
    if (filters.stateCode) {
      filtered = filtered.filter(client =>
        client.stateCode === filters.stateCode
      );
    }

    // Age range filter
    if (filters.ageRange) {
      if (filters.ageRange.min !== undefined) {
        filtered = filtered.filter(client => client.age >= filters.ageRange!.min!);
      }
      if (filters.ageRange.max !== undefined) {
        filtered = filtered.filter(client => client.age <= filters.ageRange!.max!);
      }
    }

    // AUM range filter
    if (filters.aumRange) {
      if (filters.aumRange.min !== undefined) {
        filtered = filtered.filter(client => client.aum >= filters.aumRange!.min);
      }
      if (filters.aumRange.max !== undefined) {
        filtered = filtered.filter(client => client.aum <= filters.aumRange!.max);
      }
    }

    // Birth months filter
    if (filters.birthMonths?.length) {
      filtered = filtered.filter(client => {
        const birthMonth = new Date(client.dateOfBirth).getMonth() + 1;
        return filters.birthMonths!.includes(birthMonth);
      });
    }

    // Anniversary/inception months filter
    if (filters.anniversaryMonths?.length) {
      filtered = filtered.filter(client => {
        const inceptionMonth = new Date(client.inceptionDate).getMonth() + 1;
        return filters.anniversaryMonths!.includes(inceptionMonth);
      });
    }

    // Inception years filter
    if (filters.inceptionYears?.length) {
      filtered = filtered.filter(client => {
        const inceptionYear = new Date(client.inceptionDate).getFullYear();
        return filters.inceptionYears!.includes(inceptionYear);
      });
    }

    // Inception date range filter
    if (filters.inceptionDateRange) {
      if (filters.inceptionDateRange.start) {
        const startDate = new Date(filters.inceptionDateRange.start);
        filtered = filtered.filter(client => 
          new Date(client.inceptionDate) >= startDate
        );
      }
      if (filters.inceptionDateRange.end) {
        const endDate = new Date(filters.inceptionDateRange.end);
        filtered = filtered.filter(client => 
          new Date(client.inceptionDate) <= endDate
        );
      }
    }

    // Referrer filter
    if (filters.referrerIds?.length) {
      filtered = filtered.filter(client =>
        client.referredBy && filters.referrerIds!.includes(client.referredBy)
      );
    }

    // Tenure years filter (calculated from inception date)
    if (filters.tenureYears) {
      const now = new Date();
      filtered = filtered.filter(client => {
        const inceptionDate = new Date(client.inceptionDate);
        const yearsWithFirm = now.getFullYear() - inceptionDate.getFullYear();
        
        let matchesMin = true;
        let matchesMax = true;
        
        if (filters.tenureYears!.min !== undefined) {
          matchesMin = yearsWithFirm >= filters.tenureYears!.min;
        }
        if (filters.tenureYears!.max !== undefined) {
          matchesMax = yearsWithFirm <= filters.tenureYears!.max;
        }
        
        return matchesMin && matchesMax;
      });
    }

    return filtered;
  }

  /**
   * Apply sorting to filtered data
   */
  private applySorting(clients: StandardClient[], pagination: PaginationOptions): StandardClient[] {
    if (!pagination.sortBy) return clients;

    const sorted = [...clients].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (pagination.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'age':
          aValue = a.age;
          bValue = b.age;
          break;
        case 'aum':
          aValue = a.aum;
          bValue = b.aum;
          break;
        case 'inceptionDate':
          aValue = new Date(a.inceptionDate).getTime();
          bValue = new Date(b.inceptionDate).getTime();
          break;
        case 'advisor':
          aValue = a.advisor.toLowerCase();
          bValue = b.advisor.toLowerCase();
          break;
        case 'segment':
          aValue = a.segment;
          bValue = b.segment;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return pagination.sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Generate available filters from mock data
   */
  async getAvailableFilters(): Promise<{
    segments: string[];
    advisors: { id: string; name: string }[];
    states: { code: string; name: string }[];
    years: number[];
    referrers: { id: string; name: string }[];
  }> {
    await this.loadMockData();
    // Extract unique segments
    const segments = Array.from(new Set(
      this.mockData.map(client => client.segment).filter(Boolean)
    ));

    // Extract unique state codes and names
    const stateMap = new Map<string, string>();
    this.mockData.forEach(client => {
      if (client.stateCode && client.state) {
        stateMap.set(client.stateCode, client.state);
      }
    });
    const states = Array.from(stateMap.entries()).map(([code, name]) => ({
      code,
      name
    }));

    // Extract unique inception years
    const years = Array.from(new Set(
      this.mockData
        .map(client => new Date(client.inceptionDate).getFullYear())
        .filter(year => !isNaN(year))
    )).sort((a, b) => b - a); // Sort descending

    // Use advisors as referrers for mock data
    const referrers = [...this.advisors];

    return {
      segments,
      advisors: this.advisors,
      states,
      years,
      referrers
    };
  }

  /**
   * Main method to get clients with filtering and pagination (matching ClientService interface)
   */
  async getClients(
    organizationId: number,
    filters: ClientFilters = {},
    pagination: PaginationOptions = { page: 1, perPage: 50 },
    userId?: number
  ): Promise<FilterableClientResponse> {
    await this.loadMockData();

    // Apply filters
    const filteredMockData = this.applyFilters(this.mockData, filters);

    // Transform to StandardClient format
    const standardClients = filteredMockData.map(client => 
      this.transformToStandardClient(client)
    );

    // Apply sorting
    const sortedClients = this.applySorting(standardClients, pagination);

    // Calculate pagination
    const totalCount = sortedClients.length;
    const offset = (pagination.page - 1) * pagination.perPage;
    const paginatedClients = sortedClients.slice(offset, offset + pagination.perPage);
    const hasMore = offset + pagination.perPage < totalCount;

    // Get available filters
    const availableFilters = await this.getAvailableFilters();

    return {
      clients: paginatedClients,
      totalCount,
      hasMore,
      page: pagination.page,
      perPage: pagination.perPage,
      availableFilters
    };
  }

  /**
   * Get total client count (useful for determining if mock data should be used)
   */
  async getClientCount(): Promise<number> {
    await this.loadMockData();
    return this.mockData.length;
  }

  /**
   * Check if mock data is available
   */
  async isAvailable(): Promise<boolean> {
    await this.loadMockData();
    return this.mockData.length > 0;
  }
} 