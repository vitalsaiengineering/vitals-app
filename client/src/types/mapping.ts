export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldMapping {
  sourceField: string;
  sourceLabel: string;
  targetField: string;
  targetOptions: FieldOption[];
  customInput?: boolean;
  inputType?: 'text' | 'number' | 'currency' | 'date';
}

export interface MappingSection {
  title: string;
  description?: string;
  mappings: FieldMapping[];
}