import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Star, Check, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { submitReview, getFreelancerReviews, getClientReviews } from "@/api/reviews";
import { useContracts } from "@/hooks/use-contracts";

const DEFAULT_TAGS = ["On time", "Great communication", "Quality work", "Would rehire"];

export default function Reviews() {
  const { user, notify, currentRole } = useAppStore();
  const { data: contracts = [] } = useContracts();
  const isClient = currentRole === "client";

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [rating, setRating] = useState(4);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [availableTags, setAvailableTags] = useState([...DEFAULT_TAGS]);
  const [selectedTags, setSelectedTags] = useState(new Set(["On time", "Great communication"]));
  const [newTag, setNewTag] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [expandedReview, setExpandedReview] = useState(null);

  useEffect(() => {
    setReviewsLoading(true);
    setReviewsError("");
    const fetchFn = isClient ? getFreelancerReviews : getClientReviews;
    fetchFn()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.reviews ?? result?.content ?? [];
        setReviews(list);
      })
      .catch((err) => setReviewsError(err.message))
      .finally(() => setReviewsLoading(false));
  }, [isClient]);

  const completedContracts = contracts.filter((c) => c.status === "Completed" || c.status === "completed");

  function toggleTag(tag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function addTag() {
    const t = newTag.trim();
    if (!t) return;
    setAvailableTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setSelectedTags((prev) => new Set([...prev, t]));
    setNewTag("");
  }

  async function handleSubmitReview() {
    if (!reviewText.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const contract = completedContracts.find((c) => c.id === selectedContractId) || completedContracts[0];
      const reviewData = {
        contractId: contract?.id,
        rating,
        text: reviewText.trim(),
        tags: [...selectedTags],
      };
      const result = await submitReview(reviewData);

      const newReview = {
        id: result?.id || Date.now(),
        name: contract?.freelancerName || contract?.clientName || "Unknown",
        project: contract?.title || contract?.jobTitle || "Contract",
        rating,
        text: reviewText.trim(),
        fullText: reviewText.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        tags: [...selectedTags],
      };
      setReviews((prev) => [newReview, ...prev]);
      setSubmitted(true);
      notify({ type: "review", title: "Review submitted", message: "Your review was posted.", href: "/reviews" });

      setRating(4);
      setReviewText("");
      setSelectedTags(new Set(["On time", "Great communication"]));
      setNewTag("");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const reviewTarget = completedContracts.find((c) => c.id === selectedContractId) || completedContracts[0];

  return (
    <DashboardLayout title="Reviews & Ratings">
      <div className="max-w-[680px] mx-auto py-2">
        {submitted && (
          <div className="mb-4 bg-success-bg border border-success/30 rounded-xl px-4 py-3 flex items-center gap-2 text-success-text text-[13px] font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Review submitted! It now appears in your review history below.
          </div>
        )}

        {submitError && (
          <div className="mb-4 bg-danger-bg border border-danger/30 rounded-xl px-4 py-3 text-danger-text text-[13px] font-medium">
            {submitError}
          </div>
        )}

        {completedContracts.length > 0 && (
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
                      {c.title || c.jobTitle || c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reviewTarget && (
              <div className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-xl mb-6">
                <div className="w-[52px] h-[52px] rounded-full bg-primary-light flex items-center justify-center text-lg font-bold text-primary-darker shrink-0">
                  {(reviewTarget.freelancerName || reviewTarget.clientName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-ink">
                    {reviewTarget.freelancerName || reviewTarget.clientName || "Unknown"}
                  </div>
                  <div className="text-[13px] text-ink-3 mt-0.5">
                    {reviewTarget.title || reviewTarget.jobTitle || "Contract"} · Completed
                  </div>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-ink-2 mb-2.5">Overall Rating</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoveredRating(s)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${s} stars`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        s <= (hoveredRating || rating) ? "fill-warning text-warning" : "fill-transparent text-border"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-[13px] text-ink-3 self-center">
                  {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
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

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-ink-2 mb-2.5">Quick Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map((tag) => {
                  const checked = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                        checked
                          ? "bg-primary-bg border border-primary-light text-primary-dark"
                          : "bg-background border border-border text-ink-3 hover:bg-background/60"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${checked ? "bg-primary" : "bg-border"}`}>
                        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder='Add a tag (e.g. "Helpful")'
                  className="flex-1 border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="border border-border rounded-lg px-4 py-2.5 text-[13px] font-semibold text-ink-2 hover:bg-background transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting || !reviewText.trim()}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 px-6 text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-1.5 w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : <><Star className="w-3.5 h-3.5 fill-white" /> Submit Review</>}
            </button>
          </div>
        )}

        <div className="bg-surface border border-border rounded-[14px] p-6 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-ink mb-4">
            Review History <span className="text-ink-4 font-normal text-sm">({reviews.length})</span>
          </h2>

          {reviewsLoading ? (
            <div className="text-center text-ink-3 py-6 animate-pulse text-[13px]">Loading reviews...</div>
          ) : reviewsError ? (
            <div className="text-center text-danger py-6 text-[13px]">{reviewsError}</div>
          ) : reviews.length === 0 ? (
            <p className="text-[13px] text-ink-3">No reviews yet. {completedContracts.length > 0 ? "Submit one above!" : ""}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-background border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-[11px] font-bold text-primary-darker">
                      {(review.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-ink">{review.name || "Unknown"}</div>
                      <div className="text-[11px] text-ink-3">
                        {review.project || review.contractTitle || ""}{review.date ? ` · ${review.date}` : review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                      </div>
                    </div>
                    <div className="flex text-warning text-[13px] tracking-tighter">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="text-[12.5px] text-ink-2 leading-relaxed">
                    {expandedReview === review.id ? (review.fullText || review.text) : review.text}
                  </p>
                  {review.fullText && review.fullText !== review.text && (
                    <button
                      onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                      className="text-[12px] text-primary font-medium mt-2 hover:underline"
                    >
                      {expandedReview === review.id ? "Show less" : "Read full review"}
                    </button>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {review.tags.map((tag) => (
                        <span key={tag} className="bg-primary-bg text-primary-dark text-[11px] px-2 py-0.5 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
