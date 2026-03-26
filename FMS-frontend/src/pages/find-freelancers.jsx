import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { SkillTag } from "@/components/ui/skill-tag";
import { searchFreelancers, getTopRatedFreelancers } from "@/api/search";
import { Star, MapPin, Briefcase, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, DollarSign } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: "rating",         label: "Top Rated" },
  { value: "rate_asc",       label: "Rate: Low to High" },
  { value: "rate_desc",      label: "Rate: High to Low" },
  { value: "jobs_completed", label: "Most Experienced" },
];

const AVAILABILITY = ["Any", "FULL_TIME", "PART_TIME", "NOT_AVAILABLE"];

function normalizeFreelancer(f) {
  return {
    profileId:         f.profileId || f.id,
    userId:            f.userId,
    fullName:          f.fullName || "Unknown",
    title:             f.title || "",
    location:          f.location || "",
    hourlyRate:        f.hourlyRate ? Number(f.hourlyRate) : null,
    yearsOfExperience: f.yearsOfExperience ?? null,
    skills:            f.skills || [],
    avgRating:         f.avgRating ? Number(f.avgRating) : null,
    totalReviews:      f.totalReviews ?? 0,
    totalJobsCompleted:f.totalJobsCompleted ?? 0,
    availability:      f.availability || "",
  };
}

function StarRating({ rating, count }) {
  if (!rating) return null;
  const r = Math.round(rating * 2) / 2;
  return (
    <span className="flex items-center gap-1 text-[12px]">
      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
      <span className="font-semibold text-ink">{r.toFixed(1)}</span>
      {count > 0 && <span className="text-ink-3">({count})</span>}
    </span>
  );
}

