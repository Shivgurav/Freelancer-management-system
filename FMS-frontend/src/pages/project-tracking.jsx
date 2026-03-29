import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useContracts, useMilestones } from "@/hooks/use-contracts";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import {
  addMilestone, startMilestone, approveMilestone,
  requestMilestoneRevision, submitProgressReport,
  getProgressReports, approveReport, requestReportRevision,
} from "@/api/contracts";
import { uploadReportFile, downloadFile, formatFileSize, getFileIcon } from "@/api/files";
import {
  ChevronDown, ChevronUp, Plus, PlayCircle,
  CheckCircle, RotateCcw, FileText, AlertCircle,
  Paperclip, X, Download, XCircle, PlusCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${map[s] || map.PENDING}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

function ReportStatusBadge({ status }) {
  const s = (status || "PENDING").toUpperCase();
  const map = {
    APPROVED:           "bg-success-bg text-success-text",
    REJECTED:           "bg-danger-bg text-danger-text",
    REVISION_REQUESTED: "bg-warning-bg text-warning-text",
    PENDING:            "bg-background text-ink-3 border border-border",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${map[s] || map.PENDING}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

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

function FileChip({ file, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-primary-bg border border-primary-light rounded-lg px-2.5 py-1 text-[11px]">
      <span>{getFileIcon(file.name)}</span>
      <span className="text-ink font-medium truncate max-w-[100px] sm:max-w-[120px]">{file.name}</span>
      <span className="text-ink-3 hidden sm:inline">{formatFileSize(file.size)}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-ink-3 hover:text-danger transition-colors ml-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Reject / revision modal (client) ─────────────────────────────────────────
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
      <div className="bg-background border border-border rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-xl">
        <h3 className="text-[15px] font-semibold text-ink mb-1">Request Revision</h3>
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
            {submitting ? "Sending…" : "Request Revision"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Submit report form (freelancer) ───────────────────────────────────────────
function SubmitReportForm({ milestoneId, contractId, onSubmitted, onCancel, isResubmit }) {
  const [title, setTitle]                 = useState("");
  const [desc, setDesc]                   = useState("");
  const [pct, setPct]                     = useState(50);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");
  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 20 * 1024 * 1024);
    if (valid.length < files.length) setError("Some files skipped (max 20 MB each).");
    setAttachedFiles((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = "";
  }

  async function submitReport() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    setError("");
    const attachmentUrls = [];

    if (attachedFiles.length > 0) {
      setUploading(true);
      for (const file of attachedFiles) {
        try {
          const result = await uploadReportFile(file, contractId, milestoneId);
          const fileId = result?.fileId || result?.id;
          if (fileId) attachmentUrls.push(fileId);
        } catch (uploadErr) {
          console.warn("File upload failed:", uploadErr);
        }
      }
      setUploading(false);
    }

    try {
      const report = await submitProgressReport(milestoneId, {
        title: title.trim(),
        description: desc.trim(),
        percentageComplete: pct,
        attachmentUrls,
      });
      onSubmitted(report);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <div className="bg-background border border-primary-light rounded-xl p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-ink">
          {isResubmit ? "↩ Submit Revised Report" : "New Progress Report"}
        </h4>
        {onCancel && (
          <button onClick={onCancel} className="text-ink-3 hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-danger flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Report title *"
        className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all w-full"
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Describe what you completed..."
        rows={3}
        className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all resize-none w-full"
      />

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[12px] text-ink-2 font-medium whitespace-nowrap">Completion:</span>
        <input
          type="range" min={0} max={100} step={5} value={pct}
          onChange={(e) => setPct(+e.target.value)}
          className="flex-1 accent-primary h-2"
        />
        <span className="text-[13px] font-bold text-ink min-w-[38px] text-right">{pct}%</span>
      </div>
      <ProgressBar pct={pct} />

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
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
          <span className="text-[11px] text-ink-3">Max 5 · 20 MB each</span>
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

      <div className="flex gap-2">
        <button
          onClick={submitReport}
          disabled={submitting || uploading}
          className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {uploading ? "Uploading…" : submitting ? "Submitting…" : (
            <><CheckCircle className="w-3.5 h-3.5" /> Submit Report</>
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="border border-border rounded-lg px-4 py-2 text-[12px] text-ink-3 hover:bg-surface transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── Single report card ────────────────────────────────────────────────────────
function ReportCard({ report, isFreelancer, onApprove, onRequestRevision }) {
  const rStatus = (report.status || "PENDING").toUpperCase();
  const isApproved = rStatus === "APPROVED";
  const isRevision = rStatus === "REJECTED" || rStatus === "REVISION_REQUESTED";

  return (
    <div className={`bg-background border rounded-xl p-3 sm:p-4 ${isRevision ? "border-danger/40" : "border-border/60"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-[13px] font-semibold text-ink">{report.title}</span>
        <div className="flex items-center gap-2">
          {report.percentageComplete != null && (
            <span className="text-[11px] font-bold text-primary">{report.percentageComplete}%</span>
          )}
          <ReportStatusBadge status={report.status} />
        </div>
      </div>

      {report.description && (
        <p className="text-[12px] text-ink-3 leading-relaxed mb-2">{report.description}</p>
      )}
      {report.percentageComplete != null && (
        <div className="mb-2"><ProgressBar pct={report.percentageComplete} /></div>
      )}

      {report.attachmentUrls?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {report.attachmentUrls.map((fileId, i) => (
            <button
              key={i}
              onClick={() => downloadFile(fileId, `attachment-${i + 1}`)}
              className="inline-flex items-center gap-1 bg-surface border border-border rounded px-2 py-0.5 text-[11px] text-ink-2 hover:text-primary hover:border-primary transition-colors"
            >
              <Download className="w-3 h-3" /> Attachment {i + 1}
            </button>
          ))}
        </div>
      )}

      {report.clientFeedback && (
        <div className={`p-2 rounded-lg text-[12px] italic mb-2 ${isRevision ? "bg-danger-bg text-danger-text" : "bg-warning-bg text-warning-text"}`}>
          <span className="font-semibold not-italic">Client feedback: </span>
          {report.clientFeedback}
        </div>
      )}

      {/* Client actions — only on non-approved reports that aren't already rejected */}
      {!isFreelancer && !isApproved && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <button
            onClick={() => onApprove(report.id)}
            className="flex items-center gap-1 bg-success hover:bg-success/90 text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          {/* Only show "Request Revision" if not already in revision state */}
          {!isRevision && (
            <button
              onClick={() => onRequestRevision(report)}
              className="flex items-center gap-1 bg-warning hover:bg-warning/90 text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request Revision
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reports Panel ─────────────────────────────────────────────────────────────
// KEY INSIGHT: The client and freelancer are in SEPARATE browser sessions.
// Any state change the client makes is NOT automatically visible to the freelancer.
// The freelancer must re-fetch from the server to see the updated report status.
// We solve this by: (a) always re-fetching from server after any action,
// (b) polling every 8 seconds on the freelancer side, (c) exposing a manual Refresh button.
function ReportsPanel({ milestoneId, isFreelancer, contractId, onRefresh }) {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);

  // Track previous status to detect changes during polling
  const prevStatusRef = useRef("");

  // Fetch reports from the server (single source of truth)
  async function fetchReports(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await getProgressReports(milestoneId);
      const list = Array.isArray(r) ? r : [];
      setReports(list);
      return list;
    } catch {
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Load on mount
  useEffect(() => {
    fetchReports(false).then((list) => {
      // If already in revision state when panel opens, show form immediately
      if (isFreelancer && list.length > 0) {
        const s = (list[0]?.status || "").toUpperCase();
        if (s === "REVISION_REQUESTED" || s === "REJECTED") {
          prevStatusRef.current = s;
          setShowForm(true);
        }
      }
    });
  }, [milestoneId]);

  // Poll every 8 seconds on the freelancer side to catch client-side changes
  useEffect(() => {
    if (!isFreelancer) return;
    const id = setInterval(async () => {
      const list = await fetchReports(true);
      if (list.length > 0) {
        const s = (list[0]?.status || "").toUpperCase();
        const isRevision = s === "REVISION_REQUESTED" || s === "REJECTED";
        // New revision arrived since last poll → open form
        if (isRevision && prevStatusRef.current !== s) {
          setShowForm(true);
        }
        prevStatusRef.current = s;
      }
    }, 8000);
    return () => clearInterval(id);
  }, [isFreelancer, milestoneId]);

  // Derived
  const latestReport  = reports[0] || null;
  const latestStatus  = (latestReport?.status || "").toUpperCase();
  const needsResubmit = latestStatus === "REVISION_REQUESTED" || latestStatus === "REJECTED";
  const canSubmitNew  = isFreelancer && (reports.length === 0 || needsResubmit);

  function handleSubmitted(newReport) {
    setReports((prev) => [newReport, ...prev]);
    prevStatusRef.current = (newReport?.status || "").toUpperCase();
    setShowForm(false);
    onRefresh();
  }

  async function handleApproveReport(reportId) {
    try {
      await approveReport(reportId);
      await fetchReports(true); // re-fetch so status is accurate
      onRefresh();
    } catch (e) { alert(e.message); }
  }

  // After the client requests revision via the modal, re-fetch so the
  // freelancer's next poll (or manual refresh) gets the correct status.
  async function handleRejected(reportId, feedback) {
    await fetchReports(true);
    onRefresh();
  }

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      {rejectTarget && (
        <RejectReportModal
          report={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={handleRejected}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-[12px] font-semibold text-ink-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Progress Reports
          {reports.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {reports.length}
            </span>
          )}
          {refreshing && (
            <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin inline-block ml-1" />
          )}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReports(true)}
            className="text-[11px] text-ink-4 hover:text-primary transition-colors underline"
          >
            Refresh
          </button>

          {canSubmitNew && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-[12px] text-primary font-semibold hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {needsResubmit ? "Re-submit Report" : "Submit Report"}
            </button>
          )}
        </div>
      </div>

      {/* Revision banner with prominent re-submit button */}
      {isFreelancer && needsResubmit && (
        <div className="bg-danger-bg border border-danger/30 rounded-xl p-3 mb-3">
          <p className="text-[12px] font-semibold text-danger-text flex items-center gap-1.5 mb-1">
            <XCircle className="w-3.5 h-3.5" />
            {latestStatus === "REJECTED" ? "Report Rejected" : "Revision Requested by Client"}
          </p>
          {latestReport?.clientFeedback && (
            <p className="text-[12px] text-ink-2 italic mb-2">"{latestReport.clientFeedback}"</p>
          )}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Submit Revised Report
            </button>
          )}
        </div>
      )}

      {/* Submit form */}
      {canSubmitNew && showForm && (
        <div className="mb-3">
          <SubmitReportForm
            milestoneId={milestoneId}
            contractId={contractId}
            isResubmit={needsResubmit}
            onSubmitted={handleSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <p className="text-[12px] text-ink-3 animate-pulse py-2">Loading reports…</p>
      ) : reports.length === 0 ? (
        <p className="text-[12px] text-ink-3 py-1">No reports submitted yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              isFreelancer={isFreelancer}
              onApprove={handleApproveReport}
              onRequestRevision={(rep) => setRejectTarget(rep)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Milestone Card ────────────────────────────────────────────────────────────
function MilestoneCard({ milestone, isFreelancer, onAction, contractId }) {
  const [showReports, setShowReports] = useState(false);
  const [acting, setActing]           = useState(false);

  const s = (milestone.status || "PENDING").toUpperCase();
  const canStart   = isFreelancer && s === "PENDING";
  const canApprove = !isFreelancer && s === "IN_PROGRESS";
  const canRevise  = !isFreelancer && s === "IN_PROGRESS";
  // Show reports button when milestone is active (IN_PROGRESS)
  // Also always show for both parties so they can check history
  const isActive = s === "IN_PROGRESS";

  async function act(fn) {
    setActing(true);
    try { await fn(); onAction(); } catch (e) { alert(e.message); }
    finally { setActing(false); }
  }

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[13px] font-semibold text-ink">{milestone.title}</span>
              <MilestoneBadge status={milestone.status} />
            </div>
            {milestone.description && (
              <p className="text-xs text-ink-3 line-clamp-2">{milestone.description}</p>
            )}
            {milestone.amount > 0 && (
              <p className="text-xs text-primary-dark font-semibold mt-1">{formatCurrency(milestone.amount)}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {canStart && (
            <button
              onClick={() => act(() => startMilestone(milestone.id))}
              disabled={acting}
              className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Start Work
            </button>
          )}

          {/* Progress Reports button — show when IN_PROGRESS for both roles */}
          {isActive && (
            <button
              onClick={() => setShowReports(!showReports)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                showReports
                  ? "bg-primary-bg border border-primary text-primary"
                  : "border border-primary text-primary hover:bg-primary-bg"
              }`}
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
              <CheckCircle className="w-3.5 h-3.5" /> Approve Milestone
            </button>
          )}

          {canRevise && (
            <button
              onClick={() => act(() => requestMilestoneRevision(milestone.id))}
              disabled={acting}
              className="flex items-center gap-1 border border-warning text-warning-text bg-warning-bg rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revision
            </button>
          )}

          {/* Always allow viewing reports even on non-active milestones */}
          {!isActive && (
            <button
              onClick={() => setShowReports(!showReports)}
              className="flex items-center gap-1 border border-border text-ink-2 hover:bg-surface rounded-lg px-3 py-1.5 text-[12px] transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              {showReports ? "Hide Reports" : "View Reports"}
            </button>
          )}
        </div>
      </div>

      {showReports && (
        <div className="border-t border-border/50 px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
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

// ── Add Milestone Form ────────────────────────────────────────────────────────
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
    <div className="border border-primary-light bg-primary-bg rounded-xl p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-ink">New Milestone</h4>
        <button onClick={() => setShow(false)} className="text-ink-3 hover:text-ink transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Milestone title *"
        className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all w-full"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all w-full"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ($)"
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all"
        />
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(+e.target.value)}
          placeholder="Order"
          min={1}
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-surface focus:outline-none focus:border-primary transition-all"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={saving}
          className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Milestone"}
        </button>
        <button
          onClick={() => setShow(false)}
          className="border border-border rounded-lg px-4 py-2 text-[12px] text-ink-3 hover:bg-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Contract Card ─────────────────────────────────────────────────────────────
function ContractCard({ contract, isFreelancer }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const { data: milestones = [], isLoading: mlLoading, refetch } = useMilestones(contract.id);

  const totalMilestones = milestones.length;
  const doneMilestones  = milestones.filter((m) =>
    ["APPROVED", "COMPLETED"].includes((m.status || "").toUpperCase())
  ).length;
  const overallPct = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  const statusColor =
    (contract.status || "").toUpperCase() === "ACTIVE"
      ? "bg-success-bg text-success-text"
      : "bg-background text-ink-3 border border-border";

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-start justify-between hover:bg-background/40 transition-colors text-left gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="font-display text-[14px] sm:text-[15px] font-semibold text-ink leading-snug">
              {contract.jobTitle || `Contract #${contract.id?.slice(0, 8)}`}
            </h2>
            <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
              {contract.status || "ACTIVE"}
            </span>
          </div>
          <div className="text-xs text-ink-3 mb-2">
            <span>
              {isFreelancer
                ? `Client: ${contract.clientName || "—"}`
                : `Freelancer: ${contract.freelancerName || "—"}`}
            </span>
            {contract.agreedAmount != null && (
              <span className="ml-2 font-semibold text-ink">{formatCurrency(contract.agreedAmount)}</span>
            )}
          </div>
          {totalMilestones > 0 && (
            <div className="max-w-xs">
              <div className="flex justify-between text-[10px] sm:text-[11px] text-ink-3 mb-1">
                <span>{doneMilestones}/{totalMilestones} milestones</span>
                <span className="font-semibold text-primary">{overallPct}%</span>
              </div>
              <ProgressBar pct={overallPct} />
            </div>
          )}
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4 text-ink-3" /> : <ChevronDown className="w-4 h-4 text-ink-3" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 sm:px-5 py-4 sm:py-5">
          {contract.terms && (
            <p className="text-[12px] sm:text-[12.5px] text-ink-3 italic mb-4 border-l-2 border-primary-light pl-3">
              {contract.terms}
            </p>
          )}

          <h3 className="text-[13px] font-semibold text-ink mb-3">Milestones</h3>

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

          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <button
              onClick={() => navigate("/reviews")}
              className="flex items-center gap-1.5 border border-warning bg-warning-bg text-warning-text rounded-lg px-3 sm:px-4 py-2 text-[12px] sm:text-[12.5px] font-semibold hover:bg-warning-bg/70 transition-colors"
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
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[13px] text-ink-3">Loading contracts…</p>
          </div>
        </div>
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
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
          <div className="text-4xl sm:text-5xl mb-4">📋</div>
          <h2 className="font-display text-[17px] sm:text-[18px] font-bold text-ink mb-2">
            No contracts yet
          </h2>
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
        <div className="flex flex-col gap-4 sm:gap-5">
          <p className="text-[13px] text-ink-3">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </p>
          {contracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} isFreelancer={isFreelancer} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}