import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";
import { SkillTag } from "@/components/ui/skill-tag";
import { Clock, Filter, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function BrowseProjects() {
  const { data: projects = [], isLoading, error } = useProjects();
  const [search, setSearch] = useState("");
  const [budgetRange, setBudgetRange] = useState("Any");
  const [experienceLevel, setExperienceLevel] = useState("Any");

  const filtered = projects.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const inTitle = p.title.toLowerCase().includes(q);
      const inDesc = (p.description || "").toLowerCase().includes(q);
      const inSkills = (p.skills || []).some((s) => s.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inSkills) return false;
    }
    if (budgetRange === "$0–$1,000" && p.budgetMax > 1000) return false;
    if (budgetRange === "$1,000–$5,000" && (p.budgetMin < 1000 || p.budgetMax > 5000)) return false;
    if (budgetRange === "$5,000+" && p.budgetMax < 5000) return false;
    if (experienceLevel !== "Any" && p.experienceLevel && p.experienceLevel !== experienceLevel) return false;
    return true;
  });

  return (
    <DashboardLayout title="Browse Projects">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Filters sidebar */}
        <div className="w-full lg:w-[220px] flex-shrink-0">
          <div className="bg-surface border border-border rounded-xl p-4 sticky top-4">
            <h2 className="text-[13px] font-semibold text-ink mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h2>

            <div className="mb-4">
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Budget Range</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-ink bg-background focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Any">Any Budget</option>
                <option value="$0–$1,000">$0 – $1,000</option>
                <option value="$1,000–$5,000">$1,000 – $5,000</option>
                <option value="$5,000+">$5,000+</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-ink bg-background focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Any">Any Level</option>
                <option value="ENTRY">Entry Level</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <button
              onClick={() => { setBudgetRange("Any"); setExperienceLevel("Any"); setSearch(""); }}
              className="text-[12px] text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, skills, or keywords..."
              className="w-full border-[1.5px] border-border rounded-xl pl-10 pr-4 py-2.5 text-[13.5px] text-ink bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {isLoading ? (
            <div className="text-center text-ink-3 py-12 animate-pulse">Loading projects...</div>
          ) : error ? (
            <div className="text-center text-danger py-12">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-ink-3 py-12">
              {projects.length === 0 ? "No open projects at this time." : "No projects match your filters."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-ink-3">{filtered.length} project{filtered.length !== 1 ? "s" : ""} found</p>
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-[15px] font-semibold text-ink">{project.title}</h3>
                    <div className="flex items-center gap-2">
                      {project.experienceLevel && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-background text-ink-3 border border-border">
                          {project.experienceLevel}
                        </span>
                      )}
                      {(project.status || "OPEN").toUpperCase() === "OPEN" ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-success-bg text-success-text">Open</span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-background text-ink-3 border border-border">
                          {project.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-[13px] text-ink-3 leading-relaxed mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {project.skills.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {project.skills.map((s) => <SkillTag key={s}>{s}</SkillTag>)}
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-4 text-xs text-ink-3 pt-3 border-t border-border">
                    {project.budgetMin != null && (
                      <span className="font-semibold text-primary-dark">
                        {formatCurrency(project.budgetMin)}–{formatCurrency(project.budgetMax)}
                      </span>
                    )}
                    {project.durationDays && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {project.durationDays} days
                      </span>
                    )}
                    <span>◩ {project.proposalsCount} bids</span>
                    <Link
                      to={`/submit-proposal?id=${project.id}`}
                      className="ml-auto bg-primary hover:bg-primary-dark text-white rounded-lg py-1.5 px-4 text-[12.5px] font-semibold transition-all hover:shadow-md"
                    >
                      Submit Proposal <ArrowRight className="w-3 h-3 inline ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
