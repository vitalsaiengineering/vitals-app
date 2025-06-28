import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter"; // Import useLocation from wouter
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportTableView } from "@/components/reporting/ReportTableView";
import { ReportCardView } from "@/components/reporting/ReportCardView";
import { useToast } from "@/hooks/use-toast";
import { isFavoriteReport } from "@/lib/favorites";
import {
  LayoutGrid,
  List,
  Search,
  FileText,
  BarChart2,
  Users,
  CalendarDays,
  TrendingUp,
  PieChart,
  DollarSign,
  Map,
} from "lucide-react"; // Added Map

// Report interface (ensure it's defined or imported)
export interface Report {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Lucide icon component
  routePath: string; // Path for react-router
  isFavorite: boolean;
  status?: string; // Optional status like "Coming Soon"
  // tags?: string[]; // Optional tags for filtering
  // lastRun?: string; // Optional: "YYYY-MM-DD" or "Today", "Yesterday"
  // createdBy?: string; // Optional: "System", "User Name"
  integrations?: string[]; // e.g., ["Wealthbox", "Orion"]
}




const initialMockReports: Report[] = [
  {
    id: "firm-activity-dashboard",
    name: "Firm Activity Dashboard",
    routePath: "firm-activity-dashboard",
    description: "Monitor staff activities and performance across all departments.",
    integrations: ["Data Sources"],
    status: "Coming Soon",
    isFavorite: false,
  },
  {
    id: "age-demographics",
    name: "Age Demographics",
    routePath: "age-demographics",
    description:
      "Visualize your client base by age groups to identify opportunities.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "birthday",
    name: "Birthday Report",
    routePath: "birthday-report",
    description: "Track upcoming client birthdays for timely engagement.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "clients-aum-overtime",
    name: "Book Development",
    routePath: "clients-aum-overtime",
    description:
      "Visualize client growth and assets under management over time.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "client-inception-report",
    name: "Client Inception Report",
    routePath: "client-inception-report",
    description: "Track client acquisition and segmentation metrics.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "geographic-footprint",
    name: "Geographic Footprint",
    routePath: "geographic-footprint",
    description: "View your client base and book of business by geography.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "client-referral-rate",
    name: "Client Referral Rate",
    routePath: "client-referral-rate",
    description: "Track client referral rates and identify top referrers.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "segmentation-dashboard",
    name: "Segmentation Dashboard",
    routePath: "segmentation-dashboard",
    description: "Visualize client segmentation across different categories.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "referral-analytics",
    name: "Referral Analytics",
    routePath: "referral-analytics",
    description: "Analyze referral patterns and sources.",
    integrations: ["Data Sources"],
    isFavorite: false,
  },
  {
    id: "net-new-assets",
    name: "Net New Assets",
    routePath: "net-new-assets",
    description: "Track growth of assets under management over time.",
    integrations: ["Data Sources"],
    status: "Coming Soon",
    isFavorite: false,
  },
  {
    id: "revenue-vs-expense",
    name: "Revenue vs Client Expense",
    routePath: "revenue-vs-client-expense",
    description: "Compare client revenue against expenses over time.",
    integrations: ["Data Sources"],
    status: "Coming Soon",
    isFavorite: false,
  }
].sort((a, b) => a.name.localeCompare(b.name));

// Function to initialize reports with correct favorite status from localStorage
const initializeReportsWithFavorites = (): Report[] => {
  return initialMockReports.map(report => ({
    ...report,
    isFavorite: isFavoriteReport(report.id)
  }));
};

