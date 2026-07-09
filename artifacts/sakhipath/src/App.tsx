import React, { Suspense, lazy } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Lazy load pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Resume = lazy(() => import('./pages/Resume'));
const Learning = lazy(() => import('./pages/Learning'));
const Scholarships = lazy(() => import('./pages/Scholarships'));
const Mentors = lazy(() => import('./pages/Mentors'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading your path...</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-6xl font-serif font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Path Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The journey you're looking for seems to have moved or doesn't exist. Let's get you back on track.
      </p>
      <a href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
        Return to Home
      </a>
    </div>
  );
}

function ProtectedApp() {
  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/chat" component={Chat} />
          <Route path="/resume" component={Resume} />
          <Route path="/learning" component={Learning} />
          <Route path="/scholarships" component={Scholarships} />
          <Route path="/mentors" component={Mentors} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/">
        <Suspense fallback={<LoadingScreen />}><Landing /></Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<LoadingScreen />}><Login /></Suspense>
      </Route>
      <Route path="/register">
        <Suspense fallback={<LoadingScreen />}><Register /></Suspense>
      </Route>

      {/* Protected Routes (wrapped in Layout) */}
      <Route path="/dashboard">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/chat">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/resume">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/learning">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/scholarships">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/mentors">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><ProtectedApp /></ProtectedRoute>
      </Route>
      
      {/* Catch-all 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sakhipath-ui-theme">
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
