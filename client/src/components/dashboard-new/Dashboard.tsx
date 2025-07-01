import React, { useState, useEffect } from "react";
import { Users, DollarSign, BarChart } from "lucide-react";
import { StatCard } from "./StatCard";
import { AumChart } from "./AumChart";
import { ClientsAgeChart } from "./ClientsChart";
import { ClientSegmentation } from "./ClientSegmentation";
import { AskVitals } from "./AskVitals";
import axios from "axios";
import { useMockData } from "@/contexts/MockDataContext";
import { useAdvisor } from "@/contexts/AdvisorContext";
import { filterClientsByAdvisor } from "@/lib/clientData";
import { formatAUMShort, formatRevenue } from "@/utils/client-analytics";

// Import mock data
import mockData from "@/data/mockData.js";
import { getAllClients, calculateAge } from "@/utils/clientDataUtils.js";

interface DashboardMetrics {
  totalClients: number;
  aum: number;
  revenue: number;
  averageAge: number;
  changes?: {
    clientChange: number;
    aumChange: number;
    revenueChange: number;
    ageChange: number;
  };
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
  const { selectedAdvisor } = useAdvisor();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (useMock) {
          // Use mock data to calculate metrics
          let clients = getAllClients();
          
          // Filter clients by selected advisor if not "All Advisors"
          if (selectedAdvisor !== "All Advisors") {
            clients = clients.filter((client: any) => client.advisor === selectedAdvisor);
          }
          
          const totalClients = clients.length;
          const totalAUM = clients.reduce((sum: number, client: any) => sum + client.aum, 0);

          // Calculate average age from clients
          const totalAge = clients.reduce(
            (sum: number, client: any) => sum + calculateAge(client.dateOfBirth),
            0
          );
          const averageAge = totalClients > 0 ? Math.round(totalAge / totalClients) : 0;

          // Calculate revenue as a percentage of AUM (typical advisory fee is 1-1.5%)
          const revenue = totalAUM * 0.012; // 1.2% fee

          // Generate mock changes for consistency with API
          const mockChanges = {
            clientChange: parseFloat((Math.random() * 6 - 1).toFixed(1)), // -1% to 5%
            aumChange: parseFloat((Math.random() * 15 + 2).toFixed(1)),   // 2% to 17%
            revenueChange: parseFloat((Math.random() * 10 + 1).toFixed(1)), // 1% to 11%
            ageChange: parseFloat((Math.random() * 1 - 0.5).toFixed(1))   // -0.5% to 0.5%
          };

          setMetrics({
            totalClients,
            aum: Math.round(totalAUM / 1000000), // Convert to millions
            revenue: Math.round((revenue / 1000000) * 10) / 10, // Convert to millions with 1 decimal
            averageAge,
            changes: mockChanges
          });
        } else {
          // Try to fetch from API
          const params = selectedAdvisor !== "All Advisors" ? { advisor: selectedAdvisor } : {};
          const response = await axios.get("/api/advisor/metrics", { params });
          if (response.data && response.data.success) {
            setMetrics({
              totalClients: response.data.metrics.totalClients || 0,
              aum: response.data.metrics.aum || 0,
              revenue: response.data.metrics.revenue || 0,
              averageAge: response.data.metrics.averageAge || 0,
              changes: response.data.metrics.changes || {
                clientChange: 0,
                aumChange: 0,
                revenueChange: 0,
                ageChange: 0
              }
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
            let clients = getAllClients();
            
            // Filter clients by selected advisor if not "All Advisors"
            if (selectedAdvisor !== "All Advisors") {
              clients = clients.filter((client: any) => client.advisor === selectedAdvisor);
            }
            
            const totalClients = clients.length;
            const totalAUM = clients.reduce(
              (sum: number, client: any) => sum + client.aum,
              0
            );

            const totalAge = clients.reduce(
              (sum: number, client: any) => sum + calculateAge(client.dateOfBirth),
              0
            );
            const averageAge = totalClients > 0 ? Math.round(totalAge / totalClients) : 0;

            const revenue = totalAUM * 0.012;

            // Generate fallback changes
            const fallbackChanges = {
              clientChange: 2.1,
              aumChange: 8.3,
              revenueChange: 5.2,
              ageChange: 0.1
            };

            setMetrics({
              totalClients,
              aum: Math.round(totalAUM / 1000000),
              revenue: Math.round((revenue / 1000000) * 10) / 10,
              averageAge,
              changes: fallbackChanges
            });
          } catch (fallbackError) {
            console.error("Error loading fallback data:", fallbackError);
            // Keep metrics at 0 if both API and mock data fail
            setMetrics({
              totalClients: 0,
              aum: 0,
              revenue: 0,
              averageAge: 0,
              changes: {
                clientChange: 0,
                aumChange: 0,
                revenueChange: 0,
                ageChange: 0
              }
            });
          }
        } else {
          // Keep metrics at 0 if mock data fails
          setMetrics({
            totalClients: 0,
            aum: 0,
            revenue: 0,
            averageAge: 0,
            changes: {
              clientChange: 0,
              aumChange: 0,
              revenueChange: 0,
              ageChange: 0
            }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [useMock, selectedAdvisor]); // Re-fetch when selectedAdvisor changes

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {selectedAdvisor !== "All Advisors" ? `${selectedAdvisor}'s Dashboard` : "Advisor Dashboard"}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Clients"
            value={loading ? "Loading..." : metrics.totalClients.toString()}
            change={metrics.changes?.clientChange || 0}
            icon={<Users size={20} className="text-vitals-blue" />}
          />
          <StatCard
            title="AUM"
            value={loading ? "Loading..." : formatAUMShort(metrics.aum)}
            change={metrics.changes?.aumChange || 0}
            icon={<DollarSign size={20} className="text-vitals-blue" />}
          />
          <StatCard
            title="Revenue"
            value={loading ? "Loading..." : formatRevenue(metrics.revenue)}
            change={metrics.changes?.revenueChange || 0}
            icon={<BarChart size={20} className="text-vitals-blue" />}
          />
          <StatCard
            title="Average Client Age"
            value={loading ? "Loading..." : metrics.averageAge.toString()}
            change={metrics.changes?.ageChange || 0}
            suffix="Years"
            icon={<Users size={20} className="text-vitals-blue" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AumChart selectedAdvisor={selectedAdvisor} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ClientsAgeChart selectedAdvisor={selectedAdvisor} />
            <ClientSegmentation selectedAdvisor={selectedAdvisor} />
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="h-full">
            <AskVitals />
          </div>
        </div>
      </div>
    </div>
  );
};
