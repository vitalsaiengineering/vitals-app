
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Settings from "./pages/Settings";
import WealthboxSettings from "./pages/integrations/WealthboxSettings";
import OrionSettings from "./pages/integrations/OrionSettings";
import VitalsSettings from "./pages/integrations/VitalsSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/settings" replace />} />
          <Route element={<MainLayout />}>
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/wealthbox" element={<WealthboxSettings />} />
            <Route path="/settings/orion" element={<OrionSettings />} />
            <Route path="/settings/vitals" element={<VitalsSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
