import React from 'react';
import { useRoute, Link, useLocation } from 'wouter'; // Import wouter hooks and Link
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AgeDemographicsReport from '@/components/reporting/AgeDemographicsReport';
import ClientDistributionByStateReport from '@/components/reporting/ClientDistributionByStateReport'; // Import the new report
import BookDevelopmentBySegmentReport from '@/components/reporting/BookDevelopmentBySegmentReport';
import ClientBirthdayReport from '@/components/reporting/ClientBirthdayReport';
import ClientSegmentationDashboard from '@/components/reporting/ClientSegmentationDashboard';
import ClientDashboard from '@/components/reporting/ClientDashboard';
import ReferralAnalyticsReport from '@/components/reporting/ReferralAnalyticsReport';
import ClientReferralRate from '@/components/reporting/ClientReferralRate';
import AdvisoryFirmDashboard from '@/components/reporting/AdvisoryFirmDashboard'; // Import the new report
// Define a registry for report components
const reportRegistry: { [key: string]: { component: React.FC<any>, title: string } } = {
  'age-demographics': { component: AgeDemographicsReport, title: 'Client Age Demographics' },
  'client-distribution-by-state': { component: ClientDistributionByStateReport, title: 'Client Distribution by State' },
  'birthday-report': { component: ClientBirthdayReport, title: 'Client Birthday Report' },
  'client-segmentation-dashboard': { component: ClientSegmentationDashboard, title: 'Client Segmentation Dashboard' },
  'client-dashboard': { component: ClientDashboard, title: 'Client Dashboard' },
  'book-development': { component: BookDevelopmentBySegmentReport, title: 'Book Development by Segment' },
  'referral-analytics': { component: ReferralAnalyticsReport, title: 'Referral Analytics' },
  'client-referral-rate': { component: ClientReferralRate, title: 'Client Referral Rate ' },
  'advisory-firm-dashboard': { component: AdvisoryFirmDashboard, title: 'Advisory Firm Dashboard' },
  // Add other reports here as they are created
  // 'clients-aum-overtime': { component: ClientsAUMOverTimeReport, title: 'Clients & AUM Over Time' },
  // 'net-new-assets': { component: NetNewAssetsReport, title: 'Net New Assets' },
};

export default function ReportViewPage() {
  // For wouter, params are typically accessed via the Route component's children function
  // or by matching a route pattern with useRoute.
  // If this component is rendered directly by a <Route path="/reporting/:reportId">,
  // the `params` object will be passed to its children if it's a function.
  // Alternatively, use useRoute to get the params.
  const [match, params] = useRoute("/reporting/:reportId");
  const [, navigate] = useLocation(); // For navigation

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

  return (
    <div className="p-6 space-y-6">
      {/* Use wouter's Link or navigate */}
      <Link href="/reporting">
        <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
        </Button>
      </Link>
      <ReportComponent reportId={reportId} />
    </div>
  );
}