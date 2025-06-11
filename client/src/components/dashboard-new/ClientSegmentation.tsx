import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

// Import mock data
import mockData from "@/data/mockData.js";

// Define types for chart data
interface SegmentData {
  name: string;
  count: number;
  percentage: number;
  value: number;
  color: string;
}

export const ClientSegmentation = () => {
  const [chartData, setChartData] = useState<SegmentData[]>([]);
  const [, navigate] = useLocation();

  // Check if we should use mock data
  const useMock = import.meta.env.VITE_USE_MOCK_DATA !== "false";

  useEffect(() => {
    const loadData = () => {
      try {
        if (useMock) {
          // Use centralized mock data from ClientSegmentationDashboard
          const segmentationData = mockData.ClientSegmentationDashboard;

          // Transform donutChartData for pie chart with value property
          const transformedData: SegmentData[] =
            segmentationData.donutChartData.map((segment: SegmentData) => ({
              ...segment,
              value: segment.percentage, // Add value property for pie chart dataKey
            }));

          setChartData(transformedData);
        } else {
          // Fallback to original hardcoded data if not using mock
          const fallbackData: SegmentData[] = [
            {
              name: "Platinum",
              count: 30,
              percentage: 30,
              value: 30,
              color: "#304FFE",
            },
            {
              name: "Gold",
              count: 45,
              percentage: 45,
              value: 45,
              color: "#4A89DC",
            },
            {
              name: "Silver",
              count: 25,
              percentage: 25,
              value: 25,
              color: "#90CAF9",
            },
          ];
          setChartData(fallbackData);
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
        // Fallback to original hardcoded data on error
        const fallbackData: SegmentData[] = [
          {
            name: "Platinum",
            count: 30,
            percentage: 30,
            value: 30,
            color: "#304FFE",
          },
          {
            name: "Gold",
            count: 45,
            percentage: 45,
            value: 45,
            color: "#4A89DC",
          },
          {
            name: "Silver",
            count: 25,
            percentage: 25,
            value: 25,
            color: "#90CAF9",
          },
        ];
        setChartData(fallbackData);
      }
    };

    loadData();
  }, [useMock]);

  const handleViewFullReport = () => {
    navigate("/reporting/client-segmentation-dashboard");
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Client Segmentation</h2>
          <p className="text-sm text-gray-500">Distribution by client value</p>
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${
                  chartData.find((item) => item.name === name)?.count
                } clients (${
                  chartData.find((item) => item.name === name)?.percentage || 0
                }%)`,
                "Count",
              ]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value) => value}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
