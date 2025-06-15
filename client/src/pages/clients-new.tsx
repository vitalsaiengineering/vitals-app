import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Search, Users, Database, Mail, Phone, Calendar } from "lucide-react";
import { useMockData } from "@/contexts/MockDataContext";

// Import mock data
import {
  getAllClients,
  calculateAge,
  calculateTenure,
} from "@/utils/clientDataUtils.js";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  advisor: string;
  aum: number;
  segment: string;
  age: number;
  tenure: number;
  joinDate: string;
  state: string;
}

const Clients = () => {
  const { useMock } = useMockData();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientData, setClientData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        if (useMock) {
          // Use centralized mock data
          const mockClients = getAllClients();

          // Transform mock data to match our client interface
          const transformedClients: Client[] = mockClients.map((client) => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            advisor: client.advisor,
            aum: client.aum,
            segment: client.segment,
            age: calculateAge(client.dateOfBirth),
            tenure: calculateTenure(client.joinDate),
            joinDate: client.joinDate,
            state: client.state,
          }));

          setClientData(transformedClients);
        } else {
          // In a real app, this would be an API call
          // For now, fall back to mock data if API is not available
          try {
            // Simulate API call
            const response = await fetch("/api/clients");
            const apiData = await response.json();
            setClientData(apiData);
          } catch (apiError) {
            console.warn("API not available, falling back to mock data");
            const mockClients = getAllClients();
            const transformedClients: Client[] = mockClients.map((client) => ({
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              advisor: client.advisor,
              aum: client.aum,
              segment: client.segment,
              age: calculateAge(client.dateOfBirth),
              tenure: calculateTenure(client.joinDate),
              joinDate: client.joinDate,
              state: client.state,
            }));
            setClientData(transformedClients);
          }
        }
      } catch (error) {
        console.error("Error loading clients:", error);
        setClientData([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [useMock]);

  // Filter clients based on search term
  const filteredClients = clientData.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.advisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format currency for AUM
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get segment badge colors
  const getSegmentBadgeClass = (segment: string) => {
    switch (segment) {
      case "Platinum":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Silver":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users className="mr-2 text-muted-foreground" size={20} />
            <span className="text-muted-foreground">
              {clientData.length} total clients
            </span>
          </div>
          {useMock && (
            <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Sample Data
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search clients, advisors, or segments..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

            {/* Summary Stats */}
            {filteredClients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">
              {filteredClients.length}
            </div>
            <div className="text-sm text-blue-700">
              {searchTerm ? "Filtered" : "Total"} Clients
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(
                filteredClients.reduce((sum, client) => sum + client.aum, 0)
              )}
            </div>
            <div className="text-sm text-green-700">Total AUM</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-900">
              {Math.round(
                filteredClients.reduce((sum, client) => sum + client.age, 0) /
                  filteredClients.length
              )}
            </div>
            <div className="text-sm text-purple-700">Average Age</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-900">
              {Math.round(
                filteredClients.reduce(
                  (sum, client) => sum + client.tenure,
                  0
                ) / filteredClients.length
              )}
            </div>
            <div className="text-sm text-orange-700">
              Average Tenure (Years)
            </div>
          </div>
        </div>
      )}

      {/* Client Table */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Advisor</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Assets Under Management</TableHead>
              <TableHead>Client Details</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        {formatPhoneNumber(client.phone)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.advisor}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getSegmentBadgeClass(
                        client.segment
                      )}`}
                    >
                      {client.segment}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(client.aum)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">Age: {client.age}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {client.tenure} year{client.tenure !== 1 ? "s" : ""}{" "}
                        with firm
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.state}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchTerm
                    ? `No clients found matching "${searchTerm}".`
                    : "No clients found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>


    </div>
  );
};

export default Clients;
