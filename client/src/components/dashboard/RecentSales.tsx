
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const salesData = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    amount: "$1,249.00",
    status: "Completed"
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    amount: "$998.50",
    status: "Pending"
  },
  {
    name: "Charlie Brown",
    email: "charlie@example.com",
    amount: "$2,345.00",
    status: "Completed"
  },
  {
    name: "Diana Prince",
    email: "diana@example.com",
    amount: "$750.25",
    status: "Completed"
  },
  {
    name: "Ethan Hunt",
    email: "ethan@example.com",
    amount: "$1,840.75",
    status: "Failed"
  },
];

export const RecentSales = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {salesData.map((sale, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <div className="flex h-full items-center justify-center bg-primary text-primary-foreground font-medium">
                    {sale.name.split(" ").map(n => n[0]).join("")}
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium">{sale.name}</p>
                  <p className="text-sm text-muted-foreground">{sale.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{sale.amount}</p>
                <Badge variant={
                  sale.status === "Completed" ? "success" : 
                  sale.status === "Pending" ? "warning" : "destructive"
                }>
                  {sale.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