function FreelancerCard({ f }) {
  const navigate = useNavigate();
  const initials = f.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  
  return (
    <div
      onClick={() => navigate(`/freelancer/${f.profileId || f.userId}`)}
      className="bg-surface border border-border rounded-2xl p-5 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-xl font-bold text-white group-hover:scale-105 transition-transform">
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ink group-hover:text-primary transition-colors">
                {f.fullName}
              </h3>
              {f.title && (
                <p className="text-sm text-primary-dark mt-0.5">{f.title}</p>
              )}
            </div>
            {f.avgRating && (
              <StarRating rating={f.avgRating} count={f.totalReviews} />
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-2">
            {f.hourlyRate && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(f.hourlyRate)}/hr
              </span>
            )}
            {f.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {f.location}
              </span>
            )}
            {f.yearsOfExperience != null && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {f.yearsOfExperience}y exp
              </span>
            )}
          </div>

          {f.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {f.skills.slice(0, 5).map((s, i) => (
                <SkillTag key={i} className="px-2 py-1 text-xs">
                  {s.name || s}
                </SkillTag>
              ))}
              {f.skills.length > 5 && (
                <span className="px-2 py-1 text-xs text-ink-3">+{f.skills.length - 5}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            {f.totalJobsCompleted > 0 && (
              <span className="text-xs text-ink-2">
                {f.totalJobsCompleted} job{f.totalJobsCompleted !== 1 ? "s" : ""} completed
              </span>
            )}
            <span className="text-xs text-primary font-medium group-hover:underline">
              View Profile →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FindFreelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword]             = useState("");
  const [skill, setSkill]                 = useState("");
  const [availability, setAvailability]   = useState("Any");
  const [minRate, setMinRate]             = useState("");
  const [maxRate, setMaxRate]             = useState("");
  const [minRating, setMinRating]         = useState("");
  const [sortBy, setSortBy]               = useState("rating");
  const [showFilters, setShowFilters]     = useState(false);

  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const timer = useRef(null);

  const runSearch = useCallback(async (params) => {
    setIsLoading(true);
    setError("");
    try {
      const hasFilters = params.keyword || params.skill || params.availability !== "Any"
        || params.minRate || params.maxRate || params.minRating;
      let result;
      if (hasFilters) {
        const body = { page: params.page, size: 12, sortBy: params.sortBy };
        if (params.keyword)                          body.keyword      = params.keyword;
        if (params.skill)                            body.skill        = params.skill;
        if (params.availability && params.availability !== "Any") body.availability = params.availability;
        if (params.minRate)                          body.minRate      = Number(params.minRate);
        if (params.maxRate)                          body.maxRate      = Number(params.maxRate);
        if (params.minRating)                        body.minRating    = Number(params.minRating);
        result = await searchFreelancers(body);
      } else {
        result = await getTopRatedFreelancers(params.page, 12);
      }
      const list = result?.results ?? (Array.isArray(result) ? result : []);
      setFreelancers(list.map(normalizeFreelancer));
      setTotalPages(result?.totalPages ?? 1);
      setTotalResults(result?.totalResults ?? list.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch({ keyword, skill, availability, minRate, maxRate, minRating, sortBy, page });
  }, [page, sortBy]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(0);
      runSearch({ keyword, skill, availability, minRate, maxRate, minRating, sortBy, page: 0 });
    }, 350);
    return () => clearTimeout(timer.current);
  }, [keyword]);

  function applyFilters() {
    setPage(0);
    runSearch({ keyword, skill, availability, minRate, maxRate, minRating, sortBy, page: 0 });
  }

  function clearFilters() {
    setSkill(""); setAvailability("Any"); setMinRate(""); setMaxRate(""); setMinRating("");
    setPage(0);
    runSearch({ keyword, skill: "", availability: "Any", minRate: "", maxRate: "", minRating: "", sortBy, page: 0 });
  }

  const hasActiveFilters = skill || availability !== "Any" || minRate || maxRate || minRating;

  return (
    <DashboardLayout title="Find Freelancers">
      <div className="flex flex-col gap-5">

        {/* Search bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name, title, or skill…"
              className="w-full border-[1.5px] border-border rounded-xl pl-10 pr-4 py-2.5 text-[13.5px] text-ink bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            {keyword && (
              <button onClick={() => setKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); }}
            className="border-[1.5px] border-border rounded-xl px-3 py-2.5 text-[13px] bg-surface text-ink-2 focus:outline-none focus:border-primary transition-all"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
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
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Skill</label>
              <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. React…"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all" />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Availability</label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all">
                {AVAILABILITY.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="min-w-[100px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Min Rate ($/hr)</label>
              <input type="number" value={minRate} onChange={(e) => setMinRate(e.target.value)} placeholder="0" min="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all" />
            </div>
            <div className="min-w-[100px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Max Rate ($/hr)</label>
              <input type="number" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} placeholder="Any" min="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all" />
            </div>
            <div className="min-w-[100px]">
              <label className="block text-[12px] font-medium text-ink-2 mb-1.5">Min Rating</label>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all">
                <option value="">Any</option>
                <option value="3">3★+</option>
                <option value="4">4★+</option>
                <option value="4.5">4.5★+</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition-all">Apply</button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="border border-border rounded-lg px-4 py-2 text-[13px] text-ink-3 hover:bg-background transition-colors">Clear</button>
              )}
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-ink-3">
            {isLoading ? "Searching…" : `${totalResults} freelancer${totalResults !== 1 ? "s" : ""} found`}
          </p>
          {totalPages > 1 && <p className="text-[12px] text-ink-4">Page {page + 1} of {totalPages}</p>}
        </div>

        {error && (
          <div className="bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px]">{error}</div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-surface border border-border rounded-xl p-5 h-44 animate-pulse" />)}
          </div>
        ) : freelancers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="font-display text-[16px] font-semibold text-ink mb-2">No freelancers found</h3>
            <p className="text-[13px] text-ink-3">Try different keywords or clear the filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {freelancers.map((f, i) => <FreelancerCard key={f.profileId || i} f={f} />)}
          </div>
        )}

        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 border border-border rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-surface disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-[13px] text-ink-3 px-2">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 border border-border rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-surface disabled:opacity-40 transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
