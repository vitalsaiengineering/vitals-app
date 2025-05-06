import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, LayoutGrid, List } from "lucide-react";
import { SalesChart } from "./SalesChart";
import { PerformanceChart } from "./PerformanceChart";
import { toast } from "@/hooks/use-toast";
import { Toggle } from "@/components/ui/toggle";

type ReportType = "clients-aum-overtime" | "category" | "birthday" | "net-new-assets" | "client-segmentation" | "revenue-vs-expense";

interface ReportOption {
  id: ReportType;
  name: string;
  favorited: boolean;
}

export const ReportContainer = () => {
  const [reportType, setReportType] = useState<ReportType>("clients-aum-overtime");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [reportOptions, setReportOptions] = useState<ReportOption[]>([
    { id: "birthday" as ReportType, name: "Birthday Report", favorited: false },
    { id: "clients-aum-overtime" as ReportType, name: "Book Development", favorited: false },
    { id: "category" as ReportType, name: "Sales by Category", favorited: false },
    { id: "client-segmentation" as ReportType, name: "Client Segmentation Report", favorited: false },
    { id: "net-new-assets" as ReportType, name: "Net New Assets", favorited: false },
    { id: "revenue-vs-expense" as ReportType, name: "Revenue vs Client Expense", favorited: false }
  ].sort((a, b) => a.name.localeCompare(b.name))); // Sort alphabetically

  // Initialize favorites from localStorage safely
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem("favoriteReports");
      if (storedFavorites) {
        const favoriteIds = JSON.parse(storedFavorites);
        if (Array.isArray(favoriteIds)) {
          setReportOptions(prevOptions =>
            prevOptions.map(option => ({
              ...option,
              favorited: favoriteIds.includes(option.id)
            }))
          );
        }
      }
      
      // Load view preference if available
      const storedViewMode = localStorage.getItem("reportViewMode");
      if (storedViewMode === "card" || storedViewMode === "table") {
        setViewMode(storedViewMode);
      }
    } catch (e) {
      console.error("Error parsing stored favorites:", e);
    }
  }, []);

  // Listen for changes to favorites in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "favoriteReports" && e.newValue) {
        try {
          const favoriteIds = JSON.parse(e.newValue);
          if (Array.isArray(favoriteIds)) {
            setReportOptions(prevOptions =>
              prevOptions.map(option => ({
                ...option,
                favorited: favoriteIds.includes(option.id)
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

  const toggleFavorite = (id: ReportType) => {
    setReportOptions(prevOptions => {
      const newOptions = prevOptions.map(option => {
        if (option.id === id) {
          const newStatus = !option.favorited;
          return { ...option, favorited: newStatus };
        }
        return option;
      });
      
      // Safely update localStorage with current favorites
      try {
        // Get current favorites from localStorage
        const storedFavoritesJson = localStorage.getItem("favoriteReports");
        let allFavorites: string[] = [];
        
        if (storedFavoritesJson) {
          const storedFavorites = JSON.parse(storedFavoritesJson);
          if (Array.isArray(storedFavorites)) {
            // Filter out this component's report types to avoid duplicates
            allFavorites = storedFavorites.filter(id => 
              !["sales", "category", "birthday"].includes(id)
            );
          }
        }
        
        // Add current favorites
        const currentFavorites = newOptions
          .filter(option => option.favorited)
          .map(option => option.id);
        
        allFavorites = [...allFavorites, ...currentFavorites];
        localStorage.setItem("favoriteReports", JSON.stringify(allFavorites));
        
        const option = newOptions.find(o => o.id === id);
        if (option) {
          toast({
            title: option.favorited ? "Added to favorites" : "Removed from favorites",
            description: `${option.name} has been ${option.favorited ? "added to" : "removed from"} your favorites.`
          });
        }
      } catch (error) {
        console.error("Error updating favorites:", error);
      }
      
      return newOptions;
    });
  };

  const toggleViewMode = () => {
    const newViewMode = viewMode === "card" ? "table" : "card";
    setViewMode(newViewMode);
    // Save preference to localStorage
    localStorage.setItem("reportViewMode", newViewMode);
  };

  const currentOption = reportOptions.find(option => option.id === reportType) || reportOptions[0];

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          Report
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavorite(reportType)}
            className="h-6 w-6 ml-2"
          >
            <Star 
              className={`h-4 w-4 ${currentOption.favorited ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
            />
          </Button>
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="border rounded-md p-1 flex items-center">
            <Toggle
              aria-label="Card view"
              pressed={viewMode === "card"}
              onPressedChange={() => toggleViewMode()}
              variant="contrast"
              className={`px-2 py-1 ${viewMode === "card" ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Card View
            </Toggle>
            <Toggle
              aria-label="Table view"
              pressed={viewMode === "table"}
              onPressedChange={() => toggleViewMode()}
              variant="contrast"
              className={`px-2 py-1 ${viewMode === "table" ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'}`}
            >
              <List className="h-4 w-4 mr-1" />
              Table View
            </Toggle>
          </div>
          <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Report" />
            </SelectTrigger>
            <SelectContent>
              {reportOptions.map((option) => (
                <SelectItem key={option.id} value={option.id} className="flex items-center justify-between">
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {reportType === "clients-aum-overtime" ? (
          <div className="h-[300px] w-full">
            <iframe 
              src="https://preview--cumulative-client-tracker.lovable.app/" 
              className="w-full h-full border-none"
              title="Book Development"
              loading="lazy"
            />
          </div>
        ) : reportType === "category" ? (
          <div className="h-[300px]">
            <PerformanceChart />
          </div>
        ) : reportType === "net-new-assets" ? (
          <div className="h-[300px] w-full">
            <iframe 
              src="https://preview--advisor-growth-metrics.lovable.app/" 
              className="w-full h-full border-none"
              title="Net New Assets Report"
              loading="lazy"
            />
          </div>
        ) : reportType === "client-segmentation" ? (
          <div className="h-[300px] w-full">
            <iframe 
              src="https://preview--client-segmentation-dashboard.lovable.app/" 
              className="w-full h-full border-none"
              title="Client Segmentation Report"
              loading="lazy"
            />
          </div>
        ) : reportType === "revenue-vs-expense" ? (
          <div className="h-[300px] w-full">
            <iframe 
              src="https://preview--client-expenditure-inspector.lovable.app/" 
              className="w-full h-full border-none"
              title="Revenue vs Client Expense"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <iframe 
              src="https://preview--birthday-wealth-whisper.lovable.app/" 
              className="w-full h-full border-none"
              title="Birthday Report"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
