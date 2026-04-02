import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useBids, useBidsForJob, acceptBid, rejectBid, withdrawBid } from "@/hooks/use-bids";
import { useMyJobs } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFreelancerProfileById } from "../api/profile";

function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  const map = {
    ACCEPTED: { icon: <CheckCircle className="w-3.5 h-3.5" />, cls: "text-success bg-success-bg" },
    REJECTED: { icon: <XCircle className="w-3.5 h-3.5" />, cls: "text-danger bg-danger-bg" },
    WITHDRAWN: { icon: <XCircle className="w-3.5 h-3.5" />, cls: "text-ink-3 bg-background" },
  };
  const cfg = map[s] || { icon: <Clock className="w-3.5 h-3.5" />, cls: "text-warning bg-warning-bg" };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${cfg.cls}`}>
      {cfg.icon} {status || "PENDING"}
    </span>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// CLIENT VIEW — shows jobs and their bids
function ClientBidsView() {
  const { data: jobs = [], isLoading: jobsLoading } = useMyJobs();
  const [expandedJob, setExpandedJob] = useState(null);

  if (jobsLoading) return (
    <div className="text-center text-ink-3 py-12 animate-pulse">Loading your jobs...</div>
  );
  if (jobs.length === 0) return (
    <div className="text-center text-ink-3 py-12 text-[13px]">You haven't posted any jobs yet.</div>
  );

  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job) => (
        <JobBidsCard
          key={job.id}
          job={job}
          isExpanded={expandedJob === job.id}
          onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
        />
      ))}
    </div>
  );
}

function JobBidsCard({ job, isExpanded, onToggle }) {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { data: bids = [], isLoading, refetch } = useBidsForJob(isExpanded ? job.id : null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // useEffect(() => {
  //   bids.map(async (bid) => {
  //     try {
  //       const freelancer = await getFreelancerProfileById(bid.freelancerId);
  //       bid.freelancerName = freelancer.firstName;
  //     } catch {}
  //   })
  // })

  async function handleAccept(bid) {
    setActionLoading(bid.id + "_accept");
    setActionError("");
    setSuccessMsg("");
    try {
      await acceptBid(bid.id);
      setSuccessMsg(`Bid accepted! Contract created for ${bid.freelancerName || "freelancer"}.`);
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(bidId) {
    setActionLoading(bidId + "_reject");
    setActionError("");
    try {
      await rejectBid(bidId);
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-background/40 transition-colors"
      >
        <div className="text-left">
          <h2 className="font-display text-[14px] font-semibold text-ink">{job.title}</h2>
          <p className="text-xs text-ink-3 mt-0.5">
            {job.budgetMin != null ? `${formatCurrency(job.budgetMin)}–${formatCurrency(job.budgetMax)} · ` : ""}
            {job.proposalsCount} bid{job.proposalsCount !== 1 ? "s" : ""}
          </p>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-ink-3" /> : <ChevronDown className="w-4 h-4 text-ink-3" />}
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {actionError && (
            <div className="mx-5 mt-3 flex items-center gap-2 bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {actionError}
            </div>
          )}
          {successMsg && (
            <div className="mx-5 mt-3 flex items-center gap-2 bg-success-bg border border-success/30 text-success-text rounded-xl px-4 py-3 text-[13px]">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMsg}
              <button
                onClick={() => navigate("/tracking")}
                className="ml-auto text-primary font-semibold hover:underline text-[12px]"
              >
                View Contract →
              </button>
            </div>
          )}

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-5 text-center text-xs text-ink-3 animate-pulse">Loading bids...</div>
            ) : bids.length === 0 ? (
              <div className="p-5 text-center text-xs text-ink-3">No bids received yet.</div>
            ) : (
              bids.map((bid) => {
                const name = bid.freelancerName || "Freelancer";
                const statusUp = (bid.status || "").toUpperCase();
                const isAccepting = actionLoading === bid.id + "_accept";
                const isRejecting = actionLoading === bid.id + "_reject";

                return (
                  <div key={bid.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-light text-primary-darker flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-ink">{name}</div>
                        {bid.coverLetter && (
                          <div className="text-xs text-ink-3 mt-0.5 line-clamp-2">{bid.coverLetter}</div>
                        )}
                        <div className="text-xs text-ink-3 mt-0.5 flex gap-3">
                          {bid.deliveryDays && <span>{bid.deliveryDays} days delivery</span>}
                          {bid.amount != null && (
                            <span className="font-semibold text-ink">{formatCurrency(bid.amount)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={bid.status} />
                      {statusUp === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(bid.id)}
                            disabled={!!actionLoading}
                            className="border border-border rounded-lg px-3 py-1.5 text-[12px] font-semibold text-ink-3 hover:bg-background transition-colors disabled:opacity-50"
                          >
                            {isRejecting ? "…" : "Reject"}
                          </button>
                          <button
                            onClick={() => handleAccept(bid)}
                            disabled={!!actionLoading}
                            className="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {isAccepting ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Accepting…
                              </>
                            ) : "Accept"}
                          </button>
                        </div>
                      )}
                      {statusUp === "ACCEPTED" && (
                        <button
                          onClick={() => navigate("/tracking")}
                          className="text-[12px] text-primary font-semibold hover:underline"
                        >
                          View Contract →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// FREELANCER VIEW — shows their submitted bids
function FreelancerBidsView() {
  const navigate = useNavigate();
  const { data: bids = [], isLoading, error, refetch } = useBids();
  const [actionLoading, setActionLoading] = useState(null);

  async function handleWithdraw(bidId) {
    if (!confirm("Withdraw this bid?")) return;
    setActionLoading(bidId);
    try { await withdrawBid(bidId); refetch(); } catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  }

  if (isLoading) return (
    <div className="text-center text-ink-3 py-12 animate-pulse">Loading your bids...</div>
  );
  if (error) return (
    <div className="text-center text-danger py-12">{error}</div>
  );
  if (bids.length === 0) return (
    <div className="text-center text-ink-3 py-12 text-[13px]">You haven't submitted any proposals yet.</div>
  );

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display text-[15px] font-semibold text-ink">Submitted Proposals</h2>
        <p className="text-xs text-ink-3 mt-0.5">{bids.length} total</p>
      </div>
      <div className="divide-y divide-border">
        {bids.map((bid) => {
          const statusUp = (bid.status || "").toUpperCase();
          return (
            <div key={bid.id} className="p-5 flex items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-ink">
                  {bid.jobTitle || `Job #${bid.jobPostId?.slice(0, 8) || "?"}`}
                </div>
                {bid.coverLetter && (
                  <div className="text-xs text-ink-3 mt-1 line-clamp-2">{bid.coverLetter}</div>
                )}
                <div className="flex gap-3 mt-1 text-xs text-ink-3">
                  {bid.deliveryDays && <span>{bid.deliveryDays} days</span>}
                  {bid.amount != null && (
                    <span className="font-semibold text-ink">{formatCurrency(bid.amount)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={bid.status} />
                {statusUp === "ACCEPTED" && (
                  <button
                    onClick={() => navigate("/tracking")}
                    className="text-[12px] text-primary font-semibold hover:underline"
                  >
                    View Contract →
                  </button>
                )}
                {statusUp === "PENDING" && (
                  <button
                    onClick={() => handleWithdraw(bid.id)}
                    disabled={actionLoading === bid.id}
                    className="text-[12px] text-ink-3 hover:text-danger border border-border rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Bids() {
  const { currentRole } = useAppStore();
  const isClient = currentRole === "client";

  return (
    <DashboardLayout title={isClient ? "Received Bids" : "My Bids"}>
      {isClient ? <ClientBidsView /> : <FreelancerBidsView />}
    </DashboardLayout>
  );
}
