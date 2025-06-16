import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Search } from 'lucide-react';
import { FieldMapping } from '@/types/mapping';
import { Badge } from '@/components/ui/badge';

interface FieldMappingRowProps {
  mapping: FieldMapping;
  onMappingChange: (sourceField: string, targetField: string) => void;
  onInputChange?: (sourceField: string, value: string) => void;
  sourceSystem: string;
  targetSystem: string;
}

const FieldMappingRow: React.FC<FieldMappingRowProps> = ({
  mapping,
  onMappingChange,
  onInputChange,
  sourceSystem,
  targetSystem,
}) => {
  const { sourceField, sourceLabel, targetField, targetOptions, customInput, inputType } = mapping;
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Check if this is a time estimate field
  const isTimeEstimate = targetOptions?.some(option => option.value.includes('_minutes'));

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return targetOptions;
    return targetOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [targetOptions, searchTerm]);

  const handleSelectOption = (option: any) => {
    onMappingChange(sourceField, option.value);
    setSearchTerm(option.label);
    setIsSearchFocused(false);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle slider change for time estimates
  const handleSliderChange = (value: number[]) => {
    const minutes = value[0];
    const minuteValue = `${minutes}_minutes`;
    onMappingChange(sourceField, minuteValue);
  };

  // Get current slider value from targetField
  const getCurrentSliderValue = () => {
    if (!targetField || !targetField.includes('_minutes')) return 15;
    const match = targetField.match(/(\d+)_minutes/);
    return match ? parseInt(match[1]) : 15;
  };

  const formatInputValue = (value: string, type?: string) => {
    if (!value) return '';
    
    if (type === 'currency' && !value.startsWith('$') && value.length > 0) {
      return '$' + value;
    }
    
    return value;
  };

  // Get the current selected option to display
  const selectedOption = targetOptions.find(opt => opt.value === targetField);
  const displayValue = selectedOption ? selectedOption.label : 'Please Select a Value';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-6 border-b border-slate-200 last:border-b-0 bg-white">
      <div className="space-y-3">
        <Label className="text-base font-medium text-slate-900 leading-relaxed">
          {sourceLabel || sourceField}
        </Label>
        <div className="text-sm text-slate-500 font-medium">
          {sourceSystem} Field
        </div>
      </div>
      
      <div className="space-y-3">
        <Label className="text-base font-medium text-slate-900 leading-relaxed">
          {targetSystem} Mapping
        </Label>
        {customInput ? (
          <Input
            type="text"
            value={formatInputValue(targetField, inputType)}
            onChange={handleInputChange}
            className="w-full bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base h-12"
            placeholder={`Enter ${inputType === 'currency' ? 'amount' : 'value'}...`}
          />
        ) : isTimeEstimate ? (
          <div className="space-y-4">
            <div className="px-3 py-2 bg-slate-50 rounded-md">
              <span className="text-lg font-semibold text-slate-700">
                {getCurrentSliderValue()} minutes
              </span>
            </div>
            <div className="px-2">
              <Slider
                value={[getCurrentSliderValue()]}
                onValueChange={handleSliderChange}
                max={60}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 min</span>
                <span>60 min</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={isSearchFocused ? searchTerm : displayValue}
                onChange={handleSearchChange}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setSearchTerm('');
                }}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                className="w-full pl-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base h-12"
                placeholder={`Search ${targetSystem} fields...`}
              />
            </div>
            
            {isSearchFocused && (
              <div className="absolute z-[9999] mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-60 overflow-y-auto min-w-[400px] left-0 right-0">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectOption(option)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700">{option.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2 bg-slate-100 text-slate-600">
                          {targetSystem}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-slate-500 text-center">
                    No fields found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldMappingRow;
