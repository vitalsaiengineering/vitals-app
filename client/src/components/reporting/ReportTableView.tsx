import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Report } from '@/pages/reporting'; // Assuming Report type is exported from reporting.tsx
import { Star, ExternalLink } from 'lucide-react';

interface ReportTableViewProps {
  reports: Report[];
  onToggleFavorite: (reportId: string) => void;
  onViewReport: (reportId: string) => void;
}

export function ReportTableView({ reports, onToggleFavorite, onViewReport }: ReportTableViewProps) {
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
                <span>{report.name}</span>
                <Button variant="ghost" size="icon" className="ml-2 h-7 w-7" onClick={() => onToggleFavorite(report.id)}>
                  <Star className={`h-4 w-4 ${report.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                </Button>
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