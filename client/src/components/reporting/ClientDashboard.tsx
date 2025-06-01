import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import ClientAnniversaryView from './ClientAnniversaryView';
import ClientInceptionView from './ClientInceptionView';

export default function ClientDashboard() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('anniversaries');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Client Dashboard</CardTitle>
              <p className="text-muted-foreground mt-2">
                Track client acquisition and segmentation metrics.
              </p>
            </div>
            <div className="w-80">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="anniversaries">Anniversaries</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="anniversaries" className="space-y-6">
          <ClientAnniversaryView globalSearch={globalSearch} />
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-6">
          <ClientInceptionView globalSearch={globalSearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}