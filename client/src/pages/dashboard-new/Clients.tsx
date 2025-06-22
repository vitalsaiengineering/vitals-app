import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Search, Users, Database } from "lucide-react";

// Sample client data - in a real app, this would come from an API or database
const clientData = [
  {
    id: 1,
    name: "Johnson Family Trust",
    advisor: "Sarah Miller",
    aum: 2500000,
    integrations: ["CRM", "Financial Planning"]
  },
  {
    id: 2,
    name: "Robert Smith Investments",
    advisor: "Michael Chen",
    aum: 1800000,
    integrations: ["CRM"]
  },
  {
    id: 3,
    name: "Garcia Retirement Fund",
    advisor: "James Wilson",
    aum: 3200000,
    integrations: ["Financial Planning", "Tax Software"]
  },
  {
    id: 4,
    name: "Thompson LLC",
    advisor: "Emily Davis",
    aum: 5500000,
    integrations: ["CRM", "Tax Software", "Portfolio Management"]
  },
  {
    id: 5,
    name: "Martinez Investment Group",
    advisor: "Sarah Miller",
    aum: 2800000,
    integrations: ["Financial Planning"]
  },
  {
    id: 6,
    name: "Wilson Family Office",
    advisor: "James Wilson",
    aum: 8200000,
    integrations: ["CRM", "Financial Planning", "Tax Software"]
  },
  {
    id: 7,
    name: "Chang International Holdings",
    advisor: "Michael Chen",
    aum: 12500000,
    integrations: ["Portfolio Management", "CRM"]
  },
  {
    id: 8,
    name: "Brown Retirement Trust",
    advisor: "Emily Davis",
    aum: 1750000,
    integrations: ["Financial Planning"]
  },
  {
    id: 9,
    name: "Patel Investments",
    advisor: "James Wilson",
    aum: 4300000,
    integrations: ["Tax Software", "CRM"]
  },
  {
    id: 10,
    name: "Washington Asset Management",
    advisor: "Sarah Miller",
    aum: 6700000,
    integrations: ["CRM", "Financial Planning", "Portfolio Management"]
  }
];

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter clients based on search term
  const filteredClients = clientData.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.advisor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format currency for AUM
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div className="flex items-center">
          <Users className="mr-2 text-muted-foreground" size={20} />
          <span className="text-muted-foreground">{clientData.length} total clients</span>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search clients or advisors..." 
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Client Table */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Advisor</TableHead>
              <TableHead>Assets Under Management</TableHead>
              <TableHead>Integrations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.advisor}</TableCell>
                  <TableCell>{formatCurrency(client.aum)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.integrations.map((integration, idx) => (
                        <span 
                          key={idx} 
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center"
                        >
                          <Database className="h-3 w-3 mr-1" />
                          {integration}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No clients found.
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
