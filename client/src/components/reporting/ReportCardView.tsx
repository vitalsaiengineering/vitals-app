import React from 'react';
import { Report } from '@/pages/reporting';
import { ReportCard } from './ReportCard'; // Assuming ReportCard is in the same directory

interface ReportCardViewProps {
  reports: Report[];
  onToggleFavorite: (reportId: string) => void;
  onViewReport: (reportId: string) => void;
}

export function ReportCardView({ reports, onToggleFavorite, onViewReport }: ReportCardViewProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No reports found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onToggleFavorite={onToggleFavorite}
          onViewReport={onViewReport}
        />
      ))}
    </div>
  );
}