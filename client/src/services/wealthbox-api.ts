import axios from 'axios';
import { FieldOption } from '@/types/mapping';

// Wealthbox API base URL
const WEALTHBOX_API_BASE_URL = 'https://api.crmworkspace.com/v1';

// Endpoints for retrieving field options
const ENDPOINTS = {
  CUSTOM_FIELDS: '/categories/custom_fields',
  CONTACT_TYPES: '/categories/contact_types',
  CONTACT_ROLES: '/categories/contact_roles',
};

// Interface for API responses
interface WealthboxApiResponse<T> {
  data: T[];
}

// Interface for field items returned from API
interface WealthboxFieldItem {
  id?: string | number;
  name: string;
  [key: string]: any;
}

/**
 * Creates an axios instance with the Wealthbox access token in the headers
 */
const createApiClient = (accessToken: string) => {
  return axios.create({
    baseURL: WEALTHBOX_API_BASE_URL,
    headers: {
      'ACCESS_TOKEN': accessToken,
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Fetches data from the specified Wealthbox API endpoint
 */
const fetchFromWealthbox = async <T>(
  accessToken: string, 
  endpoint: string
): Promise<T[]> => {
  try {
    const apiClient = createApiClient(accessToken);
    const response = await apiClient.get(endpoint);
    
    // Extract field name from the endpoint
    // Example: "/categories/contact_types" -> "contact_types"
    const fieldName = endpoint.split('/').pop() || '';
    
    // Return the data from the appropriate field
    return response.data[fieldName] || [];
  } catch (error) {
    console.error(`Error fetching from Wealthbox API ${endpoint}:`, error);
    return [];
  }
};

/**
 * Converts Wealthbox field items to FieldOption format
 */
const convertToFieldOptions = (items: WealthboxFieldItem[]): FieldOption[] => {
  return items.map(item => ({
    label: item.name,
    value: item.id ? String(item.id) : item.name,
  }));
};

/**
 * Fetches all field options from Wealthbox APIs in parallel
 */
export const fetchAllWealthboxFieldOptions = async (
  accessToken: string
): Promise<Record<string, FieldOption[]>> => {
  try {
    // Fetch all data in parallel
    const [customFields, contactTypes, contactRoles] = await Promise.all([
      fetchFromWealthbox<WealthboxFieldItem>(accessToken, ENDPOINTS.CUSTOM_FIELDS),
      fetchFromWealthbox<WealthboxFieldItem>(accessToken, ENDPOINTS.CONTACT_TYPES),
      fetchFromWealthbox<WealthboxFieldItem>(accessToken, ENDPOINTS.CONTACT_ROLES),
    ]);

    // Convert each result to FieldOption format
    return {
      customFields: convertToFieldOptions(customFields),
      contactTypes: convertToFieldOptions(contactTypes),
      contactRoles: convertToFieldOptions(contactRoles),
    };
  } catch (error) {
    console.error('Error fetching Wealthbox field options:', error);
    return {
      customFields: [],
      contactTypes: [],
      contactRoles: [],
    };
  }
};

/**
 * Searches for field options across all Wealthbox field types
 * This is useful for dynamic searching as user types
 */
export const searchWealthboxFieldOptions = async (
  accessToken: string,
  searchTerm: string
): Promise<FieldOption[]> => {
  const allOptions = await fetchAllWealthboxFieldOptions(accessToken);
  
  // Combine all options into a single array
  const combinedOptions = [
    ...allOptions.customFields,
    ...allOptions.contactTypes,
    ...allOptions.contactRoles,
  ];
  
  // Filter options based on the search term
  if (!searchTerm) {
    return combinedOptions;
  }
  
  const searchTermLower = searchTerm.toLowerCase();
  return combinedOptions.filter(option => 
    option.label.toLowerCase().includes(searchTermLower)
  );
};