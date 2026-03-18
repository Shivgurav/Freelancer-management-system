import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";
import { SkillTag } from "@/components/ui/skill-tag";
import { Clock, Filter, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function BrowseProjects() {
  const { data: projects = [], isLoading } = useProjects();
  const [category, setCategory] = useState("All");
  const [budgetRange, setBudgetRange] = useState("Any");

  const filtered = projects.filter((p) => {
    if (category !== "All") {
      const cats = {
        "Web Development": ["React", "JavaScript", "TypeScript", "Node.js", "Tailwind CSS"],
        "Mobile Development": ["React Native", "Firebase"],
        "Design": ["Figma", "Illustrator", "Branding"],
      };
      const relevant = cats[category] || [];
      if (!p.skills.some((s) => relevant.includes(s))) return false;
    }
    if (budgetRange === "$0–$1,000" && p.budgetMax > 1000) return false;
    if (budgetRange === "$1,000–$5,000" && (p.budgetMin < 1000 || p.budgetMax > 5000)) return false;
    if (budgetRange === "$5,000+" && p.budgetMax < 5000) return false;
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
              <label className="block text-[12px] font-medium text-ink-2 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-ink bg-background focus:outline-none focus:border-primary transition-colors"
              >
                <option>All</option>
                <option>Web Development</option>
                <option>Mobile Development</option>
                <option>Design</option>
              </select>
            </div>

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

            <button
              onClick={() => { setCategory("All"); setBudgetRange("Any"); }}
              className="text-[12px] text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1">
          {isLoading ? (
            <div className="text-center text-ink-3 py-12 animate-pulse">Loading projects...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-ink-3 py-12">No projects match your filters.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-[15px] font-semibold text-ink">{project.title}</h3>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        project.status === "Active"
                          ? "bg-success-bg text-success-text"
                          : "bg-background text-ink-3"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-[13px] text-ink-3 leading-relaxed mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {project.skills.map((s) => <SkillTag key={s}>{s}</SkillTag>)}
                  </div>

                  <div className="flex items-center flex-wrap gap-4 text-xs text-ink-3 pt-3 border-t border-border">
                    <span className="font-semibold text-primary-dark">
                      {formatCurrency(project.budgetMin)}–{formatCurrency(project.budgetMax)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due {project.deadline}
                    </span>
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
