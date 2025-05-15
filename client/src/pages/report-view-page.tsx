import React from 'react';
import { useRoute, Link, useLocation } from 'wouter'; // Import wouter hooks and Link
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AgeDemographicsReport from '@/components/reporting/AgeDemographicsReport';

const reportRegistry: { [key: string]: { component: React.FC<any>, title: string } } = {
  'age-demographics': { component: AgeDemographicsReport, title: 'Client Age Demographics' },
  // ... other reports
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