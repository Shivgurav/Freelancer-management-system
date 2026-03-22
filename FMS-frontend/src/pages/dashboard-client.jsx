import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/use-app-store";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Plus, Construction } from "lucide-react";
import { useMyJobs } from "@/hooks/use-projects";
import { useContracts } from "@/hooks/use-contracts";
import { Link } from "react-router-dom";


function JobStatusBadge({ status }) {
  const s = (status || "OPEN").toUpperCase();
  const map = {
    OPEN:      "bg-success-bg text-success-text",
    CLOSED:    "bg-background text-ink-3 border border-border",
    CANCELLED: "bg-danger-bg text-danger-text",
  };
  const label = { OPEN: "Open", CLOSED: "Closed", CANCELLED: "Cancelled" };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s] || map.OPEN}`}>
      {label[s] || s}
    </span>
  );
}

export default function ClientDashboard() {
  const { user } = useAppStore();
  const { data: jobs = [], isLoading: jobsLoading } = useMyJobs();
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();

  const activeContracts = contracts.filter((c) => (c.status || "").toUpperCase() === "ACTIVE");
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  // Derive total spent from contracts
  const totalSpent = contracts.reduce((sum, c) => sum + (c.agreedAmount || 0), 0);

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-ink">Good morning, {firstName} 👋</h1>
        <p className="text-[13px] text-ink-3 mt-1">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="◧" label="Active Contracts" value={String(activeContracts.length)} sub="In progress" subColor="success" />
        <StatCard icon="◩" label="Jobs Posted" value={String(jobs.length)} sub="Total jobs" subColor="success" />
        <StatCard icon="◆" label="Total Contracts" value={String(contracts.length)} sub="All time" />
        <StatCard icon="$" label="Total Spent" value={totalSpent > 0 ? formatCurrency(totalSpent) : "—"} sub="Lifetime spend" subColor="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-ink">My Jobs</h2>
              <p className="text-xs text-ink-3 mt-0.5">Jobs you've posted</p>
            </div>
            <Link to="/tracking" className="border-[1.5px] border-border-2 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2 bg-surface hover:bg-background transition-colors">
              View contracts
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {jobsLoading ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm animate-pulse">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm">No jobs posted yet.</div>
            ) : (
              jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <h3 className="font-display text-[14px] font-semibold text-ink">{job.title}</h3>
                      {job.budgetMin != null && (
                        <p className="text-xs text-ink-3 mt-0.5">{formatCurrency(job.budgetMin)}–{formatCurrency(job.budgetMax)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <JobStatusBadge status={job.status} />
                      {job.proposalsCount > 0 && (
                        <Link to="/bids" className="text-[11px] text-primary hover:underline">{job.proposalsCount} bid{job.proposalsCount !== 1 ? "s" : ""}</Link>
                      )}
                    </div>
                  </div>
                  {job.skills.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {job.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
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
          {/* Active Contracts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Active Contracts</h2>
              <Link to="/tracking" className="text-[12.5px] text-primary font-medium hover:underline">Track</Link>
            </div>
            <div className="bg-surface border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
              {contractsLoading ? (
                <div className="p-4 text-center text-xs text-ink-3 animate-pulse">Loading...</div>
              ) : activeContracts.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-3">No active contracts.</div>
              ) : (
                activeContracts.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-primary-light text-primary-darker flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                      {(c.freelancerName || "F").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">{c.jobTitle || `Contract #${c.id?.slice(0, 8)}`}</div>
                      <div className="text-xs text-ink-3 truncate">{c.freelancerName || "Freelancer"}</div>
                    </div>
                    {c.agreedAmount != null && (
                      <div className="text-[13px] font-semibold text-ink flex-shrink-0">{formatCurrency(c.agreedAmount)}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages — under development */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Messages</h2>
              <Link to="/messages" className="text-[12.5px] text-primary font-medium hover:underline">Open</Link>
            </div>
            <div className="bg-surface border border-border rounded-xl shadow-sm p-4 flex items-center gap-3">
              <Construction className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-ink">Messaging coming soon</p>
                <p className="text-[12px] text-ink-3">Under development</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub, subColor }) {
  const colors = { success: "text-success", warning: "text-warning", default: "text-ink-3" };
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
