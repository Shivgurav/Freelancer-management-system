import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { SkillTag } from "@/components/ui/skill-tag";
import { searchJobs, getLatestJobs } from "@/api/search";
import { Clock, Filter, ArrowRight, Search, ChevronLeft, ChevronRight, X, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";

const EXPERIENCE_LEVELS = ["Any", "BEGINNER", "INTERMEDIATE", "EXPERT"];

function normalizeJob(j) {
  return {
    id: j.jobId || j.id,
    clientId: j.clientId,
    title: j.title || "",
    description: j.description || "",
    budgetMin: Number(j.budgetMin ?? j.budget_min ?? 0),
    budgetMax: Number(j.budgetMax ?? j.budget_max ?? 0),
    durationDays: j.durationDays ?? j.duration_days ?? null,
    experienceLevel: j.experienceLevel || "",
    skills: j.requiredSkills || j.skills || [],
    proposalsCount: j.totalBids ?? j.proposalsCount ?? 0,
    status: j.status || "OPEN",
  };
}

export default function BrowseProjects() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [keyword, setKeyword] = useState("");
  const [skill, setSkill] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Any");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const searchTimerRef = useRef(null);

  const runSearch = useCallback(async (params) => {
    setIsLoading(true);
    setError("");
    try {
      const hasFilters = params.keyword || params.skill || params.experienceLevel || params.minBudget || params.maxBudget;
      let result;
      if (hasFilters) {
        const body = { page: params.page, size: 12 };
        if (params.keyword) body.keyword = params.keyword;
        if (params.skill)   body.skill   = params.skill;
        if (params.experienceLevel && params.experienceLevel !== "Any") body.experienceLevel = params.experienceLevel;
        if (params.minBudget) body.minBudget = Number(params.minBudget);
        if (params.maxBudget) body.maxBudget = Number(params.maxBudget);
        result = await searchJobs(body);
      } else {
        result = await getLatestJobs(params.page, 12);
      }
      const list   = result?.results ?? (Array.isArray(result) ? result : []);
      setJobs(list.map(normalizeJob));
      setTotalPages(result?.totalPages ?? 1);
      setTotalResults(result?.totalResults ?? list.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    runSearch({ keyword, skill, experienceLevel, minBudget, maxBudget, page });
  }, [page]);

  // Debounced keyword search
  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(0);
      runSearch({ keyword, skill, experienceLevel, minBudget, maxBudget, page: 0 });
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [keyword]);

  function applyFilters() {
    setPage(0);
    runSearch({ keyword, skill, experienceLevel, minBudget, maxBudget, page: 0 });
  }

  function clearFilters() {
    setSkill(""); setExperienceLevel("Any"); setMinBudget(""); setMaxBudget("");
    setPage(0);
    runSearch({ keyword, skill: "", experienceLevel: "Any", minBudget: "", maxBudget: "", page: 0 });
  }

  const hasActiveFilters = skill || experienceLevel !== "Any" || minBudget || maxBudget;

  return (
    <DashboardLayout title="Browse Projects">
      <div className="flex flex-col gap-5">

        {/* Search + filter toggle bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by title, skill, or keyword…"
              className="w-full border-[1.5px] border-border rounded-xl pl-10 pr-4 py-2.5 text-[13.5px] text-ink bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            {keyword && (
              <button onClick={() => setKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 border-[1.5px] rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
              showFilters || hasActiveFilters
                ? "border-primary bg-primary-bg text-primary-dark"
                : "border-border bg-surface text-ink-2 hover:border-border-2"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Skill</label>
              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. React, Python…"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
              >
                {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="min-w-[110px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Min Budget ($)</label>
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="min-w-[110px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Max Budget ($)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Any"
                min="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition-all"
              >
                Apply
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="border border-border rounded-lg px-4 py-2 text-[13px] text-ink-3 hover:bg-background transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-ink-3">
            {isLoading
              ? "Searching…"
              : `${totalResults} project${totalResults !== 1 ? "s" : ""} found`}
          </p>
          {totalPages > 1 && (
            <p className="text-[12px] text-ink-4">Page {page + 1} of {totalPages}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px]">
            {error}
          </div>
        )}

        {/* Job cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-display text-[16px] font-semibold text-ink mb-2">No projects found</h3>
            <p className="text-[13px] text-ink-3">Try different keywords or clear the filters.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-primary font-semibold text-[13px] hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobs.map((job, idx) => (
              <JobCard key={job.id || idx} job={job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 border border-border rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-surface disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-[13px] text-ink-3 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 border border-border rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-surface disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function JobCard({ job }) {
  const expColor = {
    BEGINNER: "bg-success-bg text-success-text",
    INTERMEDIATE: "bg-primary-bg text-primary-dark",
    EXPERT: "bg-warning-bg text-warning-text",
  }[job.experienceLevel] || "bg-background text-ink-3 border border-border";

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-light transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[15px] font-semibold text-ink leading-snug">{job.title}</h3>
        {job.experienceLevel && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${expColor}`}>
            {job.experienceLevel}
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-[13px] text-ink-3 leading-relaxed line-clamp-2">{job.description}</p>
      )}

      {job.skills.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {job.skills.slice(0, 5).map((s) => <SkillTag key={s}>{s}</SkillTag>)}
          {job.skills.length > 5 && (
            <span className="text-[11px] text-ink-3 self-center">+{job.skills.length - 5}</span>
          )}
        </div>
      )}

      <div className="flex items-center flex-wrap gap-3 text-xs text-ink-3 pt-2 border-t border-border mt-auto">
        {job.budgetMin > 0 && (
          <span className="font-semibold text-primary-dark text-[13px]">
            {formatCurrency(job.budgetMin)}–{formatCurrency(job.budgetMax)}
          </span>
        )}
        {job.durationDays && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.durationDays}d</span>
        )}
        {job.proposalsCount > 0 && (
          <span>{job.proposalsCount} bid{job.proposalsCount !== 1 ? "s" : ""}</span>
        )}
        <Link
          to={`/submit-proposal?id=${job.id}`}
          className="ml-auto flex items-center gap-1 bg-primary hover:bg-primary-dark text-white rounded-lg py-1.5 px-4 text-[12.5px] font-semibold transition-all hover:shadow-md"
        >
          Bid Now <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
