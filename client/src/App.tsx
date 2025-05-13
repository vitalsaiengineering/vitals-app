import { Switch, Route } from "wouter";
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
import Valuation from "@/pages/valuation";
import Users from "@/pages/admin/users";
import Organizations from "@/pages/admin/organizations";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { setupGlobalErrorHandler } from "@/utils/global-error-handler";

// setupGlobalErrorHandler();

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
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/clients">
        <DashboardLayout>
          <Clients />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/users">
        <DashboardLayout>
          <Users />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/organizations">
        <DashboardLayout>
          <Organizations />
        </DashboardLayout>
      </Route>
      
      <Route path="/settings">
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>
      
      <Route path="/profile">
        <DashboardLayout>
          <Profile />
        </DashboardLayout>
      </Route>

      <Route path="/reporting">
        <DashboardLayout>
          <Reporting />
        </DashboardLayout>
      </Route>
      
      <Route path="/valuation">
        <DashboardLayout>
          <Valuation />
        </DashboardLayout>
      </Route>
      
      <Route path="/calendar">
        <DashboardLayout>
          <NotFound />
        </DashboardLayout>
      </Route>
      
      <Route path="/messages">
        <DashboardLayout>
          <NotFound />
        </DashboardLayout>
      </Route>
      
      <Route path="/notifications">
        <DashboardLayout>
          <NotFound />
        </DashboardLayout>
      </Route>
      
      <Route>
        <DashboardLayout>
          <NotFound />
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
