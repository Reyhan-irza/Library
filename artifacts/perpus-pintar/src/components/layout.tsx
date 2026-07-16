import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, ArrowLeftRight, Users, FolderOpen,
  Archive, UserCog, Heart, User, BarChart3, LogOut, Moon, Sun,
  Bell, Menu, X, ChevronRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useGetNotifications, useLogout } from "@/hooks/api";
import { getUser } from "@/lib/auth";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface LayoutProps {
  children: React.ReactNode;
}

function useNavItems(): NavItem[] {
  const { data: notifications } = useGetNotifications();
  const unread = (notifications ?? []).filter(n => !n.read).length;
  return [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/books", icon: BookOpen, label: "Koleksi Buku" },
    { to: "/borrowings", icon: ArrowLeftRight, label: "Peminjaman", badge: unread > 0 ? unread : undefined },
    { to: "/members", icon: Users, label: "Anggota" },
    { to: "/categories", icon: FolderOpen, label: "Kategori" },
    { to: "/racks", icon: Archive, label: "Rak Buku" },
    { to: "/staff", icon: UserCog, label: "Staff" },
    { to: "/favorites", icon: Heart, label: "Favorit" },
    { to: "/profile", icon: User, label: "Profil" },
    { to: "/reports", icon: BarChart3, label: "Laporan" },
  ];
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.to} onClick={onClick}>
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer relative group transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <Icon size={17} className="flex-shrink-0" />
        <span className="text-sm font-medium">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {item.badge}
          </span>
        ) : active ? (
          <ChevronRight size={13} className="ml-auto opacity-70" />
        ) : null}
      </motion.div>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const navItems = useNavItems();
  const logout = useLogout();
  const user = getUser();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => { window.location.href = "/"; },
    });
  }

  return (
    <div className="glass-sidebar h-full flex flex-col">
      <div className="p-5 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <BookOpen size={16} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-sidebar-foreground leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              Perpustakaan
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">SMKN 2 Lubuk Basung</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors md:hidden">
              <X size={16} className="text-sidebar-foreground/60" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {navItems.map(item => (
          <NavLink key={item.to} item={item} active={location === item.to || location.startsWith(item.to + "/")} onClick={onClose} />
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border/50 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          <span className="text-sm font-medium">{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-sidebar-accent/50">
          <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center">
            <User size={13} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name ?? "Pengguna"}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{user?.role ?? "librarian"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-sidebar-foreground/50 transition-colors"
            aria-label="Keluar"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 fixed left-0 top-0 bottom-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 md:hidden"
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden sticky top-0 z-20 glass flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <Menu size={18} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen size={13} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-bold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>
              Perpustakaan
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
