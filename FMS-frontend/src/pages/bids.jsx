import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useBids, updateBidStatus } from "@/hooks/use-bids";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";

function StatusIcon({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "accepted") return <CheckCircle className="w-4 h-4 text-success" />;
  if (s === "rejected") return <XCircle className="w-4 h-4 text-danger" />;
  return <Clock className="w-4 h-4 text-warning" />;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Bids() {
  const { currentRole } = useAppStore();
  const { data: bids = [], isLoading, error } = useBids();
  const isClient = currentRole === "client";

  const [localBids, setLocalBids] = useState(null);
  const displayBids = localBids !== null ? localBids : bids;

  async function handleStatusChange(bidId, status) {
    await updateBidStatus(bidId, status);
    setLocalBids((prev) =>
      (prev || bids).map((b) => (b.id === bidId ? { ...b, status } : b))
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title={isClient ? "Received Bids" : "My Bids"}>
        <div className="text-center text-ink-3 py-12 animate-pulse">Loading bids...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title={isClient ? "Received Bids" : "My Bids"}>
        <div className="text-center text-danger py-12">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isClient ? "Received Bids" : "My Bids"}>
      {displayBids.length === 0 ? (
        <div className="text-center text-ink-3 py-12 text-[13px]">No bids found.</div>
      ) : isClient ? (
        <ClientBidsView bids={displayBids} onStatusChange={handleStatusChange} />
      ) : (
        <FreelancerBidsView bids={displayBids} />
      )}
    </DashboardLayout>
  );
}

function ClientBidsView({ bids, onStatusChange }) {
  const byProject = bids.reduce((acc, bid) => {
    const key = bid.jobId || bid.projectId || "unknown";
    if (!acc[key]) {
      acc[key] = { projectTitle: bid.jobTitle || bid.projectTitle || "Project", bids: [] };
    }
    acc[key].bids.push(bid);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(byProject).map(([projectId, group]) => (
        <div key={projectId} className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display text-[14px] font-semibold text-ink">{group.projectTitle}</h2>
            <p className="text-xs text-ink-3 mt-0.5">{group.bids.length} proposal{group.bids.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="divide-y divide-border">
            {group.bids.map((bid) => {
              const name = bid.freelancerName || bid.freelancer?.name || "Freelancer";
              const initials = getInitials(name);
              const statusLower = (bid.status || "").toLowerCase();
              return (
                <div key={bid.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-light text-primary-darker flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink">{name}</div>
                      {bid.coverLetter && (
                        <div className="text-xs text-ink-3 mt-0.5 line-clamp-1">{bid.coverLetter}</div>
                      )}
                      <div className="text-xs text-ink-3 mt-0.5">
                        {bid.deliveryDays ? `${bid.deliveryDays} days` : ""}
                        {bid.amount != null ? ` · ${formatCurrency(bid.amount)}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 text-xs text-ink-3">
                      <StatusIcon status={bid.status} />
                      <span className="font-medium">{bid.status}</span>
                    </div>
                    {statusLower === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onStatusChange(bid.id, "Rejected")}
                          className="border border-border rounded-lg px-3 py-1.5 text-[12px] font-semibold text-ink-3 hover:bg-background transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onStatusChange(bid.id, "Accepted")}
                          className="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FreelancerBidsView({ bids }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display text-[15px] font-semibold text-ink">Submitted Proposals</h2>
        <p className="text-xs text-ink-3 mt-0.5">{bids.length} total</p>
      </div>
      <div className="divide-y divide-border">
        {bids.map((bid) => (
          <div key={bid.id} className="p-5 hover:bg-background/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-ink">{bid.jobTitle || bid.projectTitle || "Project"}</div>
                {bid.deliveryDays && (
                  <div className="text-xs text-ink-3 mt-0.5">{bid.deliveryDays} days delivery</div>
                )}
              </div>
              <div className="text-right flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-3">
                  <StatusIcon status={bid.status} />
                  <span className="font-medium">{bid.status}</span>
                </div>
                {bid.amount != null && (
                  <span className="text-[13px] font-semibold text-ink">{formatCurrency(bid.amount)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
