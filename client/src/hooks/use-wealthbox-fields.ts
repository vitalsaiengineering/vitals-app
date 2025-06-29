import { useState, useEffect, useCallback } from 'react';
import { FieldOption } from '@/types/mapping';
import { fetchAllWealthboxFieldOptions, fieldHasOptions, searchWithinFieldOptions } from '@/services/wealthbox-api';
import { useToast } from '@/hooks/use-toast';

type FieldCategory = 'customFields' | 'contactTypes' | 'contactRoles' | 'tags' | 'all';

export function useWealthboxFields(token?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<Record<string, FieldOption[]>>({
    customFields: [],
    contactTypes: [],
    contactRoles: [],
    tags: [],
  });
  const { toast } = useToast();

  // Function to fetch all field options from our backend
  const fetchOptions = useCallback(async () => {
    if (!token) {
      return; // Don't fetch if token is not available
    }
    
    setIsLoading(true);
    setHasError(false);

    try {
      const options = await fetchAllWealthboxFieldOptions(token);
      setFieldOptions(options);
    } catch (error) {
      console.error('Error in useWealthboxFields:', error);
      setHasError(true);
      toast({
        title: 'Error fetching field options',
        description: 'Could not load Wealthbox field options. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, token]);

  // Fetch options on initial load or when token changes
  useEffect(() => {
    if (token) {
      fetchOptions();
    }
  }, [fetchOptions, token]);

  /**
   * Get options from a specific category or combine all categories
   */
  const getOptions = useCallback(
    (category: FieldCategory = 'all'): FieldOption[] => {
      if (category === 'all') {
        return [
          ...fieldOptions.customFields,
          ...fieldOptions.contactTypes,
          ...fieldOptions.contactRoles,
          ...fieldOptions.tags,
        ];
      }
      return fieldOptions[category] || [];
    },
    [fieldOptions]
  );

  /**
   * Flatten options to include nested options for searching
   */
  const flattenOptionsForSearch = useCallback((options: FieldOption[]): FieldOption[] => {
    const flattened: FieldOption[] = [];
    
    for (const option of options) {
      // Add the parent field
      flattened.push(option);
      
      // Add nested options if they exist
      if (fieldHasOptions(option)) {
        flattened.push(...option.options!);
      }
    }
    
    return flattened;
  }, []);

  /**
   * Enhanced search across all field options including nested options
   */
  const searchOptions = useCallback(
    (searchTerm: string): FieldOption[] => {
      const allOptions = getOptions('all');
      
      if (!searchTerm) {
        return allOptions;
      }
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchingOptions: FieldOption[] = [];
      
      for (const option of allOptions) {
        // Check if the parent field matches
        const parentMatches = option.label.toLowerCase().includes(searchTermLower);
        
        if (fieldHasOptions(option)) {
          // Search within nested options
          const matchingNestedOptions = searchWithinFieldOptions(option, searchTerm);
          
          if (parentMatches || matchingNestedOptions.length > 0) {
            // If parent matches or has matching nested options, include the field
            // but only show matching nested options if parent doesn't match
            matchingOptions.push({
              ...option,
              options: parentMatches ? option.options : matchingNestedOptions
            });
          }
        } else if (parentMatches) {
          // Simple field that matches
          matchingOptions.push(option);
        }
      }
      
      return matchingOptions;
    },
    [getOptions]
  );

  /**
   * Get all available options including nested ones (flattened for simple selection)
   */
  const getAllFlattenedOptions = useCallback((): FieldOption[] => {
    const allOptions = getOptions('all');
    return flattenOptionsForSearch(allOptions);
  }, [getOptions, flattenOptionsForSearch]);

  return {
    isLoading,
    hasError,
    getOptions,
    searchOptions,
    getAllFlattenedOptions,
    refreshOptions: fetchOptions,
  };
}