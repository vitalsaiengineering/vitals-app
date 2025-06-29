import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Client, getClientsInAgeGroup } from "@/lib/data";
import { getPrettyClientName } from "@/utils/client-analytics";

interface ClientsTableProps {
  className?: string;
  selectedGroup: string | null;
}

const ClientsTable: React.FC<ClientsTableProps> = ({
  className,
  selectedGroup,
}) => {
  const clients = selectedGroup ? getClientsInAgeGroup(selectedGroup) : [];

  const getAgeColor = (age: number) => {
    if (age <= 20) return "text-ageBand-1";
    if (age <= 40) return "text-ageBand-2";
    if (age <= 60) return "text-ageBand-3";
    if (age <= 80) return "text-ageBand-4";
    return "text-ageBand-5";
  };

  return (
    <Card
      className={`h-full overflow-hidden animate-fade-in-up delay-200 ${className}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {selectedGroup
            ? `Clients (${selectedGroup})`
            : "Select an age group to view clients"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {selectedGroup ? (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Inception Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="animate-fade-in">
                    <TableCell className="font-medium">{getPrettyClientName(client)}</TableCell>
                    <TableCell
                      className={`font-medium ${getAgeColor(client.age)}`}
                    >
                      {client.age}
                    </TableCell>
                    <TableCell>{client.inceptionDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Select an age group from the chart to view clients
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientsTable;
