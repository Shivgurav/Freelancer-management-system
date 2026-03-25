import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderKanban, FileText, MessageSquare,
  User, Star, Search, Plus, Bell, LogOut, Users,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function DashboardLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user, isAuthenticated, currentRole, setRole,
    unreadMessages, unreadNotifications, notifications,
    markAllNotificationsRead, logout,
  } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const isClient = currentRole === "client";

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  }

  const clientNav = [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/client" },
        { icon: Plus, label: "Post Project", href: "/post-project" },
        { icon: Users, label: "Find Freelancers", href: "/freelancers" },
        { icon: FolderKanban, label: "My Contracts", href: "/tracking" },
        { icon: FileText, label: "Received Bids", href: "/bids" },
        { icon: MessageSquare, label: "Messages", href: "/messages" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: User, label: "My Profile", href: "/profile" },
        { icon: Star, label: "Reviews", href: "/reviews" },
      ],
    },
  ];

  const freelancerNav = [
    {
      label: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/freelancer" },
        { icon: Search, label: "Browse Projects", href: "/projects" },
        { icon: FileText, label: "My Bids", href: "/bids" },
        { icon: FolderKanban, label: "My Contracts", href: "/tracking" },
        { icon: MessageSquare, label: "Messages", href: "/messages" },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: User, label: "My Profile", href: "/profile" },
        { icon: Star, label: "Reviews", href: "/reviews" },
      ],
    },
  ];

  const navGroups = isClient ? clientNav : freelancerNav;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-ink">
      {/* Sidebar */}
      <aside className="w-[220px] bg-surface border-r border-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-display font-extrabold text-[13px] text-white flex-shrink-0">
            TF
          </div>
          <span className="font-display font-bold text-base tracking-tight">TalentFlow</span>
        </div>

        {/* Role switcher */}
        <div className="flex gap-1.5 p-3 border-b border-border">
          <button
            onClick={() => { setRole("client"); navigate("/dashboard/client"); }}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-xs transition-all border-[1.5px]",
              isClient ? "border-primary bg-primary-bg font-semibold text-primary-dark" : "border-transparent hover:border-border bg-surface text-ink-4"
            )}
          >
            ◧ Client
          </button>
          <button
            onClick={() => { setRole("freelancer"); navigate("/dashboard/freelancer"); }}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-xs transition-all border-[1.5px]",
              !isClient ? "border-primary bg-primary-bg font-semibold text-primary-dark" : "border-transparent hover:border-border bg-surface text-ink-4"
            )}
          >
            ◉ Freelancer
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="text-[10px] font-semibold text-ink-4 uppercase tracking-wider px-2 mb-1">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all relative",
                      active ? "bg-primary-bg text-primary-dark font-semibold" : "text-ink-2 hover:bg-background hover:text-ink"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="p-3 border-t border-border">
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
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="font-display text-[15px] font-semibold text-ink">{title}</h1>

          <div className="flex items-center gap-2">
            {isClient ? (
              <Link to="/post-project"
                className="hidden sm:flex bg-primary hover:bg-primary-dark text-white rounded-lg py-2 px-4 text-[13px] font-semibold items-center gap-1.5 transition-all hover:shadow-md">
                <Plus className="w-4 h-4" /> Post Project
              </Link>
            ) : (
              <Link to="/projects"
                className="hidden sm:flex bg-primary hover:bg-primary-dark text-white rounded-lg py-2 px-4 text-[13px] font-semibold items-center gap-1.5 transition-all hover:shadow-md">
                <Search className="w-4 h-4" /> Find Projects
              </Link>
            )}

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllNotificationsRead(); }}
                className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center relative hover:bg-background transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px] text-ink-3" />
                {unreadNotifications > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-[1.5px] border-surface" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[13px] font-semibold text-ink">Notifications</div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[13px] text-ink-3">No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-border/50 hover:bg-background transition-colors">
                        <div className="text-[13px] font-medium text-ink">{n.subject || n.title || "Notification"}</div>
                        {(n.recipientName || n.message) && (
                          <div className="text-[12px] text-ink-3 mt-0.5">{n.recipientName || n.message}</div>
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
                <div className="absolute right-0 top-12 w-52 bg-surface border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[13px] font-semibold text-ink">{user?.name ?? "—"}</div>
                    <div className="text-[11px] text-ink-3">{user?.email || ""}</div>
                    <div className="text-[11px] text-ink-4 capitalize mt-0.5">{currentRole} Account</div>
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
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
