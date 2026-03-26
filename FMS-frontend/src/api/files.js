import { apiUpload, apiFetch, GATEWAY_URL, getAccessToken } from "./config";

// POST /api/files/resume  — freelancer resume upload (correct backend path)
export async function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload("/files/resume", form);
}

// POST /api/files/progress/{contractId}/{milestoneId}  — progress report attachment
export async function uploadReportFile(file, contractId, milestoneId) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload(`/files/progress/${contractId}/${milestoneId}`, form);
}

// POST /api/files/project-doc/{contractId}  — client project document
export async function uploadProjectDoc(file, contractId) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload(`/files/project-doc/${contractId}`, form);
}

// POST /api/files/portfolio  — freelancer portfolio item
export async function uploadPortfolio(file) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload("/files/portfolio", form);
}

// GET /api/files/{fileId}/download  — returns { url } presigned URL
export async function getFileDownloadUrl(fileId) {
  return apiFetch(`/files/${fileId}/download`);
}

// GET /api/files/portfolio/{userId}  — public portfolio listing
export function getPortfolioFiles(userId) {
  return apiFetch(`/files/portfolio/${userId}`);
}

// GET /api/files/contract/{contractId}  — files for a contract
export function getContractFiles(contractId) {
  return apiFetch(`/files/contract/${contractId}`);
}

// DELETE /api/files/{fileId}
export function deleteFile(fileId) {
  return apiFetch(`/files/${fileId}`, { method: "DELETE" });
}

// Trigger browser download using a presigned URL from backend
export async function downloadFile(fileId, fileName) {
  try {
    const data = await getFileDownloadUrl(fileId);
    const url = data?.url || data?.downloadUrl;
    if (!url) throw new Error("No download URL returned");
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Download failed:", err);
    throw err;
  }
}

export function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileName) {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  const map = {
    pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
    ppt: "📽️", pptx: "📽️", zip: "🗜️", rar: "🗜️",
    jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", svg: "🖼️",
    mp4: "🎬", mov: "🎬", mp3: "🎵", wav: "🎵",
    txt: "📃", csv: "📊", json: "📋", js: "💻", ts: "💻",
  };
  return map[ext] || "📎";
}
