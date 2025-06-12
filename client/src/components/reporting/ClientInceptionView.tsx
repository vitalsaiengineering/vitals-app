import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getClientInceptionData,
  type ClientInceptionData,
  type GetClientInceptionParams,
} from "@/lib/clientData";

// Import mock data
import mockData from "@/data/mockData.js";

// Grade badge colors
const getGradeBadgeClasses = (grade: string) => {
  const GRADE_COLORS: Record<string, { badgeBg: string; badgeText: string }> = {
    Platinum: { badgeBg: "bg-blue-700", badgeText: "text-white" },
    Gold: { badgeBg: "bg-blue-600", badgeText: "text-white" },
    Silver: { badgeBg: "bg-blue-500", badgeText: "text-white" },
    Default: { badgeBg: "bg-gray-500", badgeText: "text-white" },
  };
  return GRADE_COLORS[grade] || GRADE_COLORS.Default;
};

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + entry.value,
      0
    );
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{`Year: ${label}`}</p>
        <p className="text-sm">{`Total: ${total} clients`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value} (${Math.round(
              (entry.value / total) * 100
            )}%)`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ClientInceptionViewProps {
  globalSearch: string;
}

export default function ClientInceptionView({
  globalSearch,
}: ClientInceptionViewProps) {
  const [inceptionData, setInceptionData] =
    useState<ClientInceptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedSegmentFilter, setSelectedSegmentFilter] =
    useState("All Segments");

  // Check if we should use mock data
  const useMock = import.meta.env.VITE_USE_MOCK_DATA !== "false";

  const fetchInceptionData = async (params?: GetClientInceptionParams) => {
    setIsLoading(true);
    setError(null);
    try {
      if (useMock) {
        // Use mock data
        const mockInceptionData =
          mockData.ClientInceptionData as ClientInceptionData;
        setInceptionData(mockInceptionData);
      } else {
        // Try to fetch from API, fallback to mock data on error
        try {
          const data = await getClientInceptionData(params);
          setInceptionData(data);
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to mock data:",
            apiError
          );
          const mockInceptionData =
            mockData.ClientInceptionData as ClientInceptionData;
          setInceptionData(mockInceptionData);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load inception data";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInceptionData(); // Initial fetch
  }, [useMock]);

  // Effect to re-fetch data when filters change
  useEffect(() => {
    const params: GetClientInceptionParams = {};
    if (globalSearch.trim()) params.search = globalSearch.trim();
    params.year = selectedYear;
    if (selectedSegmentFilter !== "All Segments")
      params.segmentFilter = selectedSegmentFilter;

    const timer = setTimeout(() => {
      fetchInceptionData(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearch, selectedYear, selectedSegmentFilter]);

  if (error) {
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  }

  const segmentButtons = ["All Segments", "Platinum", "Gold", "Silver"];

  return (
    <div className="space-y-6">
      {/* KPI Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">
                  Clients by Inception Date by Segmentation
                </h3>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  {inceptionData?.kpi.ytdNewClients || 0}
                </p>
                <p className="text-sm text-muted-foreground">YTD New Clients</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    +{inceptionData?.kpi.percentageChangeVsPreviousYear || 0}%
                    vs previous year
                  </span>
                </div>
              </div>
            </div>
            <div className="w-48">
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {inceptionData?.availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart and Legend */}
      <Card>
        <CardHeader>
          <CardTitle>New Clients by Segment ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chart */}
            <div className="lg:col-span-3">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inceptionData?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="Platinum"
                      stackId="a"
                      fill="hsl(222, 47%, 44%)"
                    />
                    <Bar dataKey="Gold" stackId="a" fill="hsl(216, 65%, 58%)" />
                    <Bar
                      dataKey="Silver"
                      stackId="a"
                      fill="hsl(210, 55%, 78%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {inceptionData?.chartLegend.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{
                          backgroundColor:
                            item.segment === "Platinum"
                              ? "hsl(222, 47%, 44%)"
                              : item.segment === "Gold"
                              ? "hsl(216, 65%, 58%)"
                              : item.segment === "Silver"
                              ? "hsl(210, 55%, 78%)"
                              : "#6b7280",
                        }}
                      />
                      <span className="text-sm font-medium">
                        {item.segment}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Segment Filter Buttons */}
          <div className="flex space-x-2 mt-6">
            {segmentButtons.map((segment) => (
              <Button
                key={segment}
                variant={
                  selectedSegmentFilter === segment ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedSegmentFilter(segment)}
              >
                {segment}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Client Inception Year
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {inceptionData
                ? `${inceptionData.totalTableRecords} records`
                : "Loading..."}{" "}
              • {selectedSegmentFilter} - {selectedYear}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Loading client data...
            </div>
          )}
          {!isLoading &&
            inceptionData &&
            inceptionData.tableClients.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No clients match the current filters.
              </div>
            )}
          {!isLoading &&
            inceptionData &&
            inceptionData.tableClients.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Inception Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inceptionData.tableClients.map((client) => {
                      const gradeClasses = getGradeBadgeClasses(client.segment);

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {client.email}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md ${gradeClasses.badgeBg} ${gradeClasses.badgeText}`}
                            >
                              {client.segment}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(client.inceptionDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="default">
                              View Client
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
