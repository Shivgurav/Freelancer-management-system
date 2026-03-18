import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppStore } from "@/store/use-app-store";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Clock } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useBids } from "@/hooks/use-bids";
import { SkillTag } from "@/components/ui/skill-tag";
import { Link } from "react-router-dom";

export default function FreelancerDashboard() {
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
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-[13px] text-ink-3 mt-1">
          You have {activeProjects.length} active projects and {pendingBids.length} bids pending review.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="◩" label="Bids Sent" value={String(bids.length)} sub={`${pendingBids.length} under review`} />
        <StatCard icon="◧" label="Active Work" value={String(activeProjects.length)} sub="In progress" subColor="success" />
        <StatCard icon="◆" label="Completed" value={String(user?.projectsCount ?? 0)} sub="All time" />
        <StatCard icon="$" label="Total Earned" value={user?.totalEarned != null ? formatCurrency(user.totalEarned) : "—"} sub="Lifetime earnings" subColor="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[15px] font-semibold text-ink">Recommended Projects</h2>
            <Link to="/projects" className="text-[12.5px] text-primary font-medium hover:underline">
              Browse all
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {projectsLoading ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm animate-pulse">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-5 text-center text-ink-3 text-sm">No projects available.</div>
            ) : (
              projects.slice(0, 2).map((project, idx) => (
                <div
                  key={project.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow"
                >
                  {idx === 0 && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-light to-primary" />
                  )}
                  <h3 className="font-display text-[15px] font-semibold text-ink mb-1.5">{project.title}</h3>
                  {project.description && (
                    <p className="text-[13px] text-ink-3 leading-relaxed mb-3 line-clamp-2">{project.description}</p>
                  )}
                  {project.skills && project.skills.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3.5">
                      {project.skills.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}
                    </div>
                  )}
                  <div className="flex items-center flex-wrap gap-4 text-xs text-ink-3 pt-3 border-t border-border">
                    {project.budgetMin != null && (
                      <span className="font-semibold text-primary-dark">
                        {formatCurrency(project.budgetMin)}–{formatCurrency(project.budgetMax)}
                      </span>
                    )}
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due {project.deadline}
                      </span>
                    )}
                    {project.proposalsCount != null && <span>◩ {project.proposalsCount} bids</span>}
                    <Link
                      to={`/submit-proposal?id=${project.id}`}
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
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[15px] font-semibold text-ink">Active Projects</h2>
              <Link to="/tracking" className="text-[12.5px] text-primary font-medium hover:underline">
                Track
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {activeProjects.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-4 text-center text-xs text-ink-3">No active projects.</div>
              ) : (
                activeProjects.slice(0, 2).map((project) => (
                  <div key={project.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-[13.5px] font-medium text-ink mb-2 line-clamp-1">{project.title}</div>
                    {project.progress != null && (
                      <>
                        <div className="bg-primary-bg rounded-full h-1.5 overflow-hidden mb-1.5">
                          <div
                            className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-700"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-ink-3">
                          {project.progress}% done{project.deadline ? ` · Due ${project.deadline}` : ""}
                        </div>
                      </>
                    )}
                  </div>
                ))
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
