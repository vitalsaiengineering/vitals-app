
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { FieldMapping } from '@/types/mapping';

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

  const handleSelectChange = (value: string) => {
    onMappingChange(sourceField, value);
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
    <div className="mapping-row">
      <div className="mapping-field">
        <div className="mapping-label">{sourceSystem} Field</div>
        <div className="mapping-value">{sourceLabel || sourceField}</div>
      </div>
      
      <div className="mapping-arrow">
        <ArrowRight className="w-5 h-5" />
      </div>
      
      <div className="mapping-field">
        <div className="mapping-label">{targetSystem} Field</div>
        {customInput ? (
          <Input
            type="text"
            value={formatInputValue(targetField, inputType)}
            onChange={handleInputChange}
            className="w-full"
            placeholder={`Enter ${inputType === 'currency' ? 'amount' : 'value'}...`}
          />
        ) : (
          <Select value={targetField} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${targetSystem} field...`} />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default FieldMappingRow;
