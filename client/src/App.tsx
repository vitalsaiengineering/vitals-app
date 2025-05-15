import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Clients from "@/pages/clients-new";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import Reporting from "@/pages/reporting";
import ReportViewPage from "@/pages/report-view-page";
import Valuation from "@/pages/valuation";
import Users from "@/pages/admin/users";
import Organizations from "@/pages/admin/organizations";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import axios from "axios";
// REMOVE: import { useNavigate } from "react-router-dom";

// setupGlobalErrorHandler();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, navigate] = useLocation(); // Get navigate from wouter's useLocation

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        await axios.get('/api/me');
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Show loading until we know authentication status
  if (isAuthenticated === null) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  // If authenticated, render the protected content
  return isAuthenticated ? <>{children}</> : null;
};

// Root redirect component
const RootRedirect = () => {
  const [, navigate] = useLocation(); // Get navigate from wouter's useLocation
  
  useEffect(() => {
    // Check if user is authenticated and redirect accordingly
    const checkAuth = async () => {
      try {
        await axios.get('/api/me');
        navigate('/dashboard');
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);
  
  return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
};

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>

      <Route path="/signup">
        <Signup />
      </Route>
      
      <Route path="/">
        <RootRedirect />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients">
        <ProtectedRoute>
          <DashboardLayout>
            <Clients />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/users">
        <ProtectedRoute>
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/organizations">
        <ProtectedRoute>
          <DashboardLayout>
            <Organizations />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/reporting">
        <ProtectedRoute>
          <DashboardLayout>
            <Reporting />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/reporting/:reportId">
        <ProtectedRoute>
          <DashboardLayout>
            <ReportViewPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/valuation">
        <ProtectedRoute>
          <DashboardLayout>
            <Valuation />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route>
        <ProtectedRoute>
          <DashboardLayout>
            <NotFound />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Router component from wouter does not need to be explicitly rendered here if Switch is used directly */}
      {/* However, if you had a <Router> component from wouter wrapping <Switch>, that would be fine */}
      <Router /> 
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
