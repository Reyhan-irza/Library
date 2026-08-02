import { useEffect, useState } from "react";
import { Route, Switch, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import AnimatedBackground from "@/components/animated-bg";
import Layout from "@/components/layout";
import { isAuthenticated, initAuth, getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import BooksPage from "@/pages/books";
import BorrowingsPage from "@/pages/borrowings";
import MembersPage from "@/pages/members";
import CategoriesPage from "@/pages/categories";
import RacksPage from "@/pages/racks";
import StaffPage from "@/pages/staff";
import FavoritesPage from "@/pages/favorites";
import ProfilePage from "@/pages/profile";
import ReportsPage from "@/pages/reports";
import NotFoundPage from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={LandingPage} />

      {/* Login moved to /login */}
      <Route path="/login" component={LoginPage} />

      {/* Protected routes */}
      <Route path="/dashboard">
        {() => <PrivateRoute component={DashboardPage} />}
      </Route>
      <Route path="/books">
        {() => <PrivateRoute component={BooksPage} />}
      </Route>
      <Route path="/borrowings">
        {() => <PrivateRoute component={BorrowingsPage} />}
      </Route>
      <Route path="/members">
        {() => <PrivateRoute component={MembersPage} />}
      </Route>
      <Route path="/categories">
        {() => <PrivateRoute component={CategoriesPage} />}
      </Route>
      <Route path="/racks">
        {() => <PrivateRoute component={RacksPage} />}
      </Route>
      <Route path="/staff">
        {() => <PrivateRoute component={StaffPage} />}
      </Route>
      <Route path="/favorites">
        {() => <PrivateRoute component={FavoritesPage} />}
      </Route>
      <Route path="/profile">
        {() => <PrivateRoute component={ProfilePage} />}
      </Route>
      <Route path="/reports">
        {() => <PrivateRoute component={ReportsPage} />}
      </Route>
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sync Supabase session → localStorage on mount
    initAuth().finally(() => setReady(true));

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        import("@/lib/auth").then(({ clearUser }) => clearUser());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // If user is authenticated and visits root, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isAuthenticated()) {
        const path = window.location.pathname;
        if (path === "/") {
          window.history.replaceState(null, "", "/dashboard");
        }
      }
    }
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AnimatedBackground />
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
