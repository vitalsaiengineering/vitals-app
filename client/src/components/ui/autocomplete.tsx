import * as React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutocompleteOption {
  value: string;
  label: string;
  fieldType?: string;
  documentType?: string;
  options?: AutocompleteOption[];
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  // New props for dynamic loading
  onSearch?: (search: string) => Promise<AutocompleteOption[]>;
  isLoading?: boolean;
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyMessage = "No options found",
  className,
  disabled = false,
  onSearch,
  isLoading = false,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedInputValue, setDebouncedInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>(options);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to find selected option (including nested options)
  const findSelectedOption = useCallback((options: AutocompleteOption[], value: string): AutocompleteOption | null => {
    for (const option of options) {
      if (option.value === value) {
        return option;
      }
      if (option.options) {
        const nested = findSelectedOption(option.options, value);
        if (nested) return nested;
      }
    }
    return null;
  }, []);

  // Selected option's label
  const selectedOption = findSelectedOption(options, value);
  const selectedLabel = selectedOption?.label || "";

  // Handle debounced input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, 300); // 300ms debounce time

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  // Flatten options for searching (includes nested options)
  const flattenOptions = useCallback((options: AutocompleteOption[]): AutocompleteOption[] => {
    const flattened: AutocompleteOption[] = [];
    
    for (const option of options) {
      // Add the parent field
      flattened.push(option);
      
      // Add nested options if they exist
      if (option.options && option.options.length > 0) {
        flattened.push(...option.options);
      }
    }
    
    return flattened;
  }, []);

  // Search function that handles both local filtering and API search
  const handleSearch = useCallback(async () => {
    // If no search value, just show all options
    if (!debouncedInputValue) {
      setFilteredOptions(options);
      return;
    }

    // If onSearch is provided, use it for dynamic loading
    if (onSearch) {
      setSearchLoading(true);
      try {
        const searchResults = await onSearch(debouncedInputValue);
        setFilteredOptions(searchResults);
      } catch (error) {
        console.error('Error searching options:', error);
        // Fall back to local filtering if search fails
        const flattened = flattenOptions(options);
        const filtered = flattened.filter(option =>
          option.label.toLowerCase().includes(debouncedInputValue.toLowerCase())
        );
        setFilteredOptions(filtered);
      } finally {
        setSearchLoading(false);
      }
    } else {
      // Do local filtering if no onSearch provided
      const flattened = flattenOptions(options);
      const filtered = flattened.filter(option =>
        option.label.toLowerCase().includes(debouncedInputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [debouncedInputValue, options, onSearch, flattenOptions]);

  // Run search when debounced input changes
  useEffect(() => {
    handleSearch();
  }, [debouncedInputValue, handleSearch]);

  // Update filtered options when options change
  useEffect(() => {
    if (!debouncedInputValue) {
      setFilteredOptions(options);
    }
  }, [options, debouncedInputValue]);

  // Toggle field expansion
  const toggleFieldExpansion = (fieldValue: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldValue)) {
      newExpanded.delete(fieldValue);
    } else {
      newExpanded.add(fieldValue);
    }
    setExpandedFields(newExpanded);
  };

  // Render option item with proper styling and nesting
  const renderOption = (option: AutocompleteOption, isNested = false) => {
    const hasNestedOptions = option.options && option.options.length > 0;
    const isExpanded = expandedFields.has(option.value);
    
    return (
      <React.Fragment key={option.value}>
        <CommandItem
          value={option.value}
          onSelect={(currentValue) => {
            if (hasNestedOptions && !isNested) {
              // If this is a parent field with options, toggle expansion instead of selecting
              toggleFieldExpansion(option.value);
            } else {
              // Select the option
              onValueChange(currentValue);
              setInputValue("");
              setOpen(false);
            }
          }}
          className={cn(
            isNested && "pl-6",
            hasNestedOptions && !isNested && "cursor-pointer"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {hasNestedOptions && !isNested && (
                <ChevronRight 
                  className={cn(
                    "mr-2 h-4 w-4 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              )}
              <div>
                <div className="font-medium">{option.label}</div>
              </div>
            </div>
            {!hasNestedOptions && (
              <Check
                className={cn(
                  "ml-auto h-4 w-4",
                  value === option.value ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </div>
        </CommandItem>
        
        {/* Render nested options if expanded */}
        {hasNestedOptions && isExpanded && option.options?.map(nestedOption => 
          renderOption(nestedOption, true)
        )}
      </React.Fragment>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            value ? selectedLabel : placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            className="h-9"
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {(isLoading || searchLoading) ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading options...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map(option => renderOption(option))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}