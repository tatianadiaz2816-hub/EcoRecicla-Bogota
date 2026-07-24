import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Users from '@/pages/users';
import Complexes from '@/pages/complexes';
import Materials from '@/pages/materials';
import Events from '@/pages/events';
import Records from '@/pages/records';
import Reports from '@/pages/reports';
import Profile from '@/pages/profile';
import Settings from '@/pages/settings';
import AuditLog from '@/pages/audit-log';

import { ProtectedRoute } from '@/components/protected-route';
import { Layout } from '@/components/layout';

const queryClient = new QueryClient();

function LayoutRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Component />
      </Layout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">           <LayoutRoute component={Dashboard} /></Route>
      <Route path="/dashboard">  <LayoutRoute component={Dashboard} /></Route>
      <Route path="/users">      <LayoutRoute component={Users} /></Route>
      <Route path="/complexes">  <LayoutRoute component={Complexes} /></Route>
      <Route path="/materials">  <LayoutRoute component={Materials} /></Route>
      <Route path="/events">     <LayoutRoute component={Events} /></Route>
      <Route path="/records">    <LayoutRoute component={Records} /></Route>
      <Route path="/reports">    <LayoutRoute component={Reports} /></Route>
      <Route path="/profile">    <LayoutRoute component={Profile} /></Route>
      <Route path="/settings">   <LayoutRoute component={Settings} /></Route>
      <Route path="/audit-log">  <LayoutRoute component={AuditLog} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
