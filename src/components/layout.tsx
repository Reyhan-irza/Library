import { useState, useEffect, useRef } from "react";
import VIREON_LOGO from "@/assets/logo";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, ArrowLeftRight, Users, FolderOpen,
  Archive, UserCog, Heart, User, BarChart3, LogOut, Moon, Sun,
  Bell, X, ChevronRight, Search, ChevronDown, Library, MoreHorizontal,
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
          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer relative group transition-all duration-150",
          active
            ? "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/50"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-pill"
            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
            transition={{ type: "spring", stiffness: 380, damping: 35 }}
          />
        )}
        <Icon size={16} className={cn("flex-shrink-0 relative z-10", active ? "text-primary" : "text-sidebar-foreground/55")} />
        <span className="text-[13px] font-medium relative z-10 leading-none">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 relative z-10 shadow-sm shadow-rose-500/20">
            {item.badge}
          </span>
        ) : active ? (
          <ChevronRight size={12} className="ml-auto text-primary/70 relative z-10" />
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
      <div className="px-5 py-5 border-b border-sidebar-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-sidebar-accent/70 p-1.5 ring-1 ring-sidebar-border/40">
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

      <div className="px-3 pt-4">
        <div className="rounded-2xl border border-sidebar-border/45 bg-sidebar-accent/45 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/45">Ruang admin</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]" />
              Aktif
            </span>
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-sidebar-foreground">Kelola perpustakaan</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-sidebar-foreground/45">Koleksi, anggota, dan peminjaman dalam satu ruang.</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "pt-2" : ""}>
            {section.title && (
              <p className="px-3.5 pb-2 text-[9px] font-bold tracking-[0.18em] uppercase text-sidebar-foreground/35 select-none">
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
      <div className="border-t border-sidebar-border/40 p-3">
        <div className="flex items-center gap-2.5 px-3 py-3 rounded-2xl bg-sidebar-accent/50 ring-1 ring-sidebar-border/30">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Library size={13} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-sidebar-foreground truncate">Vireon Library</p>
            <p className="text-[10px] text-sidebar-foreground/45 truncate">{user?.name ?? "Admin"} · {user?.role ?? "Administrator"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-sidebar-foreground/40 transition-colors flex-shrink-0"
            title="Keluar"
            aria-label="Keluar dari akun"
            data-testid="button-logout-sidebar"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop + mobile Header ────────────────────────────────────────────── */
const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/books": "Koleksi Buku",
  "/members": "Anggota",
  "/borrowings": "Peminjaman",
  "/categories": "Kategori",
  "/racks": "Rak Buku",
  "/reports": "Laporan",
  "/favorites": "Favorit",
  "/staff": "Staff",
  "/profile": "Profil",
};

function Header() {
  const [location] = useLocation();
  const {
    data: notifications,
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useGetNotifications();
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
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-8 h-8 flex-shrink-0">
          <img src={VIREON_LOGO} alt="Vireon" className="w-full h-full object-contain" loading="eager" fetchPriority="high" decoding="sync" />
        </div>
        <span className="text-sm font-bold gradient-text font-heading tracking-wide">VIREON</span>
      </div>

      {/* Desktop page context */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">Workspace</span>
        <ChevronRight size={12} className="text-muted-foreground/40" />
        <span className="text-sm font-semibold text-foreground">{pageLabels[location] ?? "Vireon Library"}</span>
      </div>

      {/* Search bar (desktop stretches, mobile hidden) */}
      <div className="hidden lg:flex flex-1 max-w-md ml-3">
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
            type="button"
            onClick={() => setNotificationsOpen(open => !open)}
            className="relative p-2 rounded-xl hover:bg-accent transition-colors text-foreground/70 hover:text-foreground"
            aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            data-testid="button-notifications"
          >
            <Bell size={16} aria-hidden="true" />
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-background"
                data-testid="status-notifications-unread"
              >
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
                data-testid="dialog-notifications"
              >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Notifikasi</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Pengingat peminjaman yang perlu ditindaklanjuti
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refetchNotifications()}
                    disabled={notificationsLoading}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    aria-label="Segarkan notifikasi"
                    title="Segarkan"
                    data-testid="button-refresh-notifications"
                  >
                    <RefreshCw size={14} className={notificationsLoading ? "animate-spin" : ""} aria-hidden="true" />
                  </button>
                </div>

                <div className="max-h-[min(360px,60vh)] overflow-y-auto p-2">
                  {notificationsLoading && unread === 0 ? (
                    <div
                      className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground"
                      data-testid="status-notifications-loading"
                    >
                      <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                      Memuat notifikasi…
                    </div>
                  ) : notificationsError ? (
                    <div className="px-3 py-8 text-center" data-testid="status-notifications-error">
                      <AlertTriangle size={18} className="mx-auto mb-2 text-amber-500" aria-hidden="true" />
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
                          data-testid={`link-notification-${notification.id}`}
                        >
                          <span className={cn(
                            "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
                            isOverdue ? "bg-rose-500/12 text-rose-500" : "bg-amber-500/12 text-amber-500",
                          )}>
                            {isOverdue ? (
                              <AlertTriangle size={15} aria-hidden="true" />
                            ) : (
                              <Clock3 size={15} aria-hidden="true" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-foreground">{notification.title}</span>
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                              {notification.message}
                            </span>
                          </span>
                          <ArrowRight size={13} className="mt-1 flex-shrink-0 text-muted-foreground/60" aria-hidden="true" />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-3 py-8 text-center" data-testid="status-notifications-empty">
                      <Bell size={20} className="mx-auto mb-2 text-emerald-500/70" aria-hidden="true" />
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
                    data-testid="link-notifications-borrowings"
                  >
                    Buka semua peminjaman
                    <ArrowRight size={12} aria-hidden="true" />
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

const mobilePrimaryRoutes = ["/dashboard", "/books", "/borrowings", "/members"];

function MobileBottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const [location] = useLocation();
  const navSections = useNavSections();
  const allItems = navSections.flatMap(section => section.items);
  const primaryItems = mobilePrimaryRoutes
    .map(route => allItems.find(item => item.to === route))
    .filter((item): item is NavItem => Boolean(item));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl md:hidden"
      aria-label="Navigasi utama"
      data-testid="nav-mobile-bottom"
    >
      <div
        className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map(item => {
          const Icon = item.icon;
          const active = location === item.to || location.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
              data-testid={`link-mobile-${item.to.slice(1)}`}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
              {item.badge ? (
                <span className="absolute right-1/2 top-0 min-w-4 -translate-y-1/3 translate-x-[150%] rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-4 text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenuClick}
          className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Buka menu lainnya"
          data-testid="button-mobile-menu"
        >
          <MoreHorizontal size={17} aria-hidden="true" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}

function MobileMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.section
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-[2rem] border-t border-border/70 bg-card shadow-[0_-24px_60px_-28px_rgba(15,23,42,0.55)] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            data-testid="sheet-mobile-menu"
          >
            <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-4">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted-foreground/20" aria-hidden="true" />
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Vireon workspace</p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Menu lainnya</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Akses pengaturan dan halaman pendukung.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup menu"
                  data-testid="button-close-mobile-menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {navSections.flatMap(section => section.items).map(item => {
                  const Icon = item.icon;
                  const active = location === item.to || location.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-xs font-semibold transition-all",
                        active
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border/70 bg-background/60 text-foreground/75 hover:border-primary/25 hover:bg-primary/5 hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                      data-testid={`link-mobile-menu-${item.to.slice(1)}`}
                    >
                      <Icon size={16} className={active ? "text-primary" : "text-muted-foreground"} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-rose-500 px-1.5 text-[9px] leading-4 text-white">{item.badge}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <User size={15} className="text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{user?.name ?? "Admin"}</p>
                  <p className="mt-0.5 truncate text-[10px] capitalize text-muted-foreground">{user?.role ?? "Administrator"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Keluar dari akun"
                  data-testid="button-logout-mobile-menu"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-30">
        <Sidebar />
      </aside>

      {/* Main area */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <Header />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 p-4 pb-24 md:p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileMenuSheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
