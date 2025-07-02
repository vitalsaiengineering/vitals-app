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
import { Search, Users, Database, Mail, Phone, Calendar, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { useAdvisor } from "@/contexts/AdvisorContext";

import { formatDate } from "@/utils/dateFormatter";
import { getPrettyClientName, formatAUM } from "@/utils/client-analytics";
import { getClients } from "@/lib/clientData";
import { StandardClient } from "@/types/client";
// @ts-ignore - JavaScript utility file
import { calculateTenure } from "@/utils/clientDataUtils.js";
import { ViewContactButton } from "@/components/ui/view-contact-button";

interface Client {
  title: any;
  firstName: any;
  lastName: any;
  id: string;
  name: string;
  email: string;
  phone: string;
  advisor: string;
  aum: number;
  segment: string;
  age: number;
  tenure: number;
  inceptionDate: string;
  state: string;
  household?: string;
  wealthboxClientId?: string;
  orionClientId?: string;
}

// Define type for sort configuration
type SortConfig = {
  key: keyof Client;
  direction: 'asc' | 'desc';
};

const Clients = () => {
  const { selectedAdvisor } = useAdvisor();
  const [searchTerm, setSearchTerm] = useState("");
  const [allClientData, setAllClientData] = useState<Client[]>([]); // Store all data
  const [clientData, setClientData] = useState<Client[]>([]); // Store filtered data
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'aum',
    direction: 'desc'
  });

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        // Use centralized client data
        const clients = await getClients();

        // Transform data to match our client interface
        const transformedClients: Client[] = clients.map(
          (client: StandardClient) => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            advisor: client.advisor,
            aum: client.aum,
            segment: client.segment,
            age: client.age,
            tenure: calculateTenure(client.inceptionDate),
            inceptionDate: client.inceptionDate,
            state: client.state,
            title: client.title,
            firstName: client.firstName,
            lastName: client.lastName,
            household: client.household,
          })
        );

        setAllClientData(transformedClients);
      } catch (error) {
        console.error("Error loading clients:", error);
        setAllClientData([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Filter clients by advisor and apply to clientData
  useEffect(() => {
    let filtered = Array.isArray(allClientData) ? allClientData : [];

    // Apply advisor filter
    if (selectedAdvisor !== "All Advisors") {
      filtered = filtered.filter(
        (client) => client.advisor === selectedAdvisor
      );

      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("Clients page - Filtered by advisor:", {
          selectedAdvisor,
          beforeFilter: allClientData.length,
          afterFilter: filtered.length,
        });
      }
    }

    setClientData(filtered);
  }, [allClientData, selectedAdvisor]);

  // Function to handle column sorting
  const requestSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column header
  const getSortDirectionIcon = (columnName: keyof Client) => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" /> 
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Apply sorting and filtering to clients
  const sortedAndFilteredClients = React.useMemo(() => {
    let filteredClients = clientData.filter(
      (client) =>
        client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.advisor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.segment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredClients.sort((a, b) => {
      const key = sortConfig.key;
      
      // Handle special case for name which is a composite field
      if (key === 'name') {
        const nameA = getPrettyClientName(a).toLowerCase();
        const nameB = getPrettyClientName(b).toLowerCase();
        if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Handle special case for contact info which isn't a direct field
      if (key === 'email' || key === 'phone') {
        const valueA = (a[key] || '').toLowerCase();
        const valueB = (b[key] || '').toLowerCase();
        if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Handle numeric fields
      if (typeof a[key] === 'number' && typeof b[key] === 'number') {
        return sortConfig.direction === 'asc' 
          ? (a[key] as number) - (b[key] as number)
          : (b[key] as number) - (a[key] as number);
      }

      // Handle string fields
      const valueA = String(a[key] || '').toLowerCase();
      const valueB = String(b[key] || '').toLowerCase();
      
      if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredClients;
  }, [clientData, searchTerm, sortConfig]);

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
    if (!phone) return "";
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
        <div>
          <h1 className="text-3xl font-bold">
            {selectedAdvisor !== "All Advisors"
              ? `${selectedAdvisor}'s Clients`
              : "Clients"}
          </h1>
          {selectedAdvisor !== "All Advisors" && (
            <p className="text-muted-foreground mt-1">
              Showing clients for {selectedAdvisor}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users className="mr-2 text-muted-foreground" size={20} />
            <span className="text-muted-foreground">
              {clientData.length}{" "}
              {selectedAdvisor !== "All Advisors" ? "advisor" : "total"} clients
            </span>
          </div>
          {/* {useMock && (
            <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Sample Data
            </div>
          )} */}
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
            {sortedAndFilteredClients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">
              {sortedAndFilteredClients.length}
            </div>
            <div className="text-sm text-blue-700">
              {searchTerm ? "Filtered" : "Total"} Clients
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-900">
              {formatAUM(
                sortedAndFilteredClients.reduce((sum, client) => sum + client.aum, 0)
              )}
            </div>
            <div className="text-sm text-green-700">Total AUM</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-900">
              {Math.round(
                sortedAndFilteredClients.reduce((sum, client) => sum + client.age, 0) /
                  sortedAndFilteredClients.length
              )}
            </div>
            <div className="text-sm text-purple-700">Average Age</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-900">
              {Math.round(
                sortedAndFilteredClients.reduce(
                  (sum, client) => sum + client.tenure,
                  0
                ) / sortedAndFilteredClients.length
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
              <TableHead 
                onClick={() => requestSort('name')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Client Name {getSortDirectionIcon('name')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('email')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Contact Info {getSortDirectionIcon('email')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('advisor')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Advisor {getSortDirectionIcon('advisor')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('segment')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Segment {getSortDirectionIcon('segment')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('household')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Household {getSortDirectionIcon('household')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('aum')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Assets Under Management {getSortDirectionIcon('aum')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('age')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Client Details {getSortDirectionIcon('age')}
              </TableHead>
              <TableHead 
                onClick={() => requestSort('state')} 
                className="cursor-pointer hover:bg-muted/80"
              >
                Location {getSortDirectionIcon('state')}
              </TableHead>
              <TableHead>View Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredClients.length > 0 ? (
              sortedAndFilteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    {getPrettyClientName(client)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.email || "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        {formatPhoneNumber(client.phone) || "N/A"}
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
                      {client.segment || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-600">
                      {client.household || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatAUM(client.aum) || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">Age: {client.age || "N/A"}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {client.tenure} year{client.tenure !== 1 ? "s" : ""}{" "}
                        with firm {formatDate(client.inceptionDate) || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.state || "N/A"}</TableCell>
                  <TableCell>
                    <ViewContactButton 
                      clientId={client.id} 
                      wealthboxClientId={client.wealthboxClientId}
                      orionClientId={client.orionClientId}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
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
