import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useProject } from "@/hooks/use-projects";
import { submitBid } from "@/hooks/use-bids";
import { SkillTag } from "@/components/ui/skill-tag";
import { formatCurrency } from "@/lib/utils";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function SubmitProposal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");
  const { data: project, isLoading } = useProject(projectId);
  const { user } = useAppStore();

  const [amount, setAmount] = useState("1500");
  const [days, setDays] = useState("14");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!coverLetter.trim() || !project) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await submitBid(project.id, {
        amount: Number(amount),
        deliveryDays: Number(days),
        coverLetter: coverLetter.trim(),
      });
      navigate("/bids");
    } catch (err) {
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Submit Proposal">
      <div className="max-w-[680px] mx-auto py-2">
        {isLoading ? (
          <div className="bg-primary-bg border border-primary-light rounded-xl p-4 mb-5 animate-pulse text-primary-dark text-sm">
            Loading project details...
          </div>
        ) : project ? (
          <div className="bg-primary-bg border border-primary-light rounded-xl p-4 mb-5">
            <h2 className="text-sm font-semibold text-primary-darker mb-1">{project.title}</h2>
            <div className="text-[13px] text-primary-dark">
              {project.clientName && `${project.clientName} · `}
              {project.budgetMin != null && `Budget: ${formatCurrency(project.budgetMin)} – ${formatCurrency(project.budgetMax)}`}
              {project.budgetType && ` · ${project.budgetType}`}
              {project.deadline && ` · Due ${project.deadline}`}
            </div>
            <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">{project.description}</p>
            {project.skills && project.skills.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {project.skills.map((s) => <SkillTag key={s}>{s}</SkillTag>)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-danger-bg border border-danger rounded-xl p-4 mb-5 text-danger-text text-sm">
            Project not found.
          </div>
        )}

        {submitError && (
          <div className="mb-4 bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px] font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[14px] p-6 shadow-sm flex flex-col gap-5">
          <h2 className="font-display text-[17px] font-semibold text-ink">Your Proposal</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Bid Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Delivery (Days)</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-2">Cover Letter *</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
              placeholder="Describe why you're the best fit for this project..."
              rows={5}
              className="w-full border-[1.5px] border-border rounded-lg p-3.5 bg-background text-[13.5px] text-ink focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !coverLetter.trim() || !project}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl py-3 px-6 text-sm font-semibold transition-all hover:shadow-md flex items-center gap-1.5 w-full sm:w-auto"
          >
            {isSubmitting ? "Submitting..." : <><CheckCircle className="w-4 h-4" /> Submit Proposal</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
