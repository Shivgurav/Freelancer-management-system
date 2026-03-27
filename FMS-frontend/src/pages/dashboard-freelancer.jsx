import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/use-app-store";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Clock, MessageSquare } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useBids } from "@/hooks/use-bids";
import { useContracts } from "@/hooks/use-contracts";
import { SkillTag } from "@/components/ui/skill-tag";
import { Link } from "react-router-dom";

export default function FreelancerDashboard() {
  const { user } = useAppStore();
  const { data: openJobs = [], isLoading: jobsLoading } = useProjects();
  const { data: bids = [], isLoading: bidsLoading } = useBids();
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();

  const activeContracts = contracts.filter((c) => (c.status || "").toUpperCase() === "ACTIVE");
  const pendingBids = bids.filter((b) => (b.status || "").toUpperCase() === "PENDING");

  // Total earned from completed contracts
  const totalEarned = contracts
    .filter((c) => (c.status || "").toUpperCase() === "COMPLETED")
    .reduce((sum, c) => sum + (c.agreedAmount || 0), 0);

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-ink">Welcome back, {firstName} 👋</h1>
        <p className="text-[13px] text-ink-3 mt-1">
          {activeContracts.length} active contract{activeContracts.length !== 1 ? "s" : ""} · {pendingBids.length} bid{pendingBids.length !== 1 ? "s" : ""} pending
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="◩" label="Bids Submitted" value={String(bids.length)} sub={`${pendingBids.length} under review`} />
        <StatCard icon="◧" label="Active Contracts" value={String(activeContracts.length)} sub="In progress" subColor="success" />
        <StatCard icon="◆" label="Completed" value={String(contracts.filter((c) => (c.status || "").toUpperCase() === "COMPLETED").length)} sub="All time" />
        <StatCard icon="$" label="Total Earned" value={totalEarned > 0 ? formatCurrency(totalEarned) : "—"} sub="Lifetime earnings" subColor="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[15px] font-semibold text-ink">Open Projects</h2>
            <Link to="/projects" className="text-[12.5px] text-primary font-medium hover:underline">Browse all</Link>
          </div>

          <div className="flex flex-col gap-4">
            {jobsLoading ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm animate-pulse">Loading projects...</div>
            ) : openJobs.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm">No open projects available.</div>
            ) : (
              openJobs.slice(0, 3).map((job, idx) => (
                <div key={job.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                  {idx === 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-light to-primary" />}
                  <h3 className="font-display text-[15px] font-semibold text-ink mb-1.5">{job.title}</h3>
                  {job.description && (
                    <p className="text-[13px] text-ink-3 leading-relaxed mb-3 line-clamp-2">{job.description}</p>
                  )}
                  {job.skills.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3.5">
                      {job.skills.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}
                    </div>
                  )}
                  <div className="flex items-center flex-wrap gap-4 text-xs text-ink-3 pt-3 border-t border-border">
                    {job.budgetMin != null && (
                      <span className="font-semibold text-primary-dark">{formatCurrency(job.budgetMin)}–{formatCurrency(job.budgetMax)}</span>
                    )}
                    {job.durationDays && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.durationDays} days</span>
                    )}
                    <span>◩ {job.proposalsCount} bids</span>
                    <Link
                      to={`/submit-proposal?id=${job.id}`}
                      className="ml-auto bg-primary hover:bg-primary-dark text-white rounded-lg py-1.5 px-4 text-[12.5px] font-semibold transition-all hover:shadow-md"
                    >
                      Bid Now
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* My Bids */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">My Bids</h2>
              <Link to="/bids" className="text-[12.5px] text-primary font-medium hover:underline">View all</Link>
            </div>
            <div className="bg-surface border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
              {bidsLoading ? (
                <div className="p-4 text-center text-xs text-ink-3 animate-pulse">Loading...</div>
              ) : bids.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-3">No bids yet.</div>
              ) : (
                bids.slice(0, 4).map((bid) => {
                  const s = (bid.status || "").toUpperCase();
                  return (
                    <div key={bid.id} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{bid.jobTitle || `Job #${bid.jobPostId?.slice(0, 8)}`}</div>
                        {bid.deliveryDays && <div className="text-xs text-ink-3">{bid.deliveryDays} days</div>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {bid.amount != null && <div className="text-[13px] font-semibold text-ink">{formatCurrency(bid.amount)}</div>}
                        <div className={`text-[11px] font-medium ${s === "ACCEPTED" ? "text-success" : s === "REJECTED" ? "text-danger" : "text-warning"}`}>
                          {bid.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Contracts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Active Contracts</h2>
              <Link to="/tracking" className="text-[12.5px] text-primary font-medium hover:underline">Track</Link>
            </div>
            <div className="flex flex-col gap-3">
              {contractsLoading ? (
                <div className="bg-surface border border-border rounded-xl p-4 text-center text-xs text-ink-3 animate-pulse">Loading...</div>
              ) : activeContracts.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-4 text-center text-xs text-ink-3">No active contracts.</div>
              ) : (
                activeContracts.slice(0, 2).map((c) => (
                  <div key={c.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-[13.5px] font-medium text-ink mb-1">{c.jobTitle || `Contract #${c.id?.slice(0, 8)}`}</div>
                    <div className="flex justify-between text-xs text-ink-3">
                      <span>Client: {c.clientName || "—"}</span>
                      {c.agreedAmount != null && <span className="font-semibold text-ink">{formatCurrency(c.agreedAmount)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Messages</h2>
              <Link to="/messages" className="text-[12.5px] text-primary font-medium hover:underline">Open</Link>
            </div>
            <Link to="/messages" className="bg-surface border border-border rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-background transition-colors block">
              <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Open Messages</p>
                <p className="text-[12px] text-ink-3">Chat with your clients</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub, subColor }) {
  const color = subColor === "success" ? "text-success" : "text-ink-3";
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xl mb-2 text-primary-dark">{icon}</div>
      <div className="text-xs text-ink-3 mb-1 font-medium">{label}</div>
      <div className="font-display text-3xl font-bold text-ink mb-1">{value}</div>
      <div className={`text-xs font-medium flex items-center gap-1 ${color}`}>
        <ArrowUpRight className="w-3 h-3" /> {sub}
      </div>
    </div>
  );
}
