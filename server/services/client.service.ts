/**
 * Unified Client Service
 * Handles all client data operations with consistent filtering and pagination
 * Replaces individual KPI endpoints with standardized client data access
 */

import { Request } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { getWealthboxToken } from '../utils/wealthbox-token';
import { eq, and, or, like, ilike, inArray, gte, lte, sql } from 'drizzle-orm';
import { clients, users } from '@shared/schema';
import type { 
  StandardClient, 
  ClientFilters, 
  PaginationOptions, 
  FilterableClientResponse 
} from '../types/client';
import { STATE_MAPPING, YEAR_MAPPING, mapDbClientToStandard, mapDbClientsToStandard } from '../utils/client-mapper';

export class ClientService {
  /**
   * Main method to get clients with filtering and pagination
   */
  async getClients(
    organizationId: number,
    filters: ClientFilters = {},
    pagination: PaginationOptions = { page: 1, perPage: 50 },
    userId?: number
  ): Promise<FilterableClientResponse> {
    // Check if we should use mock data based on Wealthbox token
    const shouldUseMock = await this.shouldUseMockData(organizationId, userId);
    
    if (shouldUseMock) {
      // For now, return empty array - will be implemented in Phase 2
      return {
        clients: [],
        totalCount: 0,
        hasMore: false,
        page: pagination.page,
        perPage: pagination.perPage,
        availableFilters: {
          segments: [],
          advisors: [],
          states: [],
          years: [],
          referrers: []
        }
      };
    }

    return this.getRealClientsFromDb(organizationId, filters, pagination, userId);
  }

