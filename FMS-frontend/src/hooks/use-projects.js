import { useState, useEffect } from "react";
import { getJobs, getJobById, createJob } from "@/api/jobs";
import { apiFetch } from "@/api/config";

export function useProjects(filters = {}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getJobs(filters)
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.content ?? result?.jobs ?? [];
        setData(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}

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
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { data, isLoading, error };
}

export async function createProject(jobData) {
  return createJob(jobData);
}

export async function updateProjectProgress(jobId, progress) {
  return apiFetch(`/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify({ progress }),
  });
}
