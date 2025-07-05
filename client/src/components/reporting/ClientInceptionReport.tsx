import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import ClientAnniversaryView from "./ClientAnniversaryView";
import ClientInceptionView from "./ClientInceptionView";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { getAdvisorReportTitle } from "@/lib/utils";

/**
 * ClientDashboard Component
 *
 * Main dashboard with exact layout matching reference image
 * Uses original data sources from ClientInceptionView and ClientAnniversaryView
 */
export default function ClientInceptionReport() {
  const [globalSearch, setGlobalSearch] = useState("");
  const { filters, filterOptions } = useReportFilters();

  const [activeTab, setActiveTab] = useState("clients");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        {/* Header with toggle buttons - enhanced modern design */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {getAdvisorReportTitle(
                "Client Inception Report",
                filters,
                filterOptions || undefined
              )}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Track client acquisition and segmentation metrics
            </p>
          </div>

          {/* Toggle buttons - modern blue theme design */}
          <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <Button
              variant={activeTab === "clients" ? "default" : "ghost"}
              className={`rounded-none border-0 px-4 py-2 font-medium transition-all duration-200 ${
                activeTab === "clients"
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("clients")}
            >
              <Users className="w-4 h-4 mr-2" />
              Clients
            </Button>
            <div className="w-px bg-gray-200" />
            <Button
              variant={activeTab === "anniversaries" ? "default" : "ghost"}
              className={`rounded-none border-0 px-4 py-2 font-medium transition-all duration-200 ${
                activeTab === "anniversaries"
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("anniversaries")}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                />
              </svg>
              Anniversaries
            </Button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "clients" && (
          <ClientInceptionView
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
          />
        )}

        {activeTab === "anniversaries" && (
          <ClientAnniversaryView
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
          />
        )}
      </div>
    </div>
  );
}
