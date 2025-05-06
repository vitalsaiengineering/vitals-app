
import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Network, Plug, Building } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user-management");

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs 
          defaultValue="user-management" 
          className="space-y-6"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-4 gap-4 w-full">
            <TabsTrigger value="user-management" className="flex items-center gap-2">
              <UserCog size={18} />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="data-mapping" className="flex items-center gap-2">
              <Network size={18} />
              <span>Data Mapping</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug size={18} />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="firm-information" className="flex items-center gap-2">
              <Building size={18} />
              <span>Firm Information</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management Content */}
          <TabsContent value="user-management">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users, permissions, and roles for your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-[600px] border rounded-md overflow-hidden">
                  <iframe 
                    src="https://preview--lovable-user-vault.lovable.app/" 
                    title="User Management Portal"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Mapping Content */}
          <TabsContent value="data-mapping">
            <Card>
              <CardHeader>
                <CardTitle>Data Mapping</CardTitle>
                <CardDescription>
                  Configure data sources and field mappings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Connect and map data from various sources to standardized fields within the system.
                </p>
                <div className="bg-secondary/30 p-8 rounded-md text-center">
                  Data mapping configuration will be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Content */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect third-party services and tools to your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Set up and manage integrations with CRM systems, financial platforms, and other tools.
                </p>
                <div className="bg-secondary/30 p-8 rounded-md text-center">
                  Integration settings will be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Firm Information Content */}
          <TabsContent value="firm-information">
            <Card>
              <CardHeader>
                <CardTitle>Firm Information</CardTitle>
                <CardDescription>
                  Manage your firm's profile and business details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Update company information, branding elements, and contact details.
                </p>
                <div className="bg-secondary/30 p-8 rounded-md text-center">
                  Firm information settings will be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
