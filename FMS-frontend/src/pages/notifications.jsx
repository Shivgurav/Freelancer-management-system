import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/use-app-store";
import { Bell, CheckCheck, Mail, Briefcase, Star, FileText, AlertCircle } from "lucide-react";

function NotifIcon({ type }) {
  const map = {
    BID_SUBMITTED:        { icon: Briefcase, color: "text-primary bg-primary-bg" },
    BID_ACCEPTED:         { icon: CheckCheck, color: "text-success bg-success-bg" },
    BID_REJECTED:         { icon: AlertCircle, color: "text-danger bg-danger-bg" },
    CONTRACT_CREATED:     { icon: FileText, color: "text-primary bg-primary-bg" },
    MILESTONE_APPROVED:   { icon: CheckCheck, color: "text-success bg-success-bg" },
    REVISION_REQUESTED:   { icon: AlertCircle, color: "text-warning bg-warning-bg" },
    REPORT_APPROVED:      { icon: CheckCheck, color: "text-success bg-success-bg" },
    REVIEW_RECEIVED:      { icon: Star, color: "text-warning bg-warning-bg" },
    info:                 { icon: Bell, color: "text-primary bg-primary-bg" },
    review:               { icon: Star, color: "text-warning bg-warning-bg" },
  };
  const cfg = map[type] || map.info;
  const Icon = cfg.icon;
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { notifications, unreadNotifications, markAllNotificationsRead, loadNotifications } = useAppStore();

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Notifications</h1>
            {unreadNotifications > 0 && (
              <p className="text-[13px] text-ink-3 mt-0.5">{unreadNotifications} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifications}
              className="border border-border rounded-lg px-3 py-1.5 text-[12px] text-ink-2 hover:bg-surface transition-colors"
            >
              Refresh
            </button>
            {unreadNotifications > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-[12px] text-ink-2 hover:bg-surface transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-bg flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-[17px] font-bold text-ink mb-2">All caught up!</h2>
            <p className="text-[13px] text-ink-3 max-w-xs">
              You'll receive notifications for bids, contracts, milestones, and reviews here.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
            {notifications.map((n, i) => (
              <div
                key={n.id || i}
                className={`flex items-start gap-3 px-4 py-4 border-b border-border/50 last:border-0 transition-colors ${
                  !n.read ? "bg-primary-bg/30" : "hover:bg-background/50"
                }`}
              >
                <NotifIcon type={n.event || n.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13.5px] leading-snug ${!n.read ? "font-semibold text-ink" : "text-ink-2"}`}>
                    {n.subject || n.title || "Notification"}
                  </p>
                  {(n.body || n.message) && (
                    <p className="text-[12px] text-ink-3 mt-0.5 leading-relaxed">
                      {n.body || n.message}
                    </p>
                  )}
                  <p className="text-[11px] text-ink-4 mt-1">{formatDate(n.sentAt || n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
