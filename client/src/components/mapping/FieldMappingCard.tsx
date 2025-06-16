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
    <div className="max-w-5xl mx-auto px-4">
      <Card className="mb-6">
        <CardHeader style={{ backgroundColor: '#001027' }} className="text-white px-8 py-6 rounded-t-2xl">
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
    </div>
  );
};

export default FieldMappingCard;