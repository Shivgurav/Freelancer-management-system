import { apiUpload, apiFetch } from "./config";

export function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload("/files/resume", form);
}

export function uploadProjectDoc(file, projectId) {
  const form = new FormData();
  form.append("file", file);
  if (projectId) form.append("projectId", projectId);
  return apiUpload("/files/project-doc", form);
}

export function uploadProgressFile(file, contractId) {
  const form = new FormData();
  form.append("file", file);
  if (contractId) form.append("contractId", contractId);
  return apiUpload("/files/progress", form);
}

export function downloadFile(fileId) {
  return apiFetch(`/files/${fileId}/download`);
}
