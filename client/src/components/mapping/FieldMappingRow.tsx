import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { FieldMapping, FieldOption } from '@/types/mapping';
import { Autocomplete } from '@/components/ui/autocomplete';

interface FieldMappingRowProps {
  mapping: FieldMapping;
  onMappingChange: (sourceField: string, targetField: string) => void;
  onInputChange?: (sourceField: string, value: string) => void;
  sourceSystem: string;
  targetSystem: string;
  onSearch?: (searchTerm: string) => Promise<FieldOption[]>;
}

const FieldMappingRow: React.FC<FieldMappingRowProps> = ({
  mapping,
  onMappingChange,
  onInputChange,
  sourceSystem,
  targetSystem,
  onSearch,
}) => {
  const { sourceField, sourceLabel, targetField, targetOptions, customInput, inputType } = mapping;
  const [isSearching, setIsSearching] = useState(false);

  const handleSelectChange = (value: string) => {
    onMappingChange(sourceField, value);
  };

  const handleSearch = async (searchTerm: string) => {
    if (!onSearch) return targetOptions;
    
    setIsSearching(true);
    try {
      const results = await onSearch(searchTerm);
      return results;
    } catch (error) {
      console.error('Error searching options:', error);
      return targetOptions;
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onInputChange) {
      let value = e.target.value;
      
      // For number inputs, remove non-numeric characters
      if (inputType === 'number') {
        value = value.replace(/[^0-9]/g, '');
      }
      
      // For currency inputs, remove non-numeric characters except the dollar sign
      if (inputType === 'currency') {
        value = value.replace(/[^0-9$]/g, '');
        // Remove the dollar sign if it's not at the beginning
        if (value.indexOf('$') > 0) {
          value = value.replace(/\$/g, '');
        }
        // Add dollar sign if it doesn't exist
        if (!value.startsWith('$') && value.length > 0) {
          value = '$' + value;
        }
      }
      
      onInputChange(sourceField, value);
    }
  };

  const formatInputValue = (value: string, type?: string) => {
    if (!value) return '';
    
    if (type === 'currency' && !value.startsWith('$') && value.length > 0) {
      return '$' + value;
    }
    
    return value;
  };

  return (
    <div className="border-b border-border p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">{sourceSystem} Field</div>
        <div className="text-muted-foreground">{sourceLabel || sourceField}</div>
      </div>
      
      <div className="flex-shrink-0">
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">{targetSystem} Field</div>
        {customInput ? (
          <Input
            type="text"
            value={formatInputValue(targetField, inputType)}
            onChange={handleInputChange}
            className="w-full"
            placeholder={`Enter ${inputType === 'currency' ? 'amount' : 'value'}...`}
          />
        ) : (
          <Autocomplete
            options={targetOptions}
            value={targetField}
            onValueChange={handleSelectChange}
            placeholder={`Select ${targetSystem} field...`}
            emptyMessage="No matching fields found"
            onSearch={onSearch ? handleSearch : undefined}
            isLoading={isSearching}
          />
        )}
      </div>
    </div>
  );
};

export default FieldMappingRow;