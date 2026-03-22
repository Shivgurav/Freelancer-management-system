import { useState, useEffect } from "react";
import { getAllOpenJobs, getJobById, getMyJobs, createJob as apiCreateJob, cancelJob as apiCancelJob } from "@/api/jobs";

// Normalize a JobResponse from the backend to the shape the UI expects
function normalizeJob(job) {
  return {
    id: job.id,
    clientId: job.clientId,
    title: job.title || "",
    description: job.description || "",
    budgetMin: job.budgetMin ?? 0,
    budgetMax: job.budgetMax ?? 0,
    durationDays: job.durationDays || null,
    experienceLevel: job.experienceLevel || "",
    // backend uses requiredSkills; UI uses skills
    skills: job.requiredSkills || job.skills || [],
    // backend uses totalBids; UI uses proposalsCount
    proposalsCount: job.totalBids ?? job.proposalsCount ?? 0,
    status: job.status || "OPEN",
    createdAt: job.createdAt || null,
  };
}

// Browse open jobs (public)
export function useProjects() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getAllOpenJobs()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.content ?? [];
        setData(list.map(normalizeJob));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error, refetch: () => setIsLoading(true) };
}

// Single job
export function useProject(id) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    getJobById(id)
      .then((result) => setData(normalizeJob(result)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { data, isLoading, error };
}

// Client's own jobs
export function useMyJobs() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getMyJobs()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.content ?? [];
        setData(list.map(normalizeJob));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}

// Create a job — maps frontend fields → backend DTO
export async function createProject({ title, description, budgetMin, budgetMax, durationDays, experienceLevel, skills }) {
  return apiCreateJob({
    title,
    description,
    budgetMin: budgetMin ? Number(budgetMin) : null,
    budgetMax: budgetMax ? Number(budgetMax) : null,
    durationDays: durationDays ? Number(durationDays) : null,
    experienceLevel: experienceLevel || null,
    requiredSkills: skills || [],
  });
}

export async function cancelProject(jobId) {
  return apiCancelJob(jobId);
}
