import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useContracts, useMilestones } from "@/hooks/use-contracts";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import {
  addMilestone, startMilestone, approveMilestone,
  requestMilestoneRevision, submitProgressReport,
  getProgressReports, approveReport, requestReportRevision,
} from "@/api/contracts";
import { uploadReportFile, getFileDownloadUrl, formatFileSize, getFileIcon } from "@/api/files";
import {
  ChevronDown, ChevronUp, Plus, PlayCircle,
  CheckCircle, RotateCcw, FileText, AlertCircle,
  Paperclip, X, Download, XCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Status helpers ────────────────────────────────────────────────────────────
function MilestoneBadge({ status }) {
  const s = (status || "PENDING").toUpperCase();
  const map = {
    APPROVED:           "bg-success-bg text-success-text",
    COMPLETED:          "bg-success-bg text-success-text",
    IN_PROGRESS:        "bg-primary-bg text-primary-dark",
    REVISION_REQUESTED: "bg-warning-bg text-warning-text",
    PENDING:            "bg-background text-ink-3 border border-border",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[s] || map.PENDING}`}>
      {s.replace("_", " ")}
    </span>
  );
}

function ReportStatusBadge({ status }) {
  const s = (status || "PENDING").toUpperCase();
  const map = {
    APPROVED: "bg-success-bg text-success-text",
    REJECTED: "bg-danger-bg text-danger-text",
    REVISION_REQUESTED: "bg-warning-bg text-warning-text",
    PENDING:  "bg-background text-ink-3 border border-border",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[s] || map.PENDING}`}>
      {s.replace("_", " ")}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-primary-bg rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%` }}
      />
    </div>
  );
}

// ── File attachment chip ───────────────────────────────────────────────────────
function FileChip({ file, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-primary-bg border border-primary-light rounded-lg px-2.5 py-1 text-[11px]">
      <span>{getFileIcon(file.name)}</span>
      <span className="text-ink font-medium truncate max-w-[120px]">{file.name}</span>
      <span className="text-ink-3">{formatFileSize(file.size)}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-ink-3 hover:text-danger transition-colors">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Reject Report Modal (client) ──────────────────────────────────────────────
function RejectReportModal({ report, onClose, onRejected }) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleReject() {
    if (!feedback.trim()) { setError("Please provide feedback for the freelancer."); return; }
    setSubmitting(true);
    setError("");
    try {
      await requestReportRevision(report.id, feedback.trim());
      onRejected(report.id, feedback.trim());
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-[15px] font-semibold text-ink mb-1">Reject Report</h3>
        <p className="text-[12px] text-ink-3 mb-4">
          Provide feedback so the freelancer can revise and re-submit.
        </p>
        {error && (
          <p className="text-[12px] text-danger mb-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What needs to be changed or improved?"
          rows={4}
          className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all resize-none mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-border rounded-xl py-2.5 text-[13px] font-medium text-ink-2 hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex-1 bg-danger hover:bg-danger/90 text-white rounded-xl py-2.5 text-[13px] font-semibold transition-all disabled:opacity-50"
          >
            {submitting ? "Rejecting…" : "Reject & Send Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Progress Reports panel ────────────────────────────────────────────────────
function ReportsPanel({ milestoneId, isFreelancer, contractId, onRefresh }) {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [pct, setPct]               = useState(50);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const fileInputRef = useRef(null);

  function loadReports() {
    setLoading(true);
    getProgressReports(milestoneId)
      .then((r) => setReports(Array.isArray(r) ? r : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadReports(); }, [milestoneId]);

  // Show the submit form automatically if the freelancer has a rejected/revision report
  useEffect(() => {
    if (isFreelancer && reports.length > 0) {
      const latestStatus = (reports[0]?.status || "").toUpperCase();
      if (latestStatus === "REJECTED" || latestStatus === "REVISION_REQUESTED") {
        setShowForm(true);
      }
    }
  }, [reports, isFreelancer]);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 20 * 1024 * 1024);
    if (valid.length < files.length) {
      setError("Some files were skipped (max 20 MB each).");
    }
    setAttachedFiles((prev) => [...prev, ...valid].slice(0, 5)); // max 5 files
    e.target.value = "";
  }

  async function submitReport() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      // Upload files first
      const attachmentUrls = [];
      if (attachedFiles.length > 0) {
        setUploading(true);
        for (const file of attachedFiles) {
          try {
            const result = await uploadReportFile(file, contractId, milestoneId);
            if (result?.fileId || result?.id || result?.url) {
              attachmentUrls.push(result.url || result.fileId || result.id);
            }
          } catch (uploadErr) {
            console.warn("File upload failed:", uploadErr);
          }
        }
        setUploading(false);
      }

      const report = await submitProgressReport(milestoneId, {
        title: title.trim(),
        description: desc.trim(),
        percentageComplete: pct,
        attachmentUrls,
      });
      setReports((prev) => [report, ...prev]);
      setTitle(""); setDesc(""); setPct(50); setAttachedFiles([]); setShowForm(false);
      onRefresh();
    } catch (e) {
      setError(e.message);
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveReport(reportId) {
    try {
      await approveReport(reportId);
      setReports((prev) =>
        prev.map((r) => r.id === reportId ? { ...r, status: "APPROVED" } : r)
      );
      onRefresh();
    } catch (e) { alert(e.message); }
  }

  function handleRejected(reportId, feedback) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: "REJECTED", clientFeedback: feedback } : r
      )
    );
    onRefresh();
  }

  const latestStatus = (reports[0]?.status || "").toUpperCase();
  const canSubmitNew = isFreelancer && (
    reports.length === 0 ||
    latestStatus === "REJECTED" ||
    latestStatus === "REVISION_REQUESTED"
  );

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      {rejectTarget && (
        <RejectReportModal
          report={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={handleRejected}
        />
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-ink-2 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" /> Progress Reports ({reports.length})
        </span>
        {canSubmitNew && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[12px] text-primary font-semibold hover:underline"
          >
            {showForm ? "Cancel" : latestStatus === "REJECTED" || latestStatus === "REVISION_REQUESTED" ? "↩ Re-submit Report" : "+ Submit Report"}
          </button>
        )}
      </div>

      {/* Rejection notice for freelancer */}
      {isFreelancer && (latestStatus === "REJECTED" || latestStatus === "REVISION_REQUESTED") && (
        <div className="bg-danger-bg border border-danger/30 rounded-xl p-3 mb-3">
          <p className="text-[12px] font-semibold text-danger-text flex items-center gap-1.5 mb-1">
            <XCircle className="w-3.5 h-3.5" />
            {latestStatus === "REJECTED" ? "Report Rejected" : "Revision Requested"}
          </p>
          {reports[0]?.clientFeedback && (
            <p className="text-[12px] text-ink-2 italic">"{reports[0].clientFeedback}"</p>
          )}
          <p className="text-[11px] text-ink-3 mt-1">Please address the feedback and submit a new report.</p>
        </div>
      )}

      {/* Submit form */}
      {canSubmitNew && showForm && (
        <div className="bg-background border border-border rounded-xl p-4 mb-3 flex flex-col gap-3">
          {error && (
            <p className="text-[12px] text-danger flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Report title (e.g. 'Week 1 complete')"
            className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe what you completed..."
            rows={3}
            className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all resize-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ink-2 font-medium whitespace-nowrap">Completion:</span>
            <input
              type="range" min={0} max={100} step={5} value={pct}
              onChange={(e) => setPct(+e.target.value)}
              className="flex-1 accent-primary"
            />
            <span className="text-[13px] font-bold text-ink min-w-[38px]">{pct}%</span>
          </div>
          <ProgressBar pct={pct} />

          {/* File attachment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-[12px] text-ink-2 hover:border-primary hover:text-primary hover:bg-primary-bg transition-all"
              >
                <Paperclip className="w-3.5 h-3.5" /> Attach Files
              </button>
              <span className="text-[11px] text-ink-3">Max 5 files · 20 MB each</span>
            </div>
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((f, i) => (
                  <FileChip
                    key={i}
                    file={f}
                    onRemove={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={submitReport}
            disabled={submitting || uploading}
            className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-50 self-start"
          >
            {uploading ? "Uploading files…" : submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <p className="text-[12px] text-ink-3 animate-pulse">Loading reports…</p>
      ) : reports.length === 0 ? (
        <p className="text-[12px] text-ink-3">No reports yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((r) => {
            const rStatus = (r.status || "PENDING").toUpperCase();
            const isApproved = rStatus === "APPROVED";
            const isRejected = rStatus === "REJECTED" || rStatus === "REVISION_REQUESTED";

            return (
              <div
                key={r.id}
                className={`bg-background border rounded-lg p-3 ${
                  isRejected ? "border-danger/40" : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold text-ink">{r.title}</span>
                  <div className="flex items-center gap-2">
                    {r.percentageComplete != null && (
                      <span className="text-[11px] font-bold text-primary">{r.percentageComplete}%</span>
                    )}
                    <ReportStatusBadge status={r.status} />
                  </div>
                </div>

                {r.description && (
                  <p className="text-[12px] text-ink-3 leading-relaxed">{r.description}</p>
                )}
                {r.percentageComplete != null && (
                  <div className="mt-2"><ProgressBar pct={r.percentageComplete} /></div>
                )}

                {/* Attachments */}
                {r.attachmentUrls?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.attachmentUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-surface border border-border rounded px-2 py-0.5 text-[11px] text-ink-2 hover:text-primary hover:border-primary transition-colors"
                      >
                        <Download className="w-3 h-3" /> Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {r.clientFeedback && (
                  <div className={`mt-2 p-2 rounded-lg text-[12px] italic ${
                    isRejected ? "bg-danger-bg text-danger-text" : "bg-warning-bg text-warning-text"
                  }`}>
                    <span className="font-semibold">Client feedback: </span>
                    {r.clientFeedback}
                  </div>
                )}

                {/* Client actions */}
                {!isFreelancer && !isApproved && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleApproveReport(r.id)}
                      className="flex items-center gap-1 bg-success hover:bg-success/90 text-white rounded-lg px-3 py-1 text-[12px] font-semibold transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    {!isRejected && (
                      <button
                        onClick={() => setRejectTarget(r)}
                        className="flex items-center gap-1 bg-danger hover:bg-danger/90 text-white rounded-lg px-3 py-1 text-[12px] font-semibold transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Single milestone card ─────────────────────────────────────────────────────
function MilestoneCard({ milestone, isFreelancer, onAction, contractId }) {
  const [showReports, setShowReports] = useState(false);
  const [acting, setActing]           = useState(false);

  const s = (milestone.status || "PENDING").toUpperCase();
  const canStart   = isFreelancer && s === "PENDING";
  const canApprove = !isFreelancer && s === "IN_PROGRESS";
  const canRevise  = !isFreelancer && s === "IN_PROGRESS";
  const showReportBtn = isFreelancer && s === "IN_PROGRESS";

  async function act(fn) {
    setActing(true);
    try { await fn(); onAction(); } catch (e) { alert(e.message); }
    finally { setActing(false); }
  }

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-ink">{milestone.title}</span>
            <MilestoneBadge status={milestone.status} />
          </div>
          {milestone.description && (
            <p className="text-xs text-ink-3 mt-1 line-clamp-2">{milestone.description}</p>
          )}
          {milestone.amount > 0 && (
            <p className="text-xs text-primary-dark font-semibold mt-1">{formatCurrency(milestone.amount)}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {canStart && (
            <button
              onClick={() => act(() => startMilestone(milestone.id))}
              disabled={acting}
              className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Start Work
            </button>
          )}
          {showReportBtn && (
            <button
              onClick={() => setShowReports(!showReports)}
              className="flex items-center gap-1 border border-primary text-primary bg-primary-bg hover:bg-primary/10 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              {showReports ? "Hide Reports" : "Progress Reports"}
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => act(() => approveMilestone(milestone.id))}
              disabled={acting}
              className="flex items-center gap-1 bg-success hover:bg-success/90 text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
          )}
          {canRevise && (
            <button
              onClick={() => act(() => requestMilestoneRevision(milestone.id))}
              disabled={acting}
              className="flex items-center gap-1 border border-warning text-warning-text bg-warning-bg rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request Revision
            </button>
          )}
          {/* Client: view reports on any milestone */}
          {!isFreelancer && (
            <button
              onClick={() => setShowReports(!showReports)}
              className="flex items-center gap-1 border border-border text-ink-2 hover:bg-surface rounded-lg px-3 py-1.5 text-[12px] transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              {showReports ? "Hide" : "Reports"}
            </button>
          )}
        </div>
      </div>

      {showReports && (
        <div className="px-4 pb-4">
          <ReportsPanel
            milestoneId={milestone.id}
            isFreelancer={isFreelancer}
            contractId={contractId}
            onRefresh={onAction}
          />
        </div>
      )}
    </div>
  );
}

// ── Add milestone form (client only) ─────────────────────────────────────────
function AddMilestoneForm({ contractId, onAdded }) {
  const [show, setShow]     = useState(false);
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [amount, setAmount] = useState("");
  const [order, setOrder]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function handleAdd() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      await addMilestone(contractId, {
        title: title.trim(),
        description: desc.trim(),
        amount: amount ? Number(amount) : null,
        sequenceOrder: order,
      });
      setTitle(""); setDesc(""); setAmount(""); setOrder(1); setShow(false);
      onAdded();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full border-2 border-dashed border-border rounded-xl py-3 flex items-center justify-center gap-2 text-[13px] text-ink-3 hover:border-primary-light hover:text-primary hover:bg-primary-bg transition-all"
      >
        <Plus className="w-4 h-4" /> Add Milestone
      </button>
    );
  }

  return (
    <div className="border border-primary-light bg-primary-bg rounded-xl p-4 flex flex-col gap-3">
      <h4 className="text-[13px] font-semibold text-ink">New Milestone</h4>
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title *"
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all col-span-2" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)"
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all col-span-2" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Payment amount ($)"
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all" />
        <input type="number" value={order} onChange={(e) => setOrder(+e.target.value)} placeholder="Sequence order" min={1}
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={saving}
          className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-50">
          {saving ? "Adding…" : "Add Milestone"}
        </button>
        <button onClick={() => setShow(false)}
          className="border border-border rounded-lg px-4 py-2 text-[12px] text-ink-3 hover:bg-surface transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Contract card ─────────────────────────────────────────────────────────────
function ContractCard({ contract, isFreelancer }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const { data: milestones = [], isLoading: mlLoading, refetch } =
    useMilestones(contract.id);

  const totalMilestones = milestones.length;
  const doneMilestones  = milestones.filter((m) =>
    ["APPROVED", "COMPLETED"].includes((m.status || "").toUpperCase())
  ).length;
  const overallPct = totalMilestones > 0
    ? Math.round((doneMilestones / totalMilestones) * 100)
    : 0;

  const statusColor =
    (contract.status || "").toUpperCase() === "ACTIVE"
      ? "bg-success-bg text-success-text"
      : "bg-background text-ink-3 border border-border";

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-start justify-between hover:bg-background/40 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-display text-[15px] font-semibold text-ink">
              {contract.jobTitle || `Contract #${contract.id?.slice(0, 8)}`}
            </h2>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
              {contract.status || "ACTIVE"}
            </span>
          </div>
          <div className="text-xs text-ink-3 mb-2">
            {isFreelancer
              ? `Client: ${contract.clientName || "—"}`
              : `Freelancer: ${contract.freelancerName || "—"}`}
            {contract.agreedAmount != null && ` · ${formatCurrency(contract.agreedAmount)}`}
          </div>

          {totalMilestones > 0 && (
            <div className="max-w-xs">
              <div className="flex justify-between text-[11px] text-ink-3 mb-1">
                <span>{doneMilestones}/{totalMilestones} milestones done</span>
                <span className="font-semibold text-primary">{overallPct}%</span>
              </div>
              <ProgressBar pct={overallPct} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3 mt-1">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-ink-3" />
            : <ChevronDown className="w-4 h-4 text-ink-3" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-5">
          {contract.terms && (
            <p className="text-[12.5px] text-ink-3 italic mb-4 border-l-2 border-primary-light pl-3">
              {contract.terms}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-ink">Milestones</h3>
            {!isFreelancer && milestones.length === 0 && (
              <p className="text-[12px] text-ink-3">Add milestones to track progress</p>
            )}
          </div>

          {mlLoading ? (
            <div className="text-center text-xs text-ink-3 py-6 animate-pulse">Loading milestones…</div>
          ) : (
            <div className="flex flex-col gap-3 mb-4">
              {milestones.length === 0 ? (
                <p className="text-[13px] text-ink-3 text-center py-4">
                  {isFreelancer
                    ? "No milestones yet — waiting for client to add them."
                    : "No milestones defined yet."}
                </p>
              ) : (
                milestones
                  .slice()
                  .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
                  .map((m) => (
                    <MilestoneCard
                      key={m.id}
                      milestone={m}
                      isFreelancer={isFreelancer}
                      contractId={contract.id}
                      onAction={refetch}
                    />
                  ))
              )}

              {!isFreelancer && (
                <AddMilestoneForm contractId={contract.id} onAdded={refetch} />
              )}
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              onClick={() => navigate("/reviews")}
              className="border border-warning bg-warning-bg text-warning-text rounded-lg px-4 py-2 text-[12.5px] font-semibold flex items-center gap-1.5 hover:bg-warning-bg/70 transition-colors"
            >
              ⭐ Leave Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectTracking() {
  const { data: contracts = [], isLoading, error } = useContracts();
  const { currentRole } = useAppStore();
  const navigate = useNavigate();
  const isFreelancer = currentRole === "freelancer";

  if (isLoading) {
    return (
      <DashboardLayout title="Project Tracking">
        <div className="text-center text-ink-3 py-12 animate-pulse">Loading contracts…</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Project Tracking">
        <div className="text-center text-danger py-12">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Project Tracking">
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="font-display text-[18px] font-bold text-ink mb-2">No contracts yet</h2>
          <p className="text-[13px] text-ink-3 max-w-sm">
            {isFreelancer
              ? "Once a client accepts your bid, your contract will appear here."
              : "Accept a freelancer's bid to create a contract and start tracking progress."}
          </p>
          <button
            onClick={() => navigate(isFreelancer ? "/projects" : "/bids")}
            className="mt-5 bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 px-6 text-[13px] font-semibold transition-all hover:shadow-md"
          >
            {isFreelancer ? "Browse Projects" : "View Bids"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-[13px] text-ink-3">{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</p>
          {contracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} isFreelancer={isFreelancer} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}