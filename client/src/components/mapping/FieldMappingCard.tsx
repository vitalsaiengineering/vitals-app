import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FieldMappingRow from './FieldMappingRow';
import { FieldMapping, FieldOption } from '@/types/mapping';

export interface FieldMappingCardProps {
  title: string;
  description?: string;
  mappings: FieldMapping[];
  onMappingChange: (sourceField: string, targetField: string) => void;
  onInputChange?: (sourceField: string, value: string) => void;
  sourceSystem: string;
  targetSystem: string;
  onSearch?: (searchTerm: string) => Promise<FieldOption[]>;
}

const FieldMappingCard: React.FC<FieldMappingCardProps> = ({
  title,
  description,
  mappings,
  onMappingChange,
  onInputChange,
  sourceSystem,
  targetSystem,
  onSearch,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border">
          {mappings.map((mapping) => (
            <FieldMappingRow
              key={mapping.sourceField}
              mapping={mapping}
              onMappingChange={onMappingChange}
              onInputChange={onInputChange}
              sourceSystem={sourceSystem}
              targetSystem={targetSystem}
              onSearch={onSearch}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FieldMappingCard;