/**
 * Shared client types for both frontend and backend
 * Single source of truth for client-related interfaces
 */

export interface StandardClient {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: string;
  segment: 'platinum' | 'gold' | 'silver';
  aum: number;
  advisor: string;
  primaryAdvisorId: string;
  // joinDate: string;
  inceptionDate: string;
  state: string;
  stateCode: string;
  city: string;
  email: string;
  phone: string;
  household: string;
  isActive: boolean;
  // Extended fields for comprehensive data
  referredBy?: string;
  contactType?: string;
  title?: string;
  status: 'active' | 'inactive' | 'archived' | 'pending' | 'suspended';
  // External system IDs
  wealthboxClientId?: string;
  orionClientId?: string;
}

export interface ClientFilters {
  search?: string;
  segments?: string[];
  advisorIds?: string[];
  stateCode?: string;
  ageRange?: { min?: number; max?: number };
  aumRange?: { min: number; max: number };
  inceptionDateRange?: { start: string; end: string };
  birthMonths?: number[];
  anniversaryMonths?: number[];
  inceptionYears?: number[];
  referrerIds?: string[];
  tenureYears?: { min: number; max: number };
}

export interface PaginationOptions {
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterableClientResponse {
  clients: StandardClient[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  perPage: number;
  availableFilters: {
    segments: string[];
    advisors: { id: string; name: string }[];
    states: { code: string; name: string }[];
    years: number[];
    referrers: { id: string; name: string }[];
  };
} 