import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Report } from '@/pages/reporting';
import { Star, ExternalLink } from 'lucide-react';

interface ReportCardProps {
  report: Report;
  onToggleFavorite: (reportId: string) => void;
  onViewReport: (reportId: string) => void;
}

export function ReportCard({ report, onToggleFavorite, onViewReport }: ReportCardProps) {
  const handleFavoriteClick = () => {
    console.log(`ReportCard: Star clicked for ${report.id}. Calling onToggleFavorite.`);
    onToggleFavorite(report.id);
  };

  return (
    <Card className="flex flex-col h-full"> {/* Ensure card takes full height for consistent alignment in a grid */}
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">{report.name}</CardTitle>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-1 h-8 w-8" onClick={handleFavoriteClick}>
            <Star className={`h-5 w-5 ${report.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
          </Button>
        </div>
        <CardDescription className="text-sm h-16 pt-1 text-ellipsis overflow-hidden"> {/* Fixed height for description */}
          {report.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional content can go here if needed */}
      </CardContent>
      <CardFooter className="pt-4 flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        {report.status === 'Coming Soon' ? (
          <span className="w-full sm:w-auto text-center text-xs font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full">
            Coming Soon
          </span>
        ) : (
          <Button size="sm" className="w-full sm:w-auto" onClick={() => onViewReport(report.id)}>
            View Report <ExternalLink className="h-4 w-4 ml-1.5" />
          </Button>
        )}
        <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled={!!report.status}>
          {report.integrations}
        </Button>
      </CardFooter>
    </Card>
  );
}