// Contract Files page — allows client to upload project docs
// and both parties to view/download all files for a contract
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useContracts } from "@/hooks/use-contracts";
import { useAppStore } from "@/store/use-app-store";
import {
  uploadProjectDoc, getContractFiles, downloadFile,
  formatFileSize, getFileIcon, deleteFile,
} from "@/api/files";
import { Upload, Download, Trash2, FileText, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ContractFilePanel({ contract, isClient }) {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [msg, setMsg]             = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getContractFiles(contract.id)
      .then((f) => setFiles(Array.isArray(f) ? f : []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [contract.id]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setMsg("");
    try {
      const result = await uploadProjectDoc(file, contract.id);
      setFiles((prev) => [...prev, result]);
      setMsg("File uploaded successfully!");
    } catch (err) {
      setError("Upload failed: " + (err.message || ""));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(fileId) {
    if (!confirm("Remove this file?")) return;
    try {
      await deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => (f.id || f.fileId) !== fileId));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-[14px] font-semibold text-ink">
            {contract.jobTitle || `Contract #${contract.id?.slice(0, 8)}`}
          </h3>
          <p className="text-[12px] text-ink-3 mt-0.5">
            {contract.isFreelancer ? `Client: ${contract.clientName}` : `Freelancer: ${contract.freelancerName}`}
          </p>
        </div>
        {isClient && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Uploading…" : "Upload Document"}
            </button>
          </div>
        )}
      </div>

      {msg && <p className="text-[12px] text-success mb-2">{msg}</p>}
      {error && (
        <p className="text-[12px] text-danger flex items-center gap-1 mb-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      {loading ? (
        <p className="text-[12px] text-ink-3 animate-pulse">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="text-[12px] text-ink-3">
          {isClient ? "No project documents uploaded yet." : "No files shared for this contract yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((f) => {
            const fileId = f.id || f.fileId;
            const name = f.originalName || f.fileName || "File";
            return (
              <div key={fileId} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5">
                <span className="text-lg flex-shrink-0">{getFileIcon(name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink font-medium truncate">{name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-ink-3">
                    {f.fileType && <span className="capitalize">{f.fileType.replace(/_/g, " ").toLowerCase()}</span>}
                    {f.sizeBytes != null && <span>{formatFileSize(f.sizeBytes)}</span>}
                    {(f.uploadedAt || f.createdAt) && <span>{formatDate(f.uploadedAt || f.createdAt)}</span>}
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(fileId, name)}
                  className="text-ink-3 hover:text-primary transition-colors p-1"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {isClient && (
                  <button
                    onClick={() => handleDelete(fileId)}
                    className="text-ink-3 hover:text-danger transition-colors p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ContractFiles() {
  const { data: contracts = [], isLoading } = useContracts();
  const { currentRole } = useAppStore();
  const isClient = currentRole === "client";

  return (
    <DashboardLayout title="Contract Files">
      <div className="max-w-[720px] mx-auto">
        <div className="mb-5">
          <h1 className="font-display text-xl font-bold text-ink">Contract Documents</h1>
          <p className="text-[13px] text-ink-3 mt-1">
            {isClient
              ? "Upload project briefs and documents for your freelancers."
              : "View and download documents shared by clients for your contracts."}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-ink-3 py-12 animate-pulse">Loading contracts…</div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-ink-3 mb-4" />
            <p className="text-[14px] text-ink-2 font-medium">No contracts yet</p>
            <p className="text-[13px] text-ink-3 mt-1">Files will appear here when you have active contracts.</p>
          </div>
        ) : (
          contracts.map((c) => (
            <ContractFilePanel key={c.id} contract={c} isClient={isClient} />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
