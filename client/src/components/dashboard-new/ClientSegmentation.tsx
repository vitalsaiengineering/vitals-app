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
import { useMockData } from "@/contexts/MockDataContext";
import { filterClientsByAdvisor } from "@/lib/clientData";

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

interface ClientSegmentationProps {
  selectedAdvisor?: string;
}

export const ClientSegmentation: React.FC<ClientSegmentationProps> = ({ selectedAdvisor = "All Advisors" }) => {
  const [chartData, setChartData] = useState<SegmentData[]>([]);
  const [, navigate] = useLocation();
  const { useMock } = useMockData();

  useEffect(() => {
    const loadData = () => {
      try {
        if (useMock) {
          // Use centralized mock data from ClientSegmentationDashboard
          const segmentationData = mockData.ClientSegmentationDashboard;

          // Transform donutChartData for pie chart with value property
          let transformedData: SegmentData[] =
            segmentationData.donutChartData.map((segment: SegmentData) => ({
              ...segment,
              value: segment.percentage, // Add value property for pie chart dataKey
            }));

          // If a specific advisor is selected, adjust the data
          if (selectedAdvisor !== "All Advisors") {
            // Get all clients and filter by advisor
            const allClients = mockData.clients || [];
            const advisorClients = allClients.filter((client: any) => client.advisor === selectedAdvisor);
            
            // Calculate the ratio of this advisor's clients to all clients
            const ratio = advisorClients.length / allClients.length || 0.25;
            
            // Apply this ratio to the segment counts but keep percentages the same
            transformedData = transformedData.map(segment => ({
              ...segment,
              count: Math.round(segment.count * ratio),
              // Keep percentage the same since it's the proportion within the advisor's clients
            }));
          }

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
          
          // If a specific advisor is selected, adjust the data
          if (selectedAdvisor !== "All Advisors") {
            // Simple approach - reduce counts by a factor but keep percentages the same
            const ratio = 0.25; // Assume each advisor has about 25% of clients
            fallbackData.forEach(item => {
              item.count = Math.round(item.count * ratio);
              // Keep percentage and value the same
            });
          }
          
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
        
        // If a specific advisor is selected, adjust the data
        if (selectedAdvisor !== "All Advisors") {
          // Simple approach - reduce counts by a factor
          const ratio = 0.25; // Assume each advisor has about 25% of clients
          fallbackData.forEach(item => {
            item.count = Math.round(item.count * ratio);
            // Keep percentage and value the same
          });
        }
        
        setChartData(fallbackData);
      }
    };

    loadData();
  }, [useMock, selectedAdvisor]); // Re-run when selectedAdvisor changes

  const handleViewFullReport = () => {
    navigate("/reporting/client-segmentation-dashboard");
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Client Segmentation</h2>
          <p className="text-sm text-gray-500">
            {selectedAdvisor !== "All Advisors" 
              ? `${selectedAdvisor}'s client distribution by value`
              : "Distribution by client value"}
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
                name as string,
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
