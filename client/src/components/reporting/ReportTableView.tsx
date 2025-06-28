import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Report } from '@/pages/reporting'; // Assuming Report type is exported from reporting.tsx
import { Star, ExternalLink } from 'lucide-react';
import { toggleFavoriteReport, isFavoriteReport } from '../../lib/favorites';
import { toast } from '@/hooks/use-toast';

interface ReportTableViewProps {
  reports: Report[];
  onToggleFavorite?: (reportId: string) => void; // Made optional since we'll handle it internally
  onViewReport: (reportId: string) => void;
}

export function ReportTableView({ reports, onToggleFavorite, onViewReport }: ReportTableViewProps) {
  const [favoritesChanged, setFavoritesChanged] = useState(0); // Force re-render trigger

  // Listen for favorites changes to update the table dynamically
  useEffect(() => {
    const handleFavoritesChanged = () => {
      setFavoritesChanged(prev => prev + 1); // Trigger re-render
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, []);

  // Handle toggle favorite using centralized system
  const handleToggleFavorite = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const wasAdded = toggleFavoriteReport({
        id: report.id,
        name: report.name,
        path: `/reporting/${report.routePath || report.id}`
      });
      
      toast({
        title: wasAdded ? "Added to favorites" : "Removed from favorites",
        description: `${report.name} has been ${wasAdded ? "added to" : "removed from"} your favorites.`
      });

      // Also call the parent's callback if provided (for backward compatibility)
      if (onToggleFavorite) {
        onToggleFavorite(reportId);
      }
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px] min-w-[200px]">Report</TableHead>
          <TableHead className="min-w-[300px]">Description</TableHead>
          <TableHead className="w-[150px] text-center">Integrations</TableHead>
          <TableHead className="w-[160px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
              No reports found.
            </TableCell>
          </TableRow>
        )}
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell className="font-medium">
              <div className="flex items-center">
              <Button variant="ghost" size="icon" className="ml-2 h-7 w-7" onClick={() => handleToggleFavorite(report.id)}>
                  <Star className={`h-4 w-4 ${isFavoriteReport(report.id) ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                </Button>
                <span className="truncate">{report.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{report.description}</TableCell>
            <TableCell className="text-center">
              <Button variant="outline" size="sm" disabled={!!report.status}>
                {report.integrations}
              </Button>
            </TableCell>
            <TableCell className="text-right">
              {report.status === 'Coming Soon' ? (
                <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              ) : (
                <Button size="sm" onClick={() => onViewReport(report.id)}>
                  View Report <ExternalLink className="h-4 w-4 ml-1.5" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}