import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMockData } from "@/contexts/MockDataContext";

// Import mock data
import mockData from "@/data/mockData.js";

// Define types for chart data
interface ChartDataPoint {
  name: string;
  premium: number;
  standard: number;
  basic: number;
  premiumAum?: number;
  standardAum?: number;
  basicAum?: number;
}

interface SegmentBreakdown {
  segment: string;
  clients: number;
  aum: number;
}

interface AgeBracket {
  bracket: string;
  clientCount: number;
  clientPercentage: number;
  aum: number;
  aumPercentage: number;
  detailedBreakdown: SegmentBreakdown[];
}

export const ClientsAgeChart = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [, navigate] = useLocation();
  const { useMock } = useMockData();

  useEffect(() => {
    const loadData = () => {
      try {
        if (useMock) {
          // Use centralized mock data from AgeDemographics report
          const ageDemographicsData = mockData.AgeDemographicsReport;

          // Transform the data to match chart format
          const transformedData: ChartDataPoint[] =
            ageDemographicsData.byAgeBracket.map((bracket: AgeBracket) => {
              // Extract segment counts from detailed breakdown
              const platinum =
                bracket.detailedBreakdown.find(
                  (item: SegmentBreakdown) => item.segment === "Platinum"
                )?.clients || 0;
              const gold =
                bracket.detailedBreakdown.find(
                  (item: SegmentBreakdown) => item.segment === "Gold"
                )?.clients || 0;
              const silver =
                bracket.detailedBreakdown.find(
                  (item: SegmentBreakdown) => item.segment === "Silver"
                )?.clients || 0;

              return {
                name: bracket.bracket,
                premium: platinum, // Map Platinum → Premium
                standard: gold, // Map Gold → Standard
                basic: silver, // Map Silver → Basic
                // Keep the AUM data for potential future use
                premiumAum:
                  (bracket.detailedBreakdown.find(
                    (item: SegmentBreakdown) => item.segment === "Platinum"
                  )?.aum || 0) / 1000000,
                standardAum:
                  (bracket.detailedBreakdown.find(
                    (item: SegmentBreakdown) => item.segment === "Gold"
                  )?.aum || 0) / 1000000,
                basicAum:
                  (bracket.detailedBreakdown.find(
                    (item: SegmentBreakdown) => item.segment === "Silver"
                  )?.aum || 0) / 1000000,
              };
            });

          setChartData(transformedData);
        } else {
          // Fallback to original hardcoded data if not using mock
          const fallbackData: ChartDataPoint[] = [
            {
              name: "<20",
              premium: 0,
              standard: 1,
              basic: 1,
              premiumAum: 0,
              standardAum: 0.8,
              basicAum: 0.5,
            },
            {
              name: "20-40",
              premium: 3,
              standard: 2,
              basic: 3,
              premiumAum: 3.5,
              standardAum: 1.8,
              basicAum: 1.2,
            },
            {
              name: "41-60",
              premium: 3,
              standard: 4,
              basic: 4,
              premiumAum: 4.2,
              standardAum: 3.6,
              basicAum: 2.8,
            },
            {
              name: "61-80",
              premium: 4,
              standard: 3,
              basic: 3,
              premiumAum: 5.1,
              standardAum: 2.7,
              basicAum: 2.1,
            },
            {
              name: ">80",
              premium: 2,
              standard: 1,
              basic: 1,
              premiumAum: 2.5,
              standardAum: 0.7,
              basicAum: 0.3,
            },
          ];
          setChartData(fallbackData);
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
        // Fallback to original hardcoded data on error
        const fallbackData: ChartDataPoint[] = [
          { name: "<20", premium: 0, standard: 1, basic: 1 },
          { name: "20-40", premium: 3, standard: 2, basic: 3 },
          { name: "41-60", premium: 3, standard: 4, basic: 4 },
          { name: "61-80", premium: 4, standard: 3, basic: 3 },
          { name: ">80", premium: 2, standard: 1, basic: 1 },
        ];
        setChartData(fallbackData);
      }
    };

    loadData();
  }, [useMock]);

  const handleViewFullReport = () => {
    navigate("/reporting/age-demographics");
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Age Demographics</h2>
          <p className="text-sm text-gray-500">
            Distribution across age groups
          </p>
        </div>
        <button
          onClick={handleViewFullReport}
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          View Full Report
        </button>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f5f5f5"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
            />
            <Tooltip
              formatter={(value) => [`${value}`, "Clients"]}
              labelStyle={{ color: "#555" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />

            <Bar dataKey="basic" stackId="a" fill="#B3D4FF" name="Basic" />
            <Bar
              dataKey="standard"
              stackId="a"
              fill="#4A89DC"
              name="Standard"
            />
            <Bar dataKey="premium" stackId="a" fill="#1E3A8A" name="Premium" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
