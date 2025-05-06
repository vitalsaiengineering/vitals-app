
import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";

const Messages = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <p className="text-muted-foreground mb-8">This is a placeholder for the messages page.</p>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
