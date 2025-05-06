import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard-new";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Integrations from "@/pages/integrations";
import Mapping from "@/pages/mapping";
import Clients from "@/pages/clients-new";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import Reporting from "@/pages/reporting";
import Valuation from "@/pages/valuation";
import Users from "@/pages/admin/users";
import Organizations from "@/pages/admin/organizations";
import { AppLayout } from "@/components/layout/app-layout";
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
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      
      <Route path="/clients">
        <AppLayout>
          <Clients />
        </AppLayout>
      </Route>
      
      <Route path="/integrations">
        <AppLayout>
          <Integrations />
        </AppLayout>
      </Route>
      
      <Route path="/mapping">
        <AppLayout>
          <Mapping />
        </AppLayout>
      </Route>
      
      <Route path="/admin/users">
        <AppLayout>
          <Users />
        </AppLayout>
      </Route>
      
      <Route path="/admin/organizations">
        <AppLayout>
          <Organizations />
        </AppLayout>
      </Route>
      
      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>
      
      <Route path="/profile">
        <AppLayout>
          <Profile />
        </AppLayout>
      </Route>

      <Route path="/reporting">
        <AppLayout>
          <Reporting />
        </AppLayout>
      </Route>
      
      <Route path="/valuation">
        <AppLayout>
          <Valuation />
        </AppLayout>
      </Route>
      
      <Route>
        <AppLayout>
          <NotFound />
        </AppLayout>
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
