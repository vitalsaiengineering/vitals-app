import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Report = {
  id: string;
  name: string;
  path: string;
  isFavorite?: boolean;
};

// Sample reports data
const availableReports: Report[] = [
  { id: '1', name: 'Age Demographics', path: '/reporting/age-demographics' },
  { id: '2', name: 'Birthday Report', path: '/reporting/birthday-report' },
  { id: '3', name: 'Book Development', path: '/reporting/book-development' },
  { id: '4', name: 'Client Inception Report', path: '/reporting/client-inception' },
  { id: '5', name: 'Client Segmentation Report', path: '/reporting/client-segmentation' },
  { id: '6', name: 'Geographic Footprint', path: '/reporting/geographic-footprint' },
  { id: '7', name: 'Net New Assets', path: '/reporting/net-new-assets' },
  { id: '8', name: 'Referral Analytics', path: '/reporting/referral-analytics' },
  { id: '9', name: 'Valuation Insights', path: '/reporting/valuation-insights' },
];

type ReportSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favoriteReports: Array<{ name: string; path: string }>;
  onAddFavorite: (report: Report) => void;
};

export function ReportSearchDialog({ 
  open, 
  onOpenChange, 
  favoriteReports,
  onAddFavorite
}: ReportSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter reports based on search query
  const filteredReports = availableReports.filter(
    report => report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if a report is already favorited
  const isReportFavorited = (reportName: string) => {
    return favoriteReports.some(favReport => favReport.name === reportName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 py-2 border-b">
          <DialogTitle>Select Report</DialogTitle>
        </DialogHeader>
        
        <div className="relative px-4 py-2 border-b">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full py-2 pl-10 pr-4 border-0 focus:outline-none focus:ring-0 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          <div className="px-2 py-1 bg-gray-50 text-xs text-gray-500 font-medium">
            All Reports
          </div>
          
          {filteredReports.map((report) => {
            const isFavorited = isReportFavorited(report.name);
            
            return (
              <div 
                key={report.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                <span>{report.name}</span>
                <button 
                  onClick={() => !isFavorited && onAddFavorite(report)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    isFavorited ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-[#005EE1]"
                  )}
                  disabled={isFavorited}
                >
                  <Star className="h-5 w-5" fill={isFavorited ? "#005EE1" : "transparent"} />
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
} 