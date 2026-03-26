import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Star, Check, CheckCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { submitReview, getMyReviews, getReviewsForUser } from "@/api/reviews";
import { getUserById } from "@/api/auth";
import { useContracts } from "@/hooks/use-contracts";

// Enrich reviews with names from auth service
async function resolveName(userId) {
  if (!userId) return null;
  try {
    const info = await getUserById(userId);
    if (!info) return null;
    return [info.firstName, info.lastName].filter(Boolean).join(" ").trim() || info.email || null;
  } catch { return null; }
}

async function enrichReviews(list) {
  return Promise.all(
    list.map(async (r) => {
      const [revieweeName, reviewerName] = await Promise.all([
        resolveName(r.revieweeId),
        resolveName(r.reviewerId),
      ]);
      return {
        ...r,
        revieweeName: revieweeName || `User #${String(r.revieweeId || "").slice(0, 8) || "?"}`,
        reviewerName: reviewerName || `User #${String(r.reviewerId || "").slice(0, 8) || "?"}`,
      };
    })
  );
}

function ReviewCard({ review, perspective }) {
  const displayName =
    perspective === "sent"
      ? (review.revieweeName || "Unknown")
      : (review.reviewerName || "Unknown");

  const initial = (displayName + "").charAt(0).toUpperCase();
  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="bg-background border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-[11px] font-bold text-primary-darker flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink">{displayName}</div>
          <div className="text-[11px] text-ink-3">
            {review.jobTitle || ""}
            {dateStr ? ` · ${dateStr}` : ""}
          </div>
        </div>
        <div className="flex text-warning text-[14px] flex-shrink-0">
          {"★".repeat(review.rating || 0)}
          {"☆".repeat(5 - (review.rating || 0))}
        </div>
      </div>
      {review.comment && (
        <p className="text-[12.5px] text-ink-2 leading-relaxed">{review.comment}</p>
      )}
      <div className="mt-2 text-[11px] text-ink-3">
        Role: {review.reviewerRole === "CLIENT" ? "Client" : "Freelancer"}
        {perspective === "received" && <span className="ml-1">reviewed you</span>}
      </div>
    </div>
  );
}

