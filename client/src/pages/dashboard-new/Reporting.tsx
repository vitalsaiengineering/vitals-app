import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Star, ExternalLink, Search, LayoutGrid, List } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useLocation } from "react-router-dom";

type ReportType = "birthday" | "age-demographics" | "clients-aum-overtime" | "referral" | "client-inception" | "net-new-assets" | "client-segmentation" | "revenue-vs-expense" | "geographic-footprint";
type IntegrationSource = "Wealthbox" | "Orion" | "Manual";
type ViewMode = "card" | "table";

interface Integration {
  source: IntegrationSource;
  status: "connected" | "not-connected";
  lastSync?: string;
}

interface ReportItem {
  id: ReportType;
  name: string;
  description: string;
  url?: string;
  favorited?: boolean;
  integrations: Integration[];
  comingSoon?: boolean;
}

const Reporting = () => {
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const location = useLocation();

  // Initialize reports with favorites from localStorage or defaults
  useEffect(() => {
    try {
      const initialReports: ReportItem[] = [
        {
          id: "age-demographics" as ReportType,
          name: "Age Demographics",
          description: "Visualize your client base by age groups to identify opportunities",
          url: "https://preview--age-demographic-kpi.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "not-connected" as const
            }
          ]
        },
        {
          id: "birthday" as ReportType,
          name: "Birthday Report",
          description: "Track upcoming client birthdays for timely engagement",
          url: "https://preview--birthday-wealth-whisper.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            },
            { 
              source: "Manual" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-04-28" 
            }
          ]
        },
        {
          id: "clients-aum-overtime" as ReportType,
          name: "Book Development",
          description: "Visualize client growth and assets under management over time",
          url: "https://preview--cumulative-client-tracker.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            }
          ]
        },
        {
          id: "client-inception" as ReportType,
          name: "Client Inception Report",
          description: "Analyze when clients joined your practice",
          url: "https://preview--client-inception-and-segmentation.lovable.app/",
          integrations: [
            { 
              source: "Orion" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            }
          ]
        },
        {
          id: "client-segmentation" as ReportType,
          name: "Client Segmentation Report",
          description: "Visualize client segmentation across different categories",
          url: "https://preview--client-segmentation-dashboard.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            }
          ]
        },
        {
          id: "geographic-footprint" as ReportType,
          name: "Geographic Footprint",
          description: "View your client base and book of business by geography",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            }
          ],
          comingSoon: true
        },
        {
          id: "net-new-assets" as ReportType,
          name: "Net New Assets",
          description: "Track growth of assets under management over time",
          url: "https://preview--advisor-growth-metrics.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "not-connected" as const
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-02" 
            }
          ]
        },
        {
          id: "referral" as ReportType,
          name: "Referral Analytics",
          description: "Track referral sources and conversion rates",
          url: "https://preview--referral-metrics-harmony.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-04-30" 
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "not-connected" as const
            }
          ]
        },
        {
          id: "revenue-vs-expense" as ReportType,
          name: "Revenue vs Client Expense",
          description: "Compare client revenue against expenses over time",
          url: "https://preview--client-expenditure-inspector.lovable.app/",
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-02" 
            },
            { 
              source: "Orion" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-02" 
            }
          ]
        }
      ].sort((a, b) => a.name.localeCompare(b.name)); // Sort reports alphabetically by name

      const storedFavorites = localStorage.getItem("favoriteReports");
      if (storedFavorites) {
        const favoriteIds = JSON.parse(storedFavorites);
        if (Array.isArray(favoriteIds)) {
          const updatedReports = initialReports.map(report => ({
            ...report,
            favorited: favoriteIds.includes(report.id)
          }));
          setReports(updatedReports);
        } else {
          setReports(initialReports);
        }
      } else {
        setReports(initialReports);
      }
      
      // Load view preference if available
      const storedViewMode = localStorage.getItem("reportsPageViewMode");
      if (storedViewMode === "card" || storedViewMode === "table") {
        setViewMode(storedViewMode as ViewMode);
      }
    } catch (e) {
      console.error("Error initializing reports:", e);
      // Fallback to default reports if there's an error
      setReports([
        {
          id: "birthday" as ReportType,
          name: "Birthday Report",
          description: "Track upcoming client birthdays",
          url: "https://preview--birthday-wealth-whisper.lovable.app/",
          favorited: false,
          integrations: [
            { 
              source: "Wealthbox" as IntegrationSource, 
              status: "connected" as const, 
              lastSync: "2025-05-01" 
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Parse URL query parameters for direct report access
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const reportParam = queryParams.get("report");
    if (reportParam && !loading) {
      const matchingReport = reports.find(r => r.id === reportParam);
      if (matchingReport) {
        setReportType(matchingReport.id);
      }
    }
  }, [location.search, reports, loading]);

  // Listen for changes to favorites in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "favoriteReports" && e.newValue) {
        try {
          const favoriteIds = JSON.parse(e.newValue);
          if (Array.isArray(favoriteIds)) {
            setReports(prevReports =>
              prevReports.map(report => ({
                ...report,
                favorited: favoriteIds.includes(report.id)
              }))
            );
          }
        } catch (error) {
          console.error("Error handling storage change:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save favorites to localStorage when they change
  const saveFavoritesToStorage = (updatedReports: ReportItem[]) => {
    try {
      const favoriteIds = updatedReports
        .filter(report => report.favorited)
        .map(report => report.id);
      localStorage.setItem("favoriteReports", JSON.stringify(favoriteIds));
    } catch (error) {
      console.error("Error saving favorites to localStorage:", error);
    }
  };

  const toggleFavorite = (id: ReportType) => {
    setReports(prevReports => {
      const updatedReports = prevReports.map(report => {
        if (report.id === id) {
          const newStatus = !report.favorited;
          toast({
            title: newStatus ? "Added to favorites" : "Removed from favorites",
            description: `${report.name} has been ${newStatus ? "added to" : "removed from"} your favorites.`
          });
          return { ...report, favorited: newStatus };
        }
        return report;
      });
      
      saveFavoritesToStorage(updatedReports);
      return updatedReports;
    });
  };

  const openReport = (id: ReportType) => {
    setReportType(id);
  };

  const closeReport = () => {
    setReportType(null);
  };
  
  const toggleViewMode = () => {
    const newViewMode = viewMode === "card" ? "table" : "card";
    setViewMode(newViewMode);
    // Save preference to localStorage
    localStorage.setItem("reportsPageViewMode", newViewMode);
  };

  const currentReport = reportType ? reports.find(report => report.id === reportType) : null;
  const favoriteReports = reports.filter(report => report.favorited);
  
  // Filter non-favorite reports based on search query
  const filteredNonFavoriteReports = reports
    .filter(report => !report.favorited)
    .filter(report => 
      searchQuery === "" || 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
  // Also apply search to favorite reports
  const filteredFavoriteReports = favoriteReports.filter(report =>
    searchQuery === "" ||
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderIntegrationStatus = (integration: Integration) => {
    return (
      <div className="flex items-center gap-1">
        <Badge 
          variant={integration.status === "connected" ? "outline" : "outline"}
          className="text-xs"
        >
          {integration.status === "connected" ? "Connected" : "Not connected"}
        </Badge>
        {integration.lastSync && (
          <span className="text-xs text-muted-foreground">
            Last sync: {integration.lastSync}
          </span>
        )}
      </div>
    );
  };

  const renderReportCards = (reports: ReportItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map(report => (
        <Card key={report.id} className="overflow-hidden border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">{report.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(report.id)}
                className="h-8 w-8"
              >
                <Star className={`h-4 w-4 ${report.favorited ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
            <div className="flex justify-between items-center">
              {report.comingSoon ? (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                  Coming Soon
                </Badge>
              ) : (
                <Button 
                  onClick={() => openReport(report.id)}
                  className="flex items-center"
                >
                  View Report
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">Data Sources</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Data Sources</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.integrations.map((integration, idx) => (
                          <TableRow key={`${report.id}-${integration.source}-${idx}`}>
                            <TableCell>{integration.source}</TableCell>
                            <TableCell>{renderIntegrationStatus(integration)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderReportTable = (reports: ReportItem[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report</TableHead>
            <TableHead className="max-w-xs">Description</TableHead>
            <TableHead>Integrations</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map(report => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {report.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(report.id)}
                    className="h-6 w-6"
                  >
                    <Star className={`h-4 w-4 ${report.favorited ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="text-sm text-muted-foreground truncate">{report.description}</p>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">Data Sources</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">Data Sources</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Source</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.integrations.map((integration, idx) => (
                            <TableRow key={`${report.id}-${integration.source}-${idx}`}>
                              <TableCell>{integration.source}</TableCell>
                              <TableCell>{renderIntegrationStatus(integration)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                {report.comingSoon ? (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                    Coming Soon
                  </Badge>
                ) : (
                  <Button 
                    onClick={() => openReport(report.id)}
                    className="flex items-center"
                    size="sm"
                  >
                    View Report
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center space-x-2">
          <div className="border rounded-md p-1 flex items-center">
            <Toggle
              aria-label="Card view"
              pressed={viewMode === "card"}
              onPressedChange={() => viewMode !== "card" && toggleViewMode()}
              className={`px-3 py-1.5 ${viewMode === "card" ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Card View
            </Toggle>
            <Toggle
              aria-label="Table view"
              pressed={viewMode === "table"}
              onPressedChange={() => viewMode !== "table" && toggleViewMode()}
              className={`px-3 py-1.5 ${viewMode === "table" ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
            >
              <List className="h-4 w-4 mr-2" />
              Table View
            </Toggle>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          {reportType && (
            <Button variant="outline" className="bg-white" onClick={closeReport}>
              ← Back to Reports
            </Button>
          )}
        </div>
        {reportType && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white">
                Change Report: <span className="font-medium ml-2">{currentReport?.name}</span>
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
                  
                  {favoriteReports.length > 0 && (
                    <>
                      <CommandGroup heading="Favorites">
                        {favoriteReports.map((report) => (
                          <CommandItem
                            key={report.id}
                            value={report.name}
                            onSelect={() => {
                              setReportType(report.id);
                              setOpen(false);
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span className={reportType === report.id ? "font-medium" : ""}>
                              {report.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(report.id);
                              }}
                              className="h-8 w-8"
                            >
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            </Button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}
                  
                  <CommandGroup heading="All Reports">
                    {reports.filter(report => !report.favorited).map((report) => (
                      <CommandItem
                        key={report.id}
                        value={report.name}
                        onSelect={() => {
                          setReportType(report.id);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span className={reportType === report.id ? "font-medium" : ""}>
                          {report.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(report.id);
                          }}
                          className="h-8 w-8"
                        >
                          <Star className={`h-4 w-4 ${report.favorited ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="flex-1">
        <CardContent className={`${reportType ? "p-0" : "p-6"} h-full`}>
          {reportType && currentReport?.url ? (
            <iframe 
              src={currentReport.url} 
              className="w-full h-full border-none"
              title={currentReport.name}
              loading="lazy"
              key={currentReport.id}
            />
          ) : reportType ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl text-gray-400">{currentReport?.name}</h2>
                <p className="text-gray-500 mt-2">{currentReport?.description}</p>
                <p className="text-gray-500 mt-4">Report content not available</p>
              </div>
            </div>
          ) : (
            // Landing page with reports list
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Available Reports</h2>
                <div className="flex items-center gap-4">
                  <div className="border rounded-md p-1 flex items-center">
                    <Toggle
                      aria-label="Card view"
                      pressed={viewMode === "card"}
                      onPressedChange={() => viewMode !== "card" && toggleViewMode()}
                      className={`px-3 py-1.5 ${viewMode === "card" ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Card View
                    </Toggle>
                    <Toggle
                      aria-label="Table view"
                      pressed={viewMode === "table"}
                      onPressedChange={() => viewMode !== "table" && toggleViewMode()}
                      className={`px-3 py-1.5 ${viewMode === "table" ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Table View
                    </Toggle>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-500 mb-6">
                Select a report to view detailed analytics. Star your favorite reports for quick access.
              </p>
              
              {/* Search box - now placed at the top level before any reports */}
              <div className="relative w-full max-w-md mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search reports..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {favoriteReports.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Favorites</h3>
                  {filteredFavoriteReports.length > 0 ? (
                    viewMode === "card" ? 
                      renderReportCards(filteredFavoriteReports) : 
                      renderReportTable(filteredFavoriteReports)
                  ) : (
                    searchQuery !== "" && (
                      <div className="py-4 text-center text-muted-foreground">
                        No favorite reports found matching "{searchQuery}"
                      </div>
                    )
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">All Reports</h3>
                
                {filteredNonFavoriteReports.length > 0 ? (
                  viewMode === "card" ? 
                    renderReportCards(filteredNonFavoriteReports) : 
                    renderReportTable(filteredNonFavoriteReports)
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No reports found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reporting;