  /**
   * Get clients from database with filtering and pagination
   */
  private async getRealClientsFromDb(
    organizationId: number,
    filters: ClientFilters,
    pagination: PaginationOptions,
    userId?: number
  ): Promise<FilterableClientResponse> {
    // Apply filters
    const conditions = [eq(clients.firmId, organizationId)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(clients.firstName, `%${filters.search}%`),
          ilike(clients.lastName, `%${filters.search}%`),
          ilike(clients.emailAddress, `%${filters.search}%`)
        )!
      );
    }

    if (filters.segments?.length) {
      conditions.push(inArray(clients.segment, filters.segments));
    }

    if (filters.advisorIds?.length) {
      const advisorIdNumbers = filters.advisorIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (advisorIdNumbers.length > 0) {
        conditions.push(inArray(clients.primaryAdvisorId, advisorIdNumbers));
      }
    }

    if (filters.ageRange) {
      if (filters.ageRange?.min) {
        conditions.push(gte(clients.age, filters.ageRange.min));
      }
      if (filters.ageRange?.max) {
        conditions.push(lte(clients.age, filters.ageRange.max));
      }
    }

    if (filters.birthMonths?.length) {
      // Filter by birth month using EXTRACT
      const monthConditions = filters.birthMonths.map(month => 
        sql`EXTRACT(MONTH FROM ${clients.dateOfBirth}) = ${month}`
      );
      conditions.push(or(...monthConditions)!);
    }

    if (filters.anniversaryMonths?.length) {
      // Filter by anniversary/inception month
      const monthConditions = filters.anniversaryMonths.map(month => 
        sql`EXTRACT(MONTH FROM ${clients.inceptionDate}) = ${month}`
      );
      conditions.push(or(...monthConditions)!);
    }

    if (filters.inceptionYears?.length) {
      const yearConditions = filters.inceptionYears.map(year => 
        sql`EXTRACT(YEAR FROM ${clients.inceptionDate}) = ${year}`
      );
      conditions.push(or(...yearConditions)!);
    }

    if (filters.inceptionDateRange) {
      if (filters.inceptionDateRange.start) {
        conditions.push(gte(clients.startDate, new Date(filters.inceptionDateRange.start)));
      }
      if (filters.inceptionDateRange.end) {
        conditions.push(lte(clients.startDate, new Date(filters.inceptionDateRange.end)));
      }
    }

    // Build query with conditions
    const query = db
      .select()
      .from(clients)
      .leftJoin(users, eq(clients.primaryAdvisorId, users.id))
      .where(and(...conditions));

    // Apply sorting
    if (pagination.sortBy) {
      const sortColumn = this.getSortColumn(pagination.sortBy);
      const sortOrder = pagination.sortOrder === 'desc' ? 'desc' : 'asc';
      // Note: Drizzle sorting would be implemented based on the column
      // For now, we'll sort after retrieval
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(...conditions));
    
    const [countResult] = await countQuery;
    const totalCount = countResult.count;

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.perPage;
    const dbClients = await query.limit(pagination.perPage).offset(offset);

    // Map to standard format
    const standardClients = mapDbClientsToStandard(dbClients);

    // Apply client-side sorting if needed
    if (pagination.sortBy) {
      standardClients.sort((a, b) => {
        const aValue = this.getSortValue(a, pagination.sortBy!);
        const bValue = this.getSortValue(b, pagination.sortBy!);
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return pagination.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Get available filters with role-based advisor filtering
    const availableFilters = await this.getAvailableFilters(organizationId, userId);

    return {
      clients: standardClients,
      totalCount,
      hasMore: offset + pagination.perPage < totalCount,
      page: pagination.page,
      perPage: pagination.perPage,
      availableFilters
    };
  }

  /**
   * Get available filter options for the organization with role-based advisor filtering
   */
  private async getAvailableFilters(organizationId: number, userId?: number) {
    // Get all clients for filter options (could be optimized with aggregation queries)
    const allClients = await db
      .select({
        segment: clients.segment,
        primaryAdvisorId: clients.primaryAdvisorId,
        startDate: clients.startDate,
        inceptionDate: clients.inceptionDate,
        referredBy: clients.referredBy,
        contactInfo: clients.contactInfo
      })
      .from(clients)
      .where(eq(clients.firmId, organizationId));

    // Get advisors based on user role
    let advisors: { id: string; name: string }[] = [];
    
    // Get all users in organization (includes role information)
    const allUsers = await storage.getUsersByOrganization(organizationId);
    // TODO: Add a check to see if the user is an advisor
    // const advisorUsers = allUsers.filter(user => user.role?.name === "advisor");
    const advisorUsers = allUsers;

    if (userId) {
      // Find current user in the organization users list (includes role)
      const currentUser = allUsers.find(user => user.id === userId);

      if (currentUser?.role?.name === "advisor") {
        // Advisor role: return only themselves
        advisors = [{
          id: currentUser.id.toString(),
          name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
        }];
      } else if (currentUser?.role?.name === "firm_admin") {
        // Firm admin: return all advisors in their organization
        advisors = advisorUsers.map(advisor => ({
          id: advisor.id.toString(),
          name: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim()
        }));
      } else {
        // Other roles (home_office, etc.): return all advisors
        advisors = advisorUsers.map(advisor => ({
          id: advisor.id.toString(),
          name: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim()
        }));
      }
    } else {
      // No user context - return all advisors in organization
      advisors = advisorUsers.map(advisor => ({
        id: advisor.id.toString(),
        name: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim()
      }));
    }

    // Process segments
    const segments = Array.from(new Set(allClients.map(c => c.segment).filter(Boolean)));

    // Process states (from contact info)
    const states = Object.entries(STATE_MAPPING).map(([code, name]) => ({
      code,
      name
    }));

    // Process years (from inception dates)
    const years = Object.entries(YEAR_MAPPING).map(([year, name]) => ({
      year,
      name
    }));

    // Process referrers (placeholder - would need proper referrer lookup)
    const referrers = allUsers.map(user => ({
      id: user.id.toString(),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }));

    return {
      segments,
      advisors,
      states,
      years,
      referrers
    };
  }

  /**
   * Helper to determine if we should use mock data based on Wealthbox token availability
   */
  private async shouldUseMockData(organizationId: number, userId?: number): Promise<boolean> {
    try {
      const token = await getWealthboxToken(userId);
      return !token; // Use mock data if no Wealthbox token is available
    } catch (error) {
      console.error('Error checking Wealthbox token:', error);
      return true; // Default to mock data on error
    }
  }

  /**
   * Helper to get sort column mapping
   */
  private getSortColumn(sortBy: string) {
    const columnMap: { [key: string]: any } = {
      'name': clients.firstName,
      'age': clients.age,
      'aum': clients.aum,
      'inceptionDate': clients.startDate,
      'advisor': users.firstName,
      'segment': clients.segment
    };
    return columnMap[sortBy] || clients.firstName;
  }

  /**
   * Helper to get sort value from StandardClient
   */
  private getSortValue(client: StandardClient, sortBy: string): any {
    switch (sortBy) {
      case 'name': return client.name.toLowerCase();
      case 'age': return client.age;
      case 'aum': return client.aum;
      case 'inceptionDate': return new Date(client.inceptionDate).getTime();
      case 'advisor': return client.advisor.toLowerCase();
      case 'segment': return client.segment;
      default: return client.name.toLowerCase();
    }
  }

  /**
   * Parse filters from request query parameters
   */
  static parseFiltersFromQuery(query: any): ClientFilters {
    const filters: ClientFilters = {};

    if (query.search) filters.search = query.search;
    if (query.segments) filters.segments = query.segments.split(',');
    if (query.advisorIds) filters.advisorIds = query.advisorIds.split(',');
    if (query.stateCode) filters.stateCode = query.stateCode;
    
    if (query.ageMin || query.ageMax) {
      filters.ageRange = {
        min: query.ageMin ? parseInt(query.ageMin) : 0,
        max: query.ageMax ? parseInt(query.ageMax) : 0
      };
    }

    if (query.aumMin || query.aumMax) {
      filters.aumRange = {
        min: query.aumMin ? parseFloat(query.aumMin) : 0,
        max: query.aumMax ? parseFloat(query.aumMax) : 0
      };
    }

    if (query.birthMonths) {
      filters.birthMonths = query.birthMonths.split(',').map((m: string) => parseInt(m));
    }

    if (query.anniversaryMonths) {
      filters.anniversaryMonths = query.anniversaryMonths.split(',').map((m: string) => parseInt(m));
    }

    if (query.inceptionYears) {
      filters.inceptionYears = query.inceptionYears.split(',').map((y: string) => parseInt(y));
    }

    if (query.inceptionDateStart || query.inceptionDateEnd) {
      filters.inceptionDateRange = {
        start: query.inceptionDateStart || '',
        end: query.inceptionDateEnd || ''
      };
    }

    return filters;
  }

  /**
   * Parse pagination from request query parameters
   */
  static parsePaginationFromQuery(query: any): PaginationOptions {
    return {
      page: query.page ? parseInt(query.page) : 1,
      perPage: query.perPage ? parseInt(query.perPage) : 50,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc'
    };
  }
} 