export default function Reviews() {
  const { user, notify, currentRole } = useAppStore();
  const { data: contracts = [] } = useContracts();

  const [sentReviews, setSentReviews]         = useState([]);
  const [sentLoading, setSentLoading]         = useState(true);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [reviewsError, setReviewsError]       = useState("");
  const [activeTab, setActiveTab]             = useState("received");

  const [rating, setRating]                   = useState(4);
  const [hoveredRating, setHoveredRating]     = useState(0);
  const [reviewText, setReviewText]           = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [submitting, setSubmitting]           = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [submitError, setSubmitError]         = useState("");

  const isClient = currentRole === "client";

  useEffect(() => {
    setSentLoading(true);
    getMyReviews()
      .then(async (result) => {
        const list = Array.isArray(result) ? result : result?.reviews ?? result?.content ?? [];
        const enriched = await enrichReviews(list);
        setSentReviews(enriched);
      })
      .catch((err) => {
        if (!err.message?.includes("401") && !err.message?.includes("403")) {
          setReviewsError(err.message);
        }
      })
      .finally(() => setSentLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) { setReceivedLoading(false); return; }
    setReceivedLoading(true);
    getReviewsForUser(user.id)
      .then(async (result) => {
        const list = Array.isArray(result) ? result : result?.reviews ?? result?.content ?? [];
        const enriched = await enrichReviews(list);
        setReceivedReviews(enriched);
      })
      .catch(() => setReceivedReviews([]))
      .finally(() => setReceivedLoading(false));
  }, [user?.id]);

  // Completed contracts only — can only review completed work
  const completedContracts = contracts.filter(
    (c) => (c.status || "").toUpperCase() === "COMPLETED"
  );
  const selectedContract =
    completedContracts.find((c) => c.id === selectedContractId) ||
    (completedContracts.length > 0 ? completedContracts[0] : null);

  async function handleSubmitReview() {
    if (!reviewText.trim() || !selectedContract) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // revieweeId = the other party on the contract
      const revieweeId = isClient
        ? selectedContract.freelancerId
        : selectedContract.clientId;
      if (!revieweeId) throw new Error("Could not determine reviewee ID from contract.");

      const result = await submitReview({
        contractId: selectedContract.id,
        revieweeId,
        rating,
        // Backend ReviewRequest has no tags field — embed tags in comment
        comment: reviewText.trim(),
      });

      const optimisticName = isClient
        ? selectedContract.freelancerName || "Freelancer"
        : selectedContract.clientName || "Client";

      setSentReviews((prev) => [{
        id: result?.id || Date.now(),
        contractId: selectedContract.id,
        revieweeId,
        reviewerId: user?.id,
        reviewerRole: isClient ? "CLIENT" : "FREELANCER",
        rating,
        comment: reviewText.trim(),
        createdAt: new Date().toISOString(),
        revieweeName: optimisticName,
        reviewerName: user?.name || "Me",
        jobTitle: selectedContract.jobTitle,
      }, ...prev]);

      setSubmitted(true);
      setActiveTab("sent");
      setReviewText("");
      setRating(4);
      notify({ type: "review", title: "Review submitted", message: "Your review was posted." });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Reviews & Ratings">
      <div className="max-w-[720px] mx-auto py-2">
        {submitted && (
          <div className="mb-4 bg-success-bg border border-success/30 rounded-xl px-4 py-3 flex items-center gap-2 text-success-text text-[13px] font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Review submitted successfully!
          </div>
        )}
        {submitError && (
          <div className="mb-4 bg-danger-bg border border-danger/30 rounded-xl px-4 py-3 text-danger-text text-[13px] font-medium">
            {submitError}
          </div>
        )}

        {/* Submit Review Form */}
        {completedContracts.length > 0 ? (
          <div className="bg-surface border border-border rounded-[14px] p-6 mb-5 shadow-sm">
            <h2 className="font-display text-[17px] font-semibold text-ink mb-5">Rate Your Experience</h2>

            {completedContracts.length > 1 && (
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-ink-2 mb-2">Select Contract</label>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all"
                >
                  {completedContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.jobTitle || `Contract #${c.id?.slice(0, 8)}`}
                      {isClient ? ` — ${c.freelancerName || "Freelancer"}` : ` — ${c.clientName || "Client"}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedContract && (
              <div className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-xl mb-5">
                <div className="w-[48px] h-[48px] rounded-full bg-primary-light flex items-center justify-center text-lg font-bold text-primary-darker shrink-0">
                  {(isClient
                    ? selectedContract.freelancerName || "?"
                    : selectedContract.clientName || "?"
                  ).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink">
                    {isClient ? selectedContract.freelancerName || "Unknown" : selectedContract.clientName || "Unknown"}
                  </div>
                  <div className="text-[12px] text-ink-3 mt-0.5">
                    {selectedContract.jobTitle || "Contract"} · Completed
                  </div>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-ink-2 mb-2.5">Overall Rating</label>
              <div className="flex gap-1.5 items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoveredRating(s)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        s <= (hoveredRating || rating)
                          ? "fill-warning text-warning"
                          : "fill-transparent text-border"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-[13px] text-ink-3">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience working with this person..."
                rows={4}
                className="w-full border-[1.5px] border-border rounded-lg p-3.5 bg-background text-[13.5px] text-ink focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting || !reviewText.trim() || !selectedContract}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 px-6 text-sm font-semibold transition-all hover:shadow-md flex items-center gap-1.5"
            >
              {submitting
                ? "Submitting..."
                : <><Star className="w-3.5 h-3.5 fill-white" /> Submit Review</>}
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-[14px] p-6 mb-5 shadow-sm text-center">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-[14px] font-medium text-ink">No completed contracts yet</p>
            <p className="text-[13px] text-ink-3 mt-1">
              You can leave a review once a contract is marked as completed.
            </p>
          </div>
        )}

        {/* Review History Tabs */}
        <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold transition-colors ${
                activeTab === "received"
                  ? "text-primary border-b-2 border-primary -mb-px bg-primary-bg/40"
                  : "text-ink-3 hover:text-ink hover:bg-background/60"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Received
              {receivedReviews.length > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {receivedReviews.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold transition-colors ${
                activeTab === "sent"
                  ? "text-primary border-b-2 border-primary -mb-px bg-primary-bg/40"
                  : "text-ink-3 hover:text-ink hover:bg-background/60"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Written
              {sentReviews.length > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {sentReviews.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-5">
            {activeTab === "received" && (
              <>
                {receivedLoading ? (
                  <div className="text-center text-ink-3 py-6 animate-pulse text-[13px]">Loading...</div>
                ) : receivedReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">📬</div>
                    <p className="text-[13px] text-ink-3">No reviews received yet.</p>
                    <p className="text-[12px] text-ink-4 mt-1">Complete projects to start getting feedback.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {receivedReviews.map((review, idx) => (
                      <ReviewCard key={review.id || idx} review={review} perspective="received" />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "sent" && (
              <>
                {sentLoading ? (
                  <div className="text-center text-ink-3 py-6 animate-pulse text-[13px]">Loading...</div>
                ) : reviewsError ? (
                  <div className="text-center text-danger py-6 text-[13px]">{reviewsError}</div>
                ) : sentReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">✍️</div>
                    <p className="text-[13px] text-ink-3">No reviews written yet.</p>
                    {completedContracts.length > 0 && (
                      <p className="text-[12px] text-ink-4 mt-1">Use the form above to rate your experience.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {sentReviews.map((review, idx) => (
                      <ReviewCard key={review.id || idx} review={review} perspective="sent" />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
