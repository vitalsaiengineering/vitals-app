import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getOrionAumChartData } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMockData } from "@/contexts/MockDataContext";
import { filterClientsByAdvisor } from "@/lib/clientData";

// Import mock data
import mockData from "@/data/mockData.js";

// Interface for chart data
interface ChartDataPoint {
  period: string;
  date: string;
  aum: number;
  dataPoints: number;
  periodStart: string;
  periodEnd: string;
}

// Interface for segment chart data
interface SegmentChartData {
  year: number;
  Platinum: number;
  Gold: number;
  Silver: number;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

interface AumChartProps {
  showViewFullReport?: boolean;
  selectedAdvisor?: string;
}

export const AumChart = ({ showViewFullReport = true, selectedAdvisor = "All Advisors" }: AumChartProps) => {
  const [aggregation, setAggregation] = useState<
    "monthly" | "quarterly" | "yearly"
  >("yearly");
  const [, navigate] = useLocation();
  const { useMock } = useMockData();

  // Fetch Orion AUM data
  const {
    data: aumResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orion-aum-chart-data", aggregation, selectedAdvisor],
    queryFn: () => getOrionAumChartData({ aggregation, advisor: selectedAdvisor !== "All Advisors" ? selectedAdvisor : undefined }),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !useMock, // Only fetch from API if not using mock data
  });

  // Define a unified tickFormatter function that always returns a string
  const tickFormatter = (value: number) => {
    return formatCurrency(value);
  };

  // Get mock data from BookDevelopmentBySegmentReport
  const getMockSegmentData = (): SegmentChartData[] => {
    // Define fixed base data that will always work
    const baseData = [
      { year: 2019, Platinum: 40000000, Gold: 25000000, Silver: 12000000 },
      { year: 2020, Platinum: 43000000, Gold: 27000000, Silver: 13000000 },
      { year: 2021, Platinum: 46000000, Gold: 29000000, Silver: 14000000 },
      { year: 2022, Platinum: 50000000, Gold: 31000000, Silver: 15000000 },
      { year: 2023, Platinum: 54000000, Gold: 33000000, Silver: 16000000 },
      { year: 2024, Platinum: 58000000, Gold: 36000000, Silver: 17000000 },
      { year: 2025, Platinum: 63000000, Gold: 39000000, Silver: 18000000 },
    ];
    
    // If filtering by advisor, adjust the values
    if (selectedAdvisor !== "All Advisors") {
      // Create advisor-specific distribution patterns
      const advisorDistributionPatterns: Record<string, {Platinum: number, Gold: number, Silver: number}> = {
        "Jackson Miller": { Platinum: 0.40, Gold: 0.35, Silver: 0.25 }, // First advisor has more Platinum
        "Sarah Johnson": { Platinum: 0.30, Gold: 0.45, Silver: 0.25 },  // Second advisor has more Gold
        "Thomas Chen": { Platinum: 0.25, Gold: 0.35, Silver: 0.40 },    // Third advisor has more Silver
        "Maria Reynolds": { Platinum: 0.35, Gold: 0.35, Silver: 0.30 }  // Fourth advisor is balanced
      };
      
      // Use the pattern for this advisor (or a default pattern as fallback)
      const pattern = advisorDistributionPatterns[selectedAdvisor] || 
        { Platinum: 0.33, Gold: 0.33, Silver: 0.34 };
      
      // Assume each advisor manages roughly 25% of the total AUM
      const ratio = 0.25;
      
      const filteredData = baseData.map(dataPoint => {
        // Calculate total for this year
        const totalValue = dataPoint.Platinum + dataPoint.Gold + dataPoint.Silver;
        
        // Apply the ratio to get this advisor's portion
        const advisorTotal = totalValue * ratio;
        
        // Distribute according to this advisor's pattern
        return {
          year: dataPoint.year,
          Platinum: advisorTotal * pattern.Platinum,
          Gold: advisorTotal * pattern.Gold,
          Silver: advisorTotal * pattern.Silver
        };
      });
      
      // Debug logging
      console.log("AumChart - Filtered Data:", {
        selectedAdvisor,
        pattern,
        ratio,
        baseData: baseData[0],
        filteredData: filteredData[0],
        dataLength: filteredData.length,
        totalBaseAum: baseData[0].Platinum + baseData[0].Gold + baseData[0].Silver,
        totalFilteredAum: filteredData[0].Platinum + filteredData[0].Gold + filteredData[0].Silver
      });
      
      return filteredData;
    }
    
    return baseData;
  };

