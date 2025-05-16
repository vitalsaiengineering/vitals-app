
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Client {
  name: string;
  grade: 'Gold' | 'Platinum' | 'Silver';
  dateOfBirth: string;
  nextBirthday: string;
  daysUntilBirthday: number;
  turningAge: number;
  aum: number;
  tenure: number;
  advisor: string;
}

const mockClients: Client[] = [
  {
    name: "Sarah Johnson",
    grade: "Gold",
    dateOfBirth: "May 21, 1972",
    nextBirthday: "May 21",
    daysUntilBirthday: 6,
    turningAge: 53,
    aum: 950000,
    tenure: 8,
    advisor: "Michael Rodriguez"
  },
  // Add more mock data as needed
];

const BirthDayWealth: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [selectedMonth, setSelectedMonth] = useState("Any month");
  const [selectedTenure, setSelectedTenure] = useState("Any tenure");
  const [selectedAdvisor, setSelectedAdvisor] = useState("All Advisors");

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'Platinum':
        return 'bg-blue-500 text-white';
      case 'Gold':
        return 'bg-yellow-500 text-white';
      case 'Silver':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedGrade("All Grades");
    setSelectedMonth("Any month");
    setSelectedTenure("Any tenure");
    setSelectedAdvisor("All Advisors");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Client Birthday Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        View your clients' upcoming birthdays in a sortable table format. Filter by client details to find the information you need.
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Clients</h2>
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Grades">All Grades</SelectItem>
              <SelectItem value="Platinum">Platinum</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Any month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any month">Any month</SelectItem>
              {/* Add months */}
            </SelectContent>
          </Select>
          <Select value={selectedTenure} onValueChange={setSelectedTenure}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Any tenure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any tenure">Any tenure</SelectItem>
              {/* Add tenure options */}
            </SelectContent>
          </Select>
          <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Advisors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Advisors">All Advisors</SelectItem>
              {/* Add advisors */}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Next Birthday</TableHead>
            <TableHead>Turning Age</TableHead>
            <TableHead>AUM</TableHead>
            <TableHead>Client Tenure</TableHead>
            <TableHead>Advisor</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockClients.map((client) => (
            <TableRow key={client.name}>
              <TableCell>{client.name}</TableCell>
              <TableCell>
                <Badge className={getGradeBadgeColor(client.grade)}>
                  {client.grade}
                </Badge>
              </TableCell>
              <TableCell>{client.dateOfBirth}</TableCell>
              <TableCell>
                <div>
                  {`In ${client.daysUntilBirthday} days`}
                  <div className="text-sm text-muted-foreground">{client.nextBirthday}</div>
                </div>
              </TableCell>
              <TableCell>{client.turningAge}</TableCell>
              <TableCell>{formatCurrency(client.aum)}</TableCell>
              <TableCell>{`${client.tenure} years`}</TableCell>
              <TableCell>{client.advisor}</TableCell>
              <TableCell>
                <Button variant="link" className="text-blue-500">
                  View Contact
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BirthDayWealth;
