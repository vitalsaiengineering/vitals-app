
import React from "react";
import { SidebarProvider, SidebarTrigger, SidebarRail, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar as AppSidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  onToggleView?: (view: string) => void;
}

export const DashboardLayout = ({ children, onToggleView }: LayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarRail />
        <SidebarInset>
          <div className="flex-1 flex flex-col overflow-auto">
            <Header onToggleView={onToggleView}>
              <SidebarTrigger className="mr-2" />
            </Header>
            <main className="flex-1 bg-slate-50 p-6 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
