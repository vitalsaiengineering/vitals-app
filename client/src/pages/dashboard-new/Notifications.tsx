
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface MonthlyAlert {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "success" | "warning" | "info" | "destructive" | "default";
  icon: React.ElementType;
  read: boolean;
}

const Notifications = () => {
  const [alerts, setAlerts] = useState<MonthlyAlert[]>([]);
  const [filter, setFilter] = useState<string>("all");
  
  useEffect(() => {
    // In a real app, this would fetch from an API
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const mockAlerts: MonthlyAlert[] = [
      {
        id: "1",
        title: `New Clients Added`,
        description: `You added 5 new clients this ${currentMonth}. This is a 12% increase from last month.`,
        date: `${currentMonth} 30, 2024`,
        type: "success",
        icon: Users,
        read: false
      },
      {
        id: "2",
        title: `Average Account Size Dropped`,
        description: `Your average account size dropped $50,000 this ${currentMonth}. Consider reviewing your client acquisition strategy.`,
        date: `${currentMonth} 29, 2024`,
        type: "warning",
        icon: TrendingDown,
        read: false
      },
      {
        id: "3",
        title: `Revenue Growth`,
        description: `Your revenue is up $100,000 this quarter. Great job! Continue focusing on high-value clients.`,
        date: `${currentMonth} 28, 2024`, 
        type: "success",
        icon: DollarSign,
        read: true
      },
      {
        id: "4",
        title: `Client Segmentation Report`,
        description: `Your Platinum client segment grew by 8% this ${currentMonth}. This is ahead of your quarterly goal.`,
        date: `${currentMonth} 25, 2024`,
        type: "info",
        icon: Users,
        read: true
      },
      {
        id: "5",
        title: `AUM Milestone`,
        description: `Congratulations! Your AUM has crossed $25M for the first time this ${currentMonth}.`,
        date: `${currentMonth} 22, 2024`,
        type: "success",
        icon: TrendingUp,
        read: true
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
    toast({
      title: "All notifications marked as read",
      description: "You've caught up on all your notifications."
    });
  };
  
  const refreshAlerts = () => {
    toast({
      title: "Refreshing notifications",
      description: "Checking for new updates..."
    });
    // In a real app, this would trigger a new fetch
    // For demo purposes, we'll just show a success message
    setTimeout(() => {
      toast({
        title: "Notifications refreshed",
        description: "You're all caught up!"
      });
    }, 1500);
  };

  const filteredAlerts = filter === "all" 
    ? alerts 
    : filter === "unread" 
      ? alerts.filter(alert => !alert.read) 
      : alerts.filter(alert => alert.type === filter);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="success">Positive Updates</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Information</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={markAllAsRead}>Mark All Read</Button>
            <Button variant="outline" onClick={refreshAlerts}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <Alert 
                    key={alert.id} 
                    variant={alert.type}
                    className={`${!alert.read ? 'border-l-4' : ''} transition-all duration-200`}
                  >
                    <alert.icon className="h-4 w-4" />
                    <AlertTitle className="flex justify-between">
                      {alert.title}
                      <span className="text-xs text-muted-foreground font-normal">{alert.date}</span>
                    </AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </Alert>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No notifications match your filter.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
