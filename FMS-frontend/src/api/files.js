import { apiUpload, apiFetch, GATEWAY_URL, getAccessToken } from "./config";

// POST /api/files/upload/message  — attach a file to a message (multipart)
export async function uploadMessageFile(file) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload("/files/upload/message", form);
}

// POST /api/files/upload/report  — attach a file to a progress report
export async function uploadReportFile(file, contractId, milestoneId) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload(`/files/progress/${contractId}/${milestoneId}`, form);
}

// POST /api/files/upload/resume  — freelancer resume upload
export async function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload("/files/upload/resume", form);
}

// POST /api/files/upload/project  — project document upload
export async function uploadProjectDoc(file, projectId) {
  const form = new FormData();
  form.append("file", file);
  if (projectId) form.append("projectId", projectId);
  return apiUpload("/files/upload/project", form);
}

// GET /api/files/{fileId}/download  — direct download URL
export function getFileDownloadUrl(fileId) {
  const token = getAccessToken();
  return `${GATEWAY_URL}/files/${fileId}/download?token=${token}`;
}

// GET /api/files/{fileId}  — file metadata
export function getFileMetadata(fileId) {
  return apiFetch(`/files/${fileId}`);
}

// Trigger browser download for a file
export function downloadFile(fileId, fileName) {
  const url = getFileDownloadUrl(fileId);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "download";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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