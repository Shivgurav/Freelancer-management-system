import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/use-app-store";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Plus } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useBids } from "@/hooks/use-bids";
import { Link } from "react-router-dom";

export default function ClientDashboard() {
  const { user } = useAppStore();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: bids = [], isLoading: bidsLoading } = useBids();

  const activeProjects = projects.filter((p) => p.status === "Active" || p.status === "active");
  const pendingBids = bids.filter((b) => b.status === "Pending" || b.status === "pending");

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-ink">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-[13px] text-ink-3 mt-1">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="◧" label="Active Projects" value={String(activeProjects.length)} sub="Track ongoing work" subColor="success" />
        <StatCard icon="◩" label="Pending Bids" value={String(pendingBids.length)} sub={`${pendingBids.length} need review`} subColor="warning" />
        <StatCard icon="◆" label="Total Projects" value={String(projects.length)} sub="All time" subColor="success" />
        <StatCard icon="$" label="Total Spent" value={user?.totalSpent != null ? formatCurrency(user.totalSpent) : "—"} sub="Lifetime spend" subColor="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-ink">Active Projects</h2>
              <p className="text-xs text-ink-3 mt-0.5">Track ongoing work</p>
            </div>
            <Link
              to="/tracking"
              className="border-[1.5px] border-border-2 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2 bg-surface hover:bg-background transition-colors"
            >
              View all
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {projectsLoading ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm animate-pulse">Loading projects...</div>
            ) : activeProjects.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm">No active projects.</div>
            ) : (
              activeProjects.slice(0, 2).map((project) => (
                <div key={project.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-display text-[14px] font-semibold text-ink">{project.title}</h3>
                      {project.clientName && <p className="text-xs text-ink-3 mt-0.5">{project.clientName}</p>}
                    </div>
                    <span className="text-[11px] bg-success-bg text-success-text px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  {project.progress != null && (
                    <>
                      <div className="bg-primary-bg rounded-full h-1.5 overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-700"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-ink-3">
                        <span>{project.progress}% complete</span>
                        {project.deadline && <span>Due {project.deadline}</span>}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            <Link
              to="/post-project"
              className="border-2 border-dashed border-border rounded-xl p-5 flex items-center justify-center gap-2 text-[13px] font-medium text-ink-3 hover:border-primary-light hover:text-primary-dark hover:bg-primary-bg transition-all"
            >
              <Plus className="w-4 h-4" /> Post a new project
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Recent Bids</h2>
              <Link to="/bids" className="text-[12.5px] text-primary font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="bg-surface border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
              {bidsLoading ? (
                <div className="p-4 text-center text-xs text-ink-3 animate-pulse">Loading bids...</div>
              ) : bids.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-3">No bids yet.</div>
              ) : (
                bids.slice(0, 3).map((bid) => {
                  const name = bid.freelancerName || bid.freelancer?.name || "Freelancer";
                  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={bid.id} className="flex items-center gap-2.5 p-3">
                      <div className="w-8 h-8 rounded-full bg-primary-light text-primary-darker flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{name}</div>
                        <div className="text-xs text-ink-3 truncate">{bid.projectTitle || bid.jobTitle || ""}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[13px] font-semibold text-ink">{bid.amount != null ? formatCurrency(bid.amount) : "—"}</div>
                        <div className={`text-[10px] font-medium ${
                          bid.status === "Accepted" || bid.status === "accepted" ? "text-success"
                          : bid.status === "Rejected" || bid.status === "rejected" ? "text-danger"
                          : "text-warning"
                        }`}>
                          {bid.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Messages</h2>
              <Link to="/messages" className="text-[12.5px] text-primary font-medium hover:underline">
                Open
              </Link>
            </div>
            <div className="bg-surface border border-border rounded-xl shadow-sm">
              <Link
                to="/messages"
                className="flex items-center gap-2.5 p-4 hover:bg-background/50 transition-colors rounded-xl text-[13px] text-ink-3"
              >
                Open your messages to view conversations.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub, subColor }) {
  const colors = {
    success: "text-success",
    warning: "text-warning",
    default: "text-ink-3",
  };
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xl mb-2 text-primary-dark">{icon}</div>
      <div className="text-xs text-ink-3 mb-1 font-medium">{label}</div>
      <div className="font-display text-3xl font-bold text-ink mb-1">{value}</div>
      <div className={`text-xs font-medium flex items-center gap-1 ${colors[subColor] || colors.default}`}>
        <ArrowUpRight className="w-3 h-3" /> {sub}
      </div>
    </div>
  );
}