export default function Reporting() {
  const [activeView, setActiveView] = useState<"card" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<Report[]>(initializeReportsWithFavorites());
  const { toast } = useToast();
  const [, navigate] = useLocation(); // Use wouter's useLocation for navigation

  // Listen for favorite changes from ReportSearchDialog
  useEffect(() => {
    const handleReportFavoriteChanged = (event: CustomEvent) => {
      const { reportId, isFavorite } = event.detail;
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? { ...report, isFavorite }
            : report
        )
      );
    };

    window.addEventListener('reportFavoriteChanged', handleReportFavoriteChanged as EventListener);
    return () => window.removeEventListener('reportFavoriteChanged', handleReportFavoriteChanged as EventListener);
  }, []);

  // Filtered reports based on search term
  const searchedReports = useMemo(() => {
    if (!searchTerm.trim()) {
      return reports;
    }
    return reports.filter(
      (report) =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  // Separate lists for favorites and non-favorites from the searched results
  const favoriteReports = useMemo(() => {
    return searchedReports.filter((report) => report.isFavorite);
  }, [searchedReports]);

  const nonFavoriteReports = useMemo(() => {
    return searchedReports.filter((report) => !report.isFavorite);
  }, [searchedReports]);

  // Toggle favorite status of a report and show toast
  const toggleFavorite = useCallback(
    (reportId: string) => {
      const reportToToggle = reports.find((r) => r.id === reportId);
      if (!reportToToggle) return;
      const reportNameForToast = reportToToggle.name;
      const wasFavoriteForToast = !!reportToToggle.isFavorite;
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? { ...report, isFavorite: !report.isFavorite }
            : report
        )
      );
      const title = wasFavoriteForToast
        ? "Removed from favorites"
        : "Added to favorites";
      const description = `${reportNameForToast} has been ${
        wasFavoriteForToast ? "removed from" : "added to"
      } your favorites.`;
      toast({ title, description });
    },
    [reports, setReports, toast]
  );

  // Handle actual report viewing - now navigates
  const handleViewReport = (reportId: string) => {
    const reportToView = reports.find((r) => r.id === reportId);
    if (reportToView) {
      // Use routePath if available, otherwise fall back to id (ensure id is URL-safe)
      const pathIdentifier = reportToView.routePath || reportToView.id;
      console.log("Navigating to report:", pathIdentifier);
      navigate(`/reporting/${pathIdentifier}`); // Use wouter's navigate
    } else {
      console.error("Report not found for navigation:", reportId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Reporting</h1>
      </div>

      <div>
        <h2 className="text-2xl font-medium mb-2">Available Reports</h2>
        <p className="text-muted-foreground mb-4">
          Select a report to view detailed analytics. Star your favorite reports
          for quick access.
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeView === "card" ? "default" : "outline"}
              onClick={() => setActiveView("card")}
              size="sm"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Card View
            </Button>
            <Button
              variant={activeView === "table" ? "default" : "outline"}
              onClick={() => setActiveView("table")}
              size="sm"
            >
              <List className="h-4 w-4 mr-2" />
              Table View
            </Button>
          </div>
        </div>

        {/* Favorites Section */}
        {favoriteReports.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">Favorites</h3>
            {activeView === "card" ? (
              <ReportCardView
                reports={favoriteReports}
                onToggleFavorite={toggleFavorite}
                onViewReport={handleViewReport}
              />
            ) : (
              <ReportTableView
                reports={favoriteReports}
                onToggleFavorite={toggleFavorite}
                onViewReport={handleViewReport}
              />
            )}
          </div>
        )}

        {/* All Reports Section */}
        <div>
          <h3 className="text-xl font-medium mb-4">All Reports</h3>
          {activeView === "card" ? (
            <ReportCardView
              reports={nonFavoriteReports}
              onToggleFavorite={toggleFavorite}
              onViewReport={handleViewReport}
            />
          ) : (
            <ReportTableView
              reports={nonFavoriteReports}
              onToggleFavorite={toggleFavorite}
              onViewReport={handleViewReport}
            />
          )}
          {favoriteReports.length > 0 &&
            nonFavoriteReports.length === 0 &&
            searchTerm && (
              <div className="text-center text-muted-foreground py-10">
                No other reports match your search.
              </div>
            )}
          {favoriteReports.length === 0 && nonFavoriteReports.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No reports available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
