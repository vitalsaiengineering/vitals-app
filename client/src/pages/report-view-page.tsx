import React, { useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter'; // Import wouter hooks and Link
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Brain } from 'lucide-react';
import { ReportFiltersProvider } from '@/contexts/ReportFiltersContext';
import FiltersSidebar from '@/components/reporting/FiltersSidebar';
import AgeDemographicsReport from '@/components/reporting/ClientAgeDemographicsReport';
import ClientDistributionByStateReport from '@/components/reporting/ClientDistributionByStateReport'; // Import the new report
import BookDevelopmentBySegmentReport from '@/components/reporting/BookDevelopmentBySegmentReport';
import ClientBirthdayReport from '@/components/reporting/ClientBirthdayReport';
import SegmentationDashboard from '@/components/reporting/SegmentationDashboard';
import ClientInceptionReport from '@/components/reporting/ClientInceptionReport';
import ReferralAnalyticsReport from '@/components/reporting/ReferralAnalyticsReport';
import ClientReferralRate from '@/components/reporting/ClientReferralRate';
import FirmActivityDashboard from '@/components/reporting/FirmActivityDashboard'; // Import the new report
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Star } from 'lucide-react';

// Define a registry for report components
const reportRegistry: { [key: string]: { component: React.FC<any>, title: string } } = {
  // 'firm-activity-dashboard': { component: FirmActivityDashboard, title: 'Firm Activity Dashboard' },
  'age-demographics': { component: AgeDemographicsReport, title: 'Age Demographics' },
  'birthday-report': { component: ClientBirthdayReport, title: 'Birthday Report' },
  'clients-aum-overtime': { component: BookDevelopmentBySegmentReport, title: 'Book Development' },
  'client-inception-report': { component: ClientInceptionReport, title: 'Client Inception Report' },
  'geographic-footprint': { component: ClientDistributionByStateReport, title: 'Geographic Footprint' },
  'client-referral-rate': { component: ClientReferralRate, title: 'Client Referral Rate' },
  'segmentation-dashboard': { component: SegmentationDashboard, title: 'Segmentation Dashboard' },
  'referral-analytics': { component: ReferralAnalyticsReport, title: 'Referral Analytics' },
  // Add other reports here as they are created
  // 'clients-aum-overtime': { component: ClientsAUMOverTimeReport, title: 'Clients & AUM Over Time' },
  // 'net-new-assets': { component: NetNewAssetsReport, title: 'Net New Assets' },
};



export default function ReportViewPage() {
  const [match, params] = useRoute("/reporting/:reportId");
  const [, navigate] = useLocation(); // For navigation
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const reportId = params?.reportId; // Access reportId from params

  if (!match || !reportId) { // Check if the route matches and reportId exists
    return (
        <div>
            <h2>Report Not Found</h2>
            <p>The report ID could not be determined from the URL.</p>
            {/* Use wouter's Link or navigate for "Back to Reports" */}
            <Link href="/reporting">
                <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
                </Button>
            </Link>
        </div>
    );
  }

  const reportDetails = reportRegistry[reportId];

  if (!reportDetails) {
    return (
      <div>
        <h2>Report Not Found</h2>
        <p>The report type "{reportId}" is not recognized.</p>
        {/* Use wouter's Link or navigate */}
        <Link href="/reporting">
            <Button>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
            </Button>
        </Link>
      </div>
    );
  }

  const ReportComponent = reportDetails.component;
  
  const handleReportChange = (newReportId: string) => {
    navigate(`/reporting/${newReportId}`);
    setDialogOpen(false);
  };

  return (
    <ReportFiltersProvider>
      <div className="flex h-screen bg-background">
        {/* Left Sidebar - Filters */}
        <div className={`transition-all duration-300 ${leftSidebarCollapsed ? 'w-0' : 'w-100'} relative h-full`}>
          <div className={`${leftSidebarCollapsed ? 'hidden' : 'block'} h-full`}>
            <FiltersSidebar />
          </div>
          
          {/* Left Sidebar Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            className={`absolute top-4 z-10 p-2 bg-background border shadow-md flex items-center whitespace-nowrap ${
              leftSidebarCollapsed ? '-right-12' : 'right-6'
            }`}
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          >
            {leftSidebarCollapsed ? (
              <div className="flex items-center space-x-1">
                <Filter className="h-4 w-4" />
                <ChevronRight className="h-4 w-4" />
              </div>
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border bg-background">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link href="/reporting">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
                  </Button>
                </Link>
                
                {/* Filters Toggle for Mobile/Small Screens */}
                {leftSidebarCollapsed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeftSidebarCollapsed(false)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Intelligence Toggle for Mobile/Small Screens */}
                {rightSidebarCollapsed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRightSidebarCollapsed(false)}
                    className="lg:hidden"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    AI Insights
                  </Button>
                )}
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white">
                      Change Report: <span className="font-medium ml-2">{reportDetails.title}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Select Report</DialogTitle>
                    </DialogHeader>
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput placeholder="Search reports..." />
                      <CommandList className="max-h-[400px]">
                        <CommandEmpty>No reports found.</CommandEmpty>
                        <CommandGroup heading="All Reports">
                          {Object.entries(reportRegistry).map(([id, report]) => (
                            <CommandItem
                              key={id}
                              value={report.title}
                              onSelect={() => handleReportChange(id)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <span className={reportId === id ? "font-medium" : ""}>
                                {report.title}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          
          {/* Report Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <ReportComponent reportId={reportId} />
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Vitals Intelligence */}
        <div className={`transition-all duration-300 ${rightSidebarCollapsed ? 'w-0' : 'w-100'} relative h-full`}>
          <div className={`${rightSidebarCollapsed ? 'hidden' : 'block'} w-80 bg-background border-l border-border p-6 overflow-y-auto h-full`}>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold">Vitals Intelligence</h3>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">AI Analysis Active</h4>
                <p>Intelligence features will be displayed here based on the current report and filters.</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Coming Soon</h4>
                <ul className="space-y-1">
                  <li>• AI-Powered Client Segmentation</li>
                  <li>• Growth Trajectory Analysis</li>
                  <li>• Retention Risk Assessment</li>
                  <li>• Optimal Service Allocation</li>
                  <li>• Demographic Imbalance Alert</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            className={`absolute top-4 z-10 p-2 bg-background border shadow-md flex items-center whitespace-nowrap ${
              rightSidebarCollapsed ? '-left-12' : 'left-6'
            }`}
            onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          >
            {rightSidebarCollapsed ? (
              <div className="flex items-center space-x-1">
                <ChevronLeft className="h-4 w-4" />
                <Brain className="h-4 w-4" />
              </div>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </ReportFiltersProvider>
  );
}
