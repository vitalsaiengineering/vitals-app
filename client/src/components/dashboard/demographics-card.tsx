import React, { useState } from "react";
// import AgeMetric from "@/components/dashboard/AgeMetric";
import AgeChart from "@/components/dashboard/AgeChart";
import ClientsTable from "@/components/dashboard/ClientsTable";
import { getAgeGroups } from "@/lib/clientData";

const Index = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const ageGroups = getAgeGroups(); // Static demo data for now
  const totalClients = ageGroups.reduce((acc, group) => acc + group.count, 0);

  const handleGroupSelect = (groupName: string) => {
    // If the same group is clicked again, toggle it off
    setSelectedGroup((prevSelected) =>
      prevSelected === groupName ? null : groupName,
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 relative">
          {/* Header */}
          <div className="space-y-2 text-center animate-fade-in">
            <h1 className="text-3xl font-semibold tracking-tight">
              Client Age Demographics
            </h1>
            <p className="text-muted-foreground">
              Total Clients: <span className="font-medium">{totalClients}</span>
            </p>
          </div>

          {/* Main content */}
          <div className="grid gap-6">
            {/* Top row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* <AgeMetric className="md:col-span-1" /> */}
              <AgeChart
                className="md:col-span-2"
                onGroupSelect={handleGroupSelect}
                selectedGroup={selectedGroup}
              />
            </div>

            {/* Bottom row */}
            <ClientsTable selectedGroup={selectedGroup} />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-2">
            {ageGroups.map((group, index) => (
              <div
                key={group.name}
                className={`smooth-transition glass-effect rounded-lg p-4 cursor-pointer ${
                  selectedGroup === group.name ? "ring-2 ring-primary" : ""
                } animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleGroupSelect(group.name)}
              >
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${group.colorClass} mr-2`}
                  ></div>
                  <h3 className="font-medium">{group.name}</h3>
                </div>
                <p className="text-2xl font-bold">{group.count}</p>
                <p className="text-sm text-muted-foreground">
                  {group.percentage.toFixed(1)}% of clients
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
