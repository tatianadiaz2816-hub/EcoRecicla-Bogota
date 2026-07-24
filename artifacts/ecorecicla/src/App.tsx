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

import { ProtectedRoute } from '@/components/protected-route';
import { Layout } from '@/components/layout';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute>
          <Layout>
            <Users />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/complexes">
        <ProtectedRoute>
          <Layout>
            <Complexes />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/materials">
        <ProtectedRoute>
          <Layout>
            <Materials />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/events">
        <ProtectedRoute>
          <Layout>
            <Events />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/records">
        <ProtectedRoute>
          <Layout>
            <Records />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      </Route>

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
