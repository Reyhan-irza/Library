import { useState, useEffect, useRef } from "react";
import VIREON_LOGO from "@/assets/logo";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, ArrowLeftRight, Users, FolderOpen,
  Archive, UserCog, Heart, User, BarChart3, LogOut, Moon, Sun,
  Bell, Menu, X, ChevronRight, Search, ChevronDown, Library,
  AlertTriangle, Clock3, RefreshCw, ArrowRight,
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

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
}

function useNavSections(): NavSection[] {
  const { data: notifications } = useGetNotifications();
  const unread = (notifications ?? []).filter(n => !n.read).length;
  return [
    {
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "DATA",
      items: [
        { to: "/books",      icon: BookOpen,       label: "Buku" },
        { to: "/members",    icon: Users,           label: "Anggota" },
        { to: "/borrowings", icon: ArrowLeftRight,  label: "Peminjaman", badge: unread > 0 ? unread : undefined },
        { to: "/categories", icon: FolderOpen,      label: "Kategori" },
        { to: "/racks",      icon: Archive,         label: "Rak Buku" },
      ],
    },
    {
      title: "LAPORAN",
      items: [
        { to: "/reports",    icon: BarChart3, label: "Laporan" },
        { to: "/favorites",  icon: Heart,     label: "Favorit" },
      ],
    },
    {
      title: "PENGATURAN",
      items: [
        { to: "/staff",   icon: UserCog, label: "Staff" },
        { to: "/profile", icon: User,    label: "Profil" },
      ],
    },
  ];
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.to} onClick={onClick}>
      <motion.div
        whileHover={{ x: active ? 0 : 3 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer relative group transition-colors duration-150",
          active
            ? "text-primary-foreground"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-pill"
            className="absolute inset-0 bg-primary rounded-xl shadow-sm shadow-primary/30"
            transition={{ type: "spring", stiffness: 380, damping: 35 }}
          />
        )}
        <Icon size={16} className="flex-shrink-0 relative z-10" />
        <span className="text-[13px] font-medium relative z-10 leading-none">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 relative z-10">
            {item.badge}
          </span>
        ) : active ? (
          <ChevronRight size={12} className="ml-auto opacity-60 relative z-10" />
        ) : null}
      </motion.div>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const navSections = useNavSections();
  const logout = useLogout();
  const user = getUser();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => { window.location.href = "/"; },
    });
  }

  return (
    <div className="glass-sidebar h-full flex flex-col">
      {/* Brand header */}
      <div className="px-4 py-4 border-b border-sidebar-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex-shrink-0">
            <img src={VIREON_LOGO} alt="Vireon" className="w-full h-full object-contain" loading="eager" fetchPriority="high" decoding="sync" />
          </div>
          <div className="leading-tight">
            <p className="text-[12px] font-bold text-sidebar-foreground font-heading tracking-wide">VIREON</p>
            <p className="text-[9px] text-sidebar-foreground/45 tracking-[0.12em] uppercase">Library System</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors md:hidden">
            <X size={15} className="text-sidebar-foreground/50" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-0.5">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "pt-2" : ""}>
            {section.title && (
              <p className="px-3.5 pb-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-sidebar-foreground/35 select-none">
                {section.title}
              </p>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.to}
                item={item}
                active={location === item.to || location.startsWith(item.to + "/")}
                onClick={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom — workspace / logout */}
      <div className="border-t border-sidebar-border/40 p-2.5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/50">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Library size={13} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-sidebar-foreground truncate">Vireon Library</p>
            <p className="text-[10px] text-sidebar-foreground/45 truncate">Workspace aktif</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-sidebar-foreground/40 transition-colors flex-shrink-0"
            title="Keluar"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop + mobile Header ────────────────────────────────────────────── */
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: notifications, isLoading: notificationsLoading, isError: notificationsError, refetch: refetchNotifications } = useGetNotifications();
  const unread = (notifications ?? []).filter(n => !n.read).length;
  const { theme, toggleTheme } = useTheme();
  const user = getUser();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationsOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  return (
    <header className="h-14 sticky top-0 z-20 glass border-b border-border/40 flex items-center gap-3 px-4">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl hover:bg-accent transition-colors md:hidden flex-shrink-0"
      >
        <Menu size={18} className="text-foreground" />
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-8 h-8 flex-shrink-0">
          <img src={VIREON_LOGO} alt="Vireon" className="w-full h-full object-contain" loading="eager" fetchPriority="high" decoding="sync" />
        </div>
        <span className="text-sm font-bold gradient-text font-heading tracking-wide">VIREON</span>
      </div>

      {/* Search bar (desktop stretches, mobile hidden) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            readOnly
            placeholder="Cari buku, anggota, atau kategori..."
            className="w-full h-9 pl-9 pr-14 rounded-xl border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 cursor-pointer hover:border-primary/40 hover:bg-muted/60 transition-all duration-150 outline-none"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 font-mono bg-muted px-1.5 py-0.5 rounded-md border border-border/60">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(open => !open)}
            className="relative p-2 rounded-xl hover:bg-accent transition-colors text-foreground/70 hover:text-foreground"
            aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-background">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                role="dialog"
                aria-label="Notifikasi"
                className="absolute right-0 top-full mt-2 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Notifikasi</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Pengingat peminjaman yang perlu ditindaklanjuti
                    </p>
                  </div>
                  <button
                    onClick={() => void refetchNotifications()}
                    disabled={notificationsLoading}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    aria-label="Segarkan notifikasi"
                    title="Segarkan"
                  >
                    <RefreshCw size={14} className={notificationsLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="max-h-[min(360px,60vh)] overflow-y-auto p-2">
                  {notificationsLoading && unread === 0 ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
                      <RefreshCw size={14} className="animate-spin" />
                      Memuat notifikasi…
                    </div>
                  ) : notificationsError ? (
                    <div className="px-3 py-8 text-center">
                      <AlertTriangle size={18} className="mx-auto mb-2 text-amber-500" />
                      <p className="text-xs font-semibold text-foreground">Notifikasi belum dapat dimuat</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Coba segarkan kembali.</p>
                    </div>
                  ) : notifications?.length ? (
                    notifications.map(notification => {
                      const isOverdue = notification.type === "overdue";
                      return (
                        <Link
                          key={notification.id}
                          href="/borrowings"
                          onClick={() => setNotificationsOpen(false)}
                          className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
                        >
                          <span className={cn(
                            "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
                            isOverdue ? "bg-rose-500/12 text-rose-500" : "bg-amber-500/12 text-amber-500",
                          )}>
                            {isOverdue ? <AlertTriangle size={15} /> : <Clock3 size={15} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-foreground">{notification.title}</span>
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                              {notification.message}
                            </span>
                          </span>
                          <ArrowRight size={13} className="mt-1 flex-shrink-0 text-muted-foreground/60" />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <Bell size={20} className="mx-auto mb-2 text-emerald-500/70" />
                      <p className="text-xs font-semibold text-foreground">Tidak ada notifikasi</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Semua peminjaman masih aman.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/60 px-4 py-2.5">
                  <Link
                    href="/borrowings"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Buka semua peminjaman
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-accent transition-colors text-foreground/70 hover:text-foreground"
          title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60 mx-1 hidden md:block" />

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-default">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-primary" />
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-[12px] font-semibold text-foreground leading-tight truncate max-w-[100px]">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize leading-tight">
              {user?.role ?? "Administrator"}
            </p>
          </div>
          <ChevronDown size={12} className="text-muted-foreground hidden md:block" />
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 fixed left-0 top-0 bottom-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar drawer */}
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
              className="fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden"
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <main className="flex-1 md:ml-56 min-h-screen flex flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 p-4 md:p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
