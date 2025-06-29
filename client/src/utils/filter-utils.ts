import { ReportFilters } from '@/contexts/ReportFiltersContext';

/**
 * Checks if a value represents an "empty" or "all" state
 * @param value - The value to check
 * @returns true if the value should be treated as empty/all
 */
const isEmptyOrAllValue = (value: string | undefined | null): boolean => {
  if (!value) return true;
  const trimmed = value.trim().toLowerCase();
  return trimmed === '' || trimmed === 'all' || trimmed.startsWith('all ');
};

/**
 * Converts context filters to URL search parameters for API calls
 * @param filters - Filters from ReportFiltersContext
 * @param fallbackAdvisor - Fallback advisor ID for backward compatibility
 * @returns URLSearchParams for API calls
 */
export const filtersToApiParams = (
  filters: ReportFilters, 
  fallbackAdvisor?: string
): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Advisor filtering
  if (filters.advisorIds.length > 0) {
    filters.advisorIds.forEach(id => {
      if (!isEmptyOrAllValue(id)) {
        params.append('advisorIds', id);
      }
    });
  } else if (!isEmptyOrAllValue(fallbackAdvisor)) {
    params.append('advisorIds', fallbackAdvisor!);
  }
  
  // Segment filtering
  if (filters.segments.length > 0) {
    filters.segments.forEach(segment => {
      if (!isEmptyOrAllValue(segment)) {
        params.append('segments', segment);
      }
    });
  }
  
  // State filtering
  if (!isEmptyOrAllValue(filters.stateCode)) {
    params.append('stateCode', filters.stateCode!);
  }
  
  // Age range filtering
  if (filters.ageRange?.min !== undefined) {
    params.append('ageMin', filters.ageRange.min.toString());
  }
  if (filters.ageRange?.max !== undefined) {
    params.append('ageMax', filters.ageRange.max.toString());
  }
  
  // AUM range filtering
  if (filters.aumRange?.min !== undefined) {
    params.append('aumMin', filters.aumRange.min.toString());
  }
  if (filters.aumRange?.max !== undefined) {
    params.append('aumMax', filters.aumRange.max.toString());
  }
  
  // Date range filtering
  if (filters.inceptionDateRange?.startDate) {
    params.append('inceptionStartDate', filters.inceptionDateRange.startDate);
  }
  if (filters.inceptionDateRange?.endDate) {
    params.append('inceptionEndDate', filters.inceptionDateRange.endDate);
  }
  
  // Inception years filtering
  if (filters.inceptionYears.length > 0) {
    filters.inceptionYears.forEach(year => params.append('inceptionYears', year.toString()));
  }
  
  // Birth months filtering
  if (filters.birthMonths.length > 0) {
    filters.birthMonths.forEach(month => params.append('birthMonths', month.toString()));
  }
  
  // Anniversary months filtering
  if (filters.anniversaryMonths.length > 0) {
    filters.anniversaryMonths.forEach(month => params.append('anniversaryMonths', month.toString()));
  }
  
  // Referrer filtering
  if (filters.referrerIds.length > 0) {
    filters.referrerIds.forEach(id => {
      if (!isEmptyOrAllValue(id)) {
        params.append('referrerIds', id);
      }
    });
  }
  
  // Tenure years filtering
  if (filters.tenureYears.length > 0) {
    filters.tenureYears.forEach(years => params.append('tenureYears', years.toString()));
  }
  
  return params;
};

/**
 * Checks if any filters are applied (useful for conditional rendering)
 */
export const hasActiveFilters = (filters: ReportFilters): boolean => {
  return (
    filters.advisorIds.length > 0 ||
    filters.segments.length > 0 ||
    !!filters.stateCode ||
    filters.ageRange?.min !== undefined ||
    filters.ageRange?.max !== undefined ||
    filters.aumRange?.min !== undefined ||
    filters.aumRange?.max !== undefined ||
    filters.birthMonths.length > 0 ||
    filters.anniversaryMonths.length > 0 ||
    filters.inceptionYears.length > 0 ||
    filters.referrerIds.length > 0 ||
    filters.tenureYears.length > 0 ||
    filters.dateRange.preset !== 'last12months'
  );
}; 