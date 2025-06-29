/**
 * Re-export shared client types for backward compatibility
 * All client interfaces are now defined in shared/client-types.ts
 * This ensures single source of truth between frontend and backend
 */

export {
  StandardClient,
  ClientFilters,
  PaginationOptions,
  FilterableClientResponse
} from '../../shared/client-types';

// Filter presets for different report types (keeping this as it's backend-specific)
export type ReportFilter = 
  | 'age-demographics'
  | 'birthdays'
  | 'anniversaries'
  | 'inception'
  | 'referrals'
  | 'distribution'
  | 'segmentation'
  | 'book-development'; 