import { useEffect, useState } from "react";
import { Route, Switch, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import AnimatedBackground from "@/components/animated-bg";
import Layout from "@/components/layout";
import { isAuthenticated, initAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import VIREON_LOGO from "@/assets/logo";

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

// ── Route guards ─────────────────────────────────────────────────────────────

/**
 * PrivateRoute: redirects to /login when not authenticated.
 * Wraps the component in the shared Layout (sidebar + bottom nav).
 */
function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

/**
 * PublicRoute: redirects to /dashboard when already authenticated.
 * Used for /login and / so authenticated users are never shown the
 * public-facing pages — eliminates any "flash of login page".
 */
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  if (isAuthenticated()) return <Redirect to="/dashboard" />;
  return <Component />;
}

// ── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Switch>
      {/* Public landing page — bypass if authenticated */}
      <Route path="/">
        {() => <PublicRoute component={LandingPage} />}
      </Route>

      {/* Login — bypass if already authenticated */}
      <Route path="/login">
        {() => <PublicRoute component={LoginPage} />}
      </Route>

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

// ── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sync Supabase session → localStorage, then mark as ready.
    // Nothing renders until this resolves — eliminates auth flicker.
    initAuth().finally(() => setReady(true));

    // Also react to live auth state changes (e.g. token expiry, signOut)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: unknown) => {
        if (!session) {
          import("@/lib/auth").then(({ clearUser }) => clearUser());
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Branded loading screen ────────────────────────────────────────────────
  if (!ready) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white z-50"
        role="status"
        aria-label="Memuat aplikasi"
      >
        <div className="flex flex-col items-center gap-5">
          {/* Logo mark */}
          <div className="w-14 h-14 shrink-0">
            <img
              src={VIREON_LOGO}
              alt="VIREON"
              className="w-full h-full object-contain"
              loading="eager"
              decoding="sync"
            />
          </div>

          {/* Wordmark */}
          <div className="text-center space-y-0.5">
            <p className="text-[15px] font-bold text-slate-900 tracking-[0.06em]">
              VIREON
            </p>
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "hsl(161 10% 55%)" }}
            >
              Library System
            </p>
          </div>

          {/* Loading indicator — three staggered dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 0.18, 0.36].map((delay, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  background: "hsl(161 52% 40%)",
                  animationDelay: `${delay}s`,
                  animationDuration: "1.3s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Full application ──────────────────────────────────────────────────────
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
