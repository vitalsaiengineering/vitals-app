import { useState, useEffect, useCallback } from 'react';
import { FieldOption } from '@/types/mapping';
import { fetchAllWealthboxFieldOptions } from '@/services/wealthbox-api';
import { useToast } from '@/hooks/use-toast';

type FieldCategory = 'customFields' | 'contactTypes' | 'contactRoles' | 'all';

export function useWealthboxFields(accessToken: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<Record<string, FieldOption[]>>({
    customFields: [],
    contactTypes: [],
    contactRoles: [],
  });
  const { toast } = useToast();

  // Function to fetch all field options from Wealthbox
  const fetchOptions = useCallback(async () => {
    if (!accessToken) {
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const options = await fetchAllWealthboxFieldOptions(accessToken);
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
  }, [accessToken, toast]);

  // Fetch options on initial load if we have an access token
  useEffect(() => {
    if (accessToken) {
      fetchOptions();
    }
  }, [accessToken, fetchOptions]);

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
        ];
      }
      return fieldOptions[category] || [];
    },
    [fieldOptions]
  );

  /**
   * Search across all field options
   */
  const searchOptions = useCallback(
    (searchTerm: string): FieldOption[] => {
      const allOptions = getOptions('all');
      
      if (!searchTerm) {
        return allOptions;
      }
      
      const searchTermLower = searchTerm.toLowerCase();
      return allOptions.filter(option => 
        option.label.toLowerCase().includes(searchTermLower)
      );
    },
    [getOptions]
  );

  return {
    isLoading,
    hasError,
    getOptions,
    searchOptions,
    refreshOptions: fetchOptions,
  };
}