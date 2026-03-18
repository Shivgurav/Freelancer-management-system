import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { createProject } from "@/hooks/use-projects";
import { SkillTag } from "@/components/ui/skill-tag";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

export default function PostProject() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("1200");
  const [budgetMax, setBudgetMax] = useState("2500");
  const [deadline, setDeadline] = useState("");
  const [budgetType, setBudgetType] = useState("Fixed Price");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function addSkill() {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await createProject({
        title: title.trim(),
        description: description.trim() || "No description provided.",
        skills,
        budgetMin: Number(budgetMin) || 0,
        budgetMax: Number(budgetMax) || 0,
        budgetType,
        deadline: deadline || undefined,
      });
      navigate("/tracking");
    } catch (err) {
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Post a Project">
      <div className="max-w-[720px] mx-auto py-2">
        <div className="mb-6">
          <h1 className="font-display text-xl font-bold text-ink">Describe your project</h1>
          <p className="text-[13px] text-ink-3 mt-1">Fill in the details to attract the best freelancers.</p>
        </div>

        {submitError && (
          <div className="mb-4 bg-danger-bg border border-danger/30 text-danger-text rounded-xl px-4 py-3 text-[13px] font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[14px] p-6 shadow-sm flex flex-col gap-5">
          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-2">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. E-Commerce Platform Redesign"
              className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project requirements, goals, and deliverables..."
              rows={4}
              className="w-full border-[1.5px] border-border rounded-lg p-3.5 bg-background text-[13.5px] text-ink focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Min Budget ($)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Max Budget ($)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Budget Type</label>
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all"
              >
                <option>Fixed Price</option>
                <option>Hourly Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-2">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border-[1.5px] border-border rounded-lg px-3.5 py-2.5 text-[13.5px] text-ink bg-background focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-2">Required Skills</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {skills.map((skill) => (
                <SkillTag key={skill} onRemove={() => setSkills(skills.filter((s) => s !== skill))}>
                  {skill}
                </SkillTag>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="flex-1 border-[1.5px] border-border rounded-lg px-3.5 py-2 text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={addSkill}
                className="border border-border rounded-lg px-3 py-2 text-ink-3 hover:text-ink hover:bg-background transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl py-3 px-6 text-sm font-semibold transition-all hover:shadow-md flex items-center gap-2 w-full sm:w-auto"
          >
            {isSubmitting ? "Posting..." : <><CheckCircle className="w-4 h-4" /> Post Project</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
