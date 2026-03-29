import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderKanban, FileText, MessageSquare,
  User, Star, Search, Plus, Bell, LogOut, Users, Folder,
  Menu, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function DashboardLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user, isAuthenticated, currentRole,
    unreadNotifications, notifications,
    markAllNotificationsRead, logout,
  } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated]);

  // Sidebar state:
  // - mobile: hidden by default, slides in as overlay when mobileOpen=true
  // - desktop: expanded by default, can collapse to icon-only (collapsed=true)
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);

  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const isClient   = currentRole === "client";

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))     setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  }

  const clientNav = [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard",       href: "/dashboard/client" },
        { icon: Plus,            label: "Post Project",     href: "/post-project" },
        { icon: Users,           label: "Find Freelancers", href: "/freelancers" },
        { icon: FolderKanban,    label: "My Contracts",     href: "/tracking" },
        { icon: Folder,          label: "Contract Files",   href: "/contract-files" },
        { icon: FileText,        label: "Received Bids",    href: "/bids" },
        { icon: MessageSquare,   label: "Messages",         href: "/messages" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: User,  label: "My Profile",    href: "/profile" },
        { icon: Star,  label: "Reviews",       href: "/reviews" },
        { icon: Bell,  label: "Notifications", href: "/notifications", badge: unreadNotifications },
      ],
    },
  ];

  const freelancerNav = [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard/freelancer" },
        { icon: Search,          label: "Browse Projects", href: "/projects" },
        { icon: FileText,        label: "My Bids",         href: "/bids" },
        { icon: FolderKanban,    label: "My Contracts",    href: "/tracking" },
        { icon: Folder,          label: "Contract Files",  href: "/contract-files" },
        { icon: MessageSquare,   label: "Messages",        href: "/messages" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: User, label: "My Profile",    href: "/profile" },
        { icon: Star, label: "Reviews",       href: "/reviews" },
        { icon: Bell, label: "Notifications", href: "/notifications", badge: unreadNotifications },
      ],
    },
  ];

  const navGroups = isClient ? clientNav : freelancerNav;

  // ── Sidebar inner content (shared between mobile overlay + desktop) ─────────
  const SidebarContent = ({ showLabels }) => (
    <>
      {/* Logo */}
      <div className={cn(
        "border-b border-border flex items-center flex-shrink-0",
        showLabels ? "p-5 gap-3" : "p-4 justify-center"
      )}>
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-display font-extrabold text-[13px] text-white flex-shrink-0">
          TF
        </div>
        {showLabels && (
          <span className="font-display font-bold text-base tracking-tight">TalentFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {showLabels && (
              <div className="text-[10px] font-semibold text-ink-4 uppercase tracking-wider px-2 mb-1">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={!showLabels ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-[13px] transition-all relative group",
                    showLabels ? "gap-2.5 px-2.5 py-2" : "justify-center px-2 py-2.5",
                    active
                      ? "bg-primary-bg text-primary-dark font-semibold"
                      : "text-ink-2 hover:bg-background hover:text-ink"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {showLabels && <span className="truncate">{item.label}</span>}
                  {showLabels && item.badge > 0 && (
                    <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                  {!showLabels && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary border border-surface" />
                  )}
                  {/* Tooltip for collapsed desktop */}
                  {!showLabels && (
                    <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap bg-ink text-white text-[11px] font-medium rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User info */}
      {showLabels && (
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-[10px] font-bold text-primary-darker flex-shrink-0">
              {user?.initials ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-ink truncate">{user?.name ?? "—"}</div>
              <div className="text-[10px] text-ink-4 capitalize">{currentRole}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-ink">

      {/* ── Mobile overlay backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile sidebar (slide-in overlay) ──────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border w-[240px] transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-background transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>

        <SidebarContent showLabels={true} />
      </aside>

      {/* ── Desktop sidebar (collapsible, always visible) ──────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-surface border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out relative",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        <SidebarContent showLabels={!collapsed} />

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-ink-3 hover:text-primary hover:border-primary transition-all shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-3 sm:px-6 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-background transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="font-display text-[14px] sm:text-[15px] font-semibold text-ink truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* CTA button — hidden on small screens */}
            {isClient ? (
              <Link
                to="/post-project"
                className="hidden sm:flex bg-primary hover:bg-primary-dark text-white rounded-lg py-2 px-3 sm:px-4 text-[12px] sm:text-[13px] font-semibold items-center gap-1.5 transition-all hover:shadow-md"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Post Project</span>
              </Link>
            ) : (
              <Link
                to="/projects"
                className="hidden sm:flex bg-primary hover:bg-primary-dark text-white rounded-lg py-2 px-3 sm:px-4 text-[12px] sm:text-[13px] font-semibold items-center gap-1.5 transition-all hover:shadow-md"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Find Projects</span>
              </Link>
            )}

            {/* Notifications bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) markAllNotificationsRead();
                }}
                className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center relative hover:bg-background transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[17px] h-[17px] text-ink-3" />
                {unreadNotifications > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-[1.5px] border-surface" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 bg-surface border border-border rounded-xl shadow-lg py-2 z-50 max-h-80 sm:max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-ink">Notifications</div>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[13px] text-ink-3">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-border/50 hover:bg-background transition-colors ${!n.read ? "bg-primary-bg/20" : ""}`}
                      >
                        <div className="text-[13px] font-medium text-ink">
                          {n.subject || n.title || "Notification"}
                        </div>
                        {(n.body || n.message) && (
                          <div className="text-[12px] text-ink-3 mt-0.5 line-clamp-2">
                            {n.body || n.message}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-xs font-semibold text-primary-darker cursor-pointer hover:shadow-md transition-all"
              >
                {user?.initials ?? "?"}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 bg-surface border border-border rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[13px] font-semibold text-ink">{user?.name ?? "—"}</div>
                    <div className="text-[11px] text-ink-3">{user?.email || ""}</div>
                    <div className="text-[11px] text-ink-4 capitalize mt-0.5">
                      {currentRole} Account
                    </div>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-2 hover:bg-background transition-colors"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/reviews"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-2 hover:bg-background transition-colors"
                  >
                    <Star className="w-4 h-4" /> Reviews
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/notifications"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-2 hover:bg-background transition-colors"
                  >
                    <Bell className="w-4 h-4" /> Notifications
                    {unreadNotifications > 0 && (
                      <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </button>
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-danger hover:bg-danger-bg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-background p-3 sm:p-6">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}