  // Transform original API data for legacy chart
  const realData =
    aumResponse?.data?.map((item: ChartDataPoint) => ({
      period: item.period,
      aum: item.aum,
      date: item.date,
      dataPoints: item.dataPoints,
    })) || [];

  // Transform real data into segment chart format if it exists
  const transformedRealData = realData.length > 0
    ? realData.map((item: { period: string; aum: number; date: string; dataPoints: number }) => ({
        year: new Date(item.date).getFullYear(),
        Platinum: item.aum * 0.5, // Example distribution - adjust based on actual data structure
        Gold: item.aum * 0.3,
        Silver: item.aum * 0.2,
      }))
    : [];

  // Check if we should show mock data
  const shouldShowMockData =
    useMock ||
    (realData.length === 0 &&
      !isLoading &&
      (!error ||
        (error &&
          error.message?.includes("Firm integration config not found"))));

  // Get chart data based on what we're showing
  const segmentChartData = shouldShowMockData ? getMockSegmentData() : transformedRealData;

  // Debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("AumChart Debug:", {
      realDataLength: realData.length,
      isLoading,
      error: error?.message,
      shouldShowMockData,
      useMock,
      segmentDataLength: segmentChartData.length,
      selectedAdvisor,
    });
  }

  // Loading state
  if (isLoading && !useMock) {
    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Book Development By Segment
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Loading portfolio data from Orion...
          </p>
        </div>

        <div className="h-[300px] flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading AUM data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state (only show for errors that aren't "Firm integration config not found")
  if (
    error &&
    !error.message?.includes("Firm integration config not found") &&
    !useMock
  ) {
    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Book Development By Segment
            </h2>
            <button
              onClick={() => refetch()}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
          <p className="text-sm text-red-500 mt-1">
            Failed to load AUM data. Please check your Orion connection.
          </p>
        </div>

        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Unable to load portfolio data</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleViewFullReport = () => {
    navigate("/reporting/book-development");
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex flex-col mb-2">
        <div className="flex justify-between items-center">
          {showViewFullReport && (
            <>
              <h2 className="text-lg font-semibold">Book Development By Segment</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleViewFullReport}
                className="text-sm text-blue-600 hover:underline cursor-pointer"
              >
                View Full Report
              </button>
            </div>
          </>
        )}
        </div>
        <div className="flex justify-between items-center mt-1">

            <p className="text-sm text-gray-500">
              Hover over data points to see detailed values by segment
            </p>
        </div>
      </div>

      <div className={`h-[300px] ${shouldShowMockData ? "relative" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={segmentChartData}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f5f5f5"
            />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
            />
            <YAxis
              tickFormatter={tickFormatter}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                `${name} Segment AUM`,
              ]}
              labelStyle={{ color: "#555" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Legend />

            <Area
              type="monotone"
              dataKey="Silver"
              stackId="1"
              stroke="hsl(210, 55%, 78%)"
              fill="hsl(210, 55%, 78%)"
              fillOpacity={0.85}
              name="Silver"
            />
            <Area
              type="monotone"
              dataKey="Gold"
              stackId="1"
              stroke="hsl(216, 65%, 58%)"
              fill="hsl(216, 65%, 58%)"
              fillOpacity={0.85}
              name="Gold"
            />
            <Area
              type="monotone"
              dataKey="Platinum"
              stackId="1"
              stroke="hsl(222, 47%, 44%)"
              fill="hsl(222, 47%, 44%)"
              fillOpacity={0.85}
              name="Platinum"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
