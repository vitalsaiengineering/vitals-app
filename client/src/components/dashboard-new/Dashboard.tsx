import React, { useState, useEffect } from "react";
import { Users, DollarSign, BarChart } from "lucide-react";
import { Header } from "./Header";
import { StatCard } from "./StatCard";
import { AumChart } from "./AumChart";
import { ClientsAgeChart } from "./ClientsChart";
import { ClientSegmentation } from "./ClientSegmentation";
import { AskVitals } from "./AskVitals";
import axios from "axios";
import { useMockData } from "@/contexts/MockDataContext";

// Import mock data
import mockData from "@/data/mockData.js";
import { getAllClients, calculateAge } from "@/utils/clientDataUtils.js";

interface DashboardMetrics {
  totalClients: number;
  aum: number;
  revenue: number;
  averageAge: number;
}

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    aum: 0,
    revenue: 0,
    averageAge: 0,
  });
  const [loading, setLoading] = useState(true);
  const { useMock } = useMockData();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (useMock) {
          // Use mock data to calculate metrics
          const clients = getAllClients();
          const totalClients = clients.length;
          const totalAUM = clients.reduce((sum, client) => sum + client.aum, 0);

          // Calculate average age from clients
          const totalAge = clients.reduce(
            (sum, client) => sum + calculateAge(client.dateOfBirth),
            0
          );
          const averageAge = Math.round(totalAge / totalClients);

          // Calculate revenue as a percentage of AUM (typical advisory fee is 1-1.5%)
          const revenue = totalAUM * 0.012; // 1.2% fee

          setMetrics({
            totalClients,
            aum: Math.round(totalAUM / 1000000), // Convert to millions
            revenue: Math.round((revenue / 1000000) * 10) / 10, // Convert to millions with 1 decimal
            averageAge,
          });
        } else {
          // Try to fetch from API
          const response = await axios.get("/api/advisor/metrics");
          if (response.data && response.data.success) {
            setMetrics({
              totalClients: response.data.metrics.totalClients || 0,
              aum: response.data.metrics.aum || 0,
              revenue: response.data.metrics.revenue || 0,
              averageAge: response.data.metrics.averageAge || 0,
            });
          } else {
            throw new Error("API response invalid");
          }
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);

        if (!useMock) {
          // Fallback to mock data if API fails
          try {
            const clients = getAllClients();
            const totalClients = clients.length;
            const totalAUM = clients.reduce(
              (sum, client) => sum + client.aum,
              0
            );

            const totalAge = clients.reduce(
              (sum, client) => sum + calculateAge(client.dateOfBirth),
              0
            );
            const averageAge = Math.round(totalAge / totalClients);

            const revenue = totalAUM * 0.012;

            setMetrics({
              totalClients,
              aum: Math.round(totalAUM / 1000000),
              revenue: Math.round((revenue / 1000000) * 10) / 10,
              averageAge,
            });
          } catch (fallbackError) {
            console.error("Error loading fallback data:", fallbackError);
            // Keep metrics at 0 if both API and mock data fail
            setMetrics({
              totalClients: 0,
              aum: 0,
              revenue: 0,
              averageAge: 0,
            });
          }
        } else {
          // Keep metrics at 0 if mock data fails
          setMetrics({
            totalClients: 0,
            aum: 0,
            revenue: 0,
            averageAge: 0,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [useMock]);

  const formatAUM = (value: number) => {
    return `$${value}M`;
  };

  const formatRevenue = (value: number) => {
    return `$${value}M`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* <Header /> */}

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Advisor Dashboard</h1>
            <div className="relative">
              <select className="pl-3 pr-8 py-1.5 rounded border appearance-none focus:outline-none focus:ring-1 focus:ring-vitals-lightBlue text-sm">
                <option>All Advisors</option>
                <option>Jack Sample</option>
                <option>Jane Doe</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M7 10l5 5 5-5H7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Clients"
              value={loading ? "Loading..." : metrics.totalClients.toString()}
              change={4.2}
              icon={<Users size={20} className="text-vitals-blue" />}
            />
            <StatCard
              title="AUM"
              value={loading ? "Loading..." : formatAUM(metrics.aum)}
              change={12.4}
              icon={<DollarSign size={20} className="text-vitals-blue" />}
            />
            <StatCard
              title="Revenue"
              value={loading ? "Loading..." : formatRevenue(metrics.revenue)}
              change={6.3}
              icon={<BarChart size={20} className="text-vitals-blue" />}
            />
            <StatCard
              title="Average Client Age"
              value={loading ? "Loading..." : metrics.averageAge.toString()}
              suffix="Average"
              icon={<Users size={20} className="text-vitals-blue" />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <AumChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ClientsAgeChart />
              <ClientSegmentation />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="h-full">
              <AskVitals />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
