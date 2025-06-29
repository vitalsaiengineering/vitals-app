import axios from 'axios';
import { FieldOption } from '@/types/mapping';

// Use our backend API endpoints instead of calling Wealthbox directly
const API_BASE_URL = '/api/wealthbox';

// Interface for API responses from our backend
interface BackendApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Fetches all field options from our backend (which proxies to Wealthbox)
 * This avoids CORS issues by going through our server
 */
export const fetchAllWealthboxFieldOptions = async (token?: string): Promise<Record<string, FieldOption[]>> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<BackendApiResponse<Record<string, FieldOption[]>>>(
      `${API_BASE_URL}/field-options`,
      { headers }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Error from backend:', response.data.error);
      return {
        customFields: [],
        contactTypes: [],
        contactRoles: [],
        tags: [],
      };
    }
  } catch (error) {
    console.error('Error fetching Wealthbox field options:', error);
    return {
      customFields: [],
      contactTypes: [],
      contactRoles: [],
      tags: [],
    };
  }
};

/**
 * Searches for field options across all Wealthbox field types using our backend
 * This is useful for dynamic searching as user types
 */
export const searchWealthboxFieldOptions = async (
  searchTerm: string = "",
  token?: string
): Promise<FieldOption[]> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<BackendApiResponse<FieldOption[]>>(
      `${API_BASE_URL}/field-options/search`,
      {
        params: { search: searchTerm },
        headers
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Error from backend:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('Error searching Wealthbox field options:', error);
    return [];
  }
};

/**
 * Helper function to check if a field has nested options
 */
export const fieldHasOptions = (field: FieldOption): boolean => {
  return field.options !== undefined && field.options.length > 0;
};

/**
 * Helper function to get all available options for a field
 * Returns the field's nested options if available, otherwise returns the field itself as an option
 */
export const getFieldOptions = (field: FieldOption): FieldOption[] => {
  if (fieldHasOptions(field)) {
    return field.options!;
  }
  return [{ label: field.label, value: field.value }];
};

/**
 * Searches within nested field options for fields that have them
 * This is useful when you want to search within the options of a specific field
 */
export const searchWithinFieldOptions = (
  field: FieldOption,
  searchTerm: string
): FieldOption[] => {
  if (!fieldHasOptions(field)) {
    return [];
  }
  
  if (!searchTerm) {
    return field.options!;
  }
  
  const searchTermLower = searchTerm.toLowerCase();
  return field.options!.filter(option => 
    option.label.toLowerCase().includes(searchTermLower)
  );
};