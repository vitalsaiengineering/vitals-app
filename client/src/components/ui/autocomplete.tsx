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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutocompleteOption {
  value: string;
  label: string;
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selected option's label
  const selectedLabel = options.find(option => option.value === value)?.label || "";

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
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(debouncedInputValue.toLowerCase())
        );
        setFilteredOptions(filtered);
      } finally {
        setSearchLoading(false);
      }
    } else {
      // Do local filtering if no onSearch provided
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(debouncedInputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [debouncedInputValue, options, onSearch]);

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
                  {filteredOptions.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue);
                        setInputValue("");
                        setOpen(false);
                      }}
                    >
                      {option.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}