import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useProjects } from "@/hooks/use-projects";
import { updateProjectProgress } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import { MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = ["Brief", "Design", "Development", "Review", "Delivered"];

function getStepState(progress, stepIndex) {
  const stepProgress = ((stepIndex + 1) / STEPS.length) * 100;
  if (progress >= stepProgress) return "completed";
  if (progress >= (stepIndex / STEPS.length) * 100) return "current";
  return "pending";
}

export default function ProjectTracking() {
  const { data: projects = [], isLoading } = useProjects();
  const navigate = useNavigate();
  const [progressDialog, setProgressDialog] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
  const [localProgress, setLocalProgress] = useState({});

  async function handleUpdateProgress(projectId) {
    await updateProjectProgress(projectId, newProgress);
    setLocalProgress((prev) => ({ ...prev, [projectId]: newProgress }));
    setProgressDialog(null);
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Project Tracking">
        <div className="text-center text-ink-3 py-12 animate-pulse">Loading projects...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Project Tracking">
      <div className="flex flex-col gap-5">
        {projects.map((project) => {
          const progress = localProgress[project.id] ?? project.progress;
          const isCompleted = project.status === "Completed" || progress === 100;

          return (
            <div key={project.id} className="bg-surface border border-border rounded-[14px] p-6 shadow-sm">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-[15px] font-semibold text-ink">{project.title}</h2>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isCompleted
                          ? "bg-success-bg text-success-text"
                          : "bg-primary-bg text-primary-dark"
                      }`}
                    >
                      {isCompleted ? "Completed" : "Active"}
                    </span>
                  </div>
                  <div className="text-[13px] text-ink-3">{project.clientName} · Due {project.deadline}</div>
                </div>
                <div className="text-[13px] font-semibold text-ink">
                  {formatCurrency(project.budgetMin)}–{formatCurrency(project.budgetMax)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-ink-3 mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold text-ink">{progress}%</span>
                </div>
                <div className="bg-primary-bg rounded-full h-2 w-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Milestone steps */}
              <div className="flex items-start gap-0 mb-5 overflow-x-auto">
                {STEPS.map((step, i) => {
                  const state = getStepState(progress, i);
                  const isLast = i === STEPS.length - 1;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 relative min-w-[60px]">
                      {!isLast && (
                        <div
                          className={`absolute top-3.5 left-1/2 w-full h-0.5 z-0 ${
                            state === "completed" ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs z-10 relative transition-all ${
                          state === "completed"
                            ? "bg-primary border-2 border-primary text-white font-bold"
                            : state === "current"
                            ? "bg-surface border-[2.5px] border-primary text-primary font-bold shadow-sm"
                            : "bg-surface border-2 border-border text-ink-4"
                        }`}
                      >
                        {state === "completed" ? "✓" : i + 1}
                      </div>
                      <div
                        className={`text-[11px] mt-1.5 whitespace-nowrap ${
                          state === "completed"
                            ? "text-primary-dark font-medium"
                            : state === "current"
                            ? "text-primary font-semibold"
                            : "text-ink-4"
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/messages")}
                  className="border-[1.5px] border-border-2 rounded-lg px-4 py-2 text-[12.5px] font-medium text-ink-2 flex items-center gap-1.5 hover:bg-background transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>

                {isCompleted ? (
                  <button
                    onClick={() => navigate("/reviews")}
                    className="border-[1.5px] border-warning bg-warning-bg hover:bg-warning-bg/70 text-warning-text rounded-lg py-2 px-4 text-[12.5px] font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-warning text-warning" /> Leave Review
                  </button>
                ) : (
                  <button
                    onClick={() => { setProgressDialog(project.id); setNewProgress(progress); }}
                    className="bg-primary hover:bg-primary-dark text-white rounded-lg py-2 px-4 text-[12.5px] font-semibold transition-all hover:shadow-md"
                  >
                    Update Progress
                  </button>
                )}
              </div>

              {/* Progress update dialog */}
              {progressDialog === project.id && (
                <div className="mt-4 p-4 bg-background border border-border rounded-xl">
                  <h4 className="text-[13px] font-semibold text-ink mb-3">Update Progress</h4>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={newProgress}
                      onChange={(e) => setNewProgress(parseInt(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-[14px] font-bold text-ink min-w-[40px]">{newProgress}%</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleUpdateProgress(project.id)}
                      className="bg-primary hover:bg-primary-dark text-white rounded-lg py-2 px-4 text-[12.5px] font-semibold transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setProgressDialog(null)}
                      className="border border-border rounded-lg py-2 px-4 text-[12.5px] text-ink-3 hover:bg-background transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
