import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Integrations from "@/pages/integrations";
import Mapping from "@/pages/mapping";
import Clients from "@/pages/clients";
import Users from "@/pages/admin/users";
import Organizations from "@/pages/admin/organizations";
import { AppLayout } from "@/components/layout/app-layout";

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
