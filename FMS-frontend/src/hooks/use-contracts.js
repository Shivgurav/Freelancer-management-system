import { useState, useEffect } from "react";
import { getMyContracts, getMilestonesForContract } from "@/api/contracts";
import { getUserById } from "@/api/auth";
import { getJobById } from "@/api/jobs";
import { useAppStore } from "@/store/use-app-store";

// Normalize ContractResponse from backend to UI shape
function normalizeContract(contract) {
  return {
    id: contract.id,
    jobId: contract.jobId,
    bidId: contract.bidId,
    clientId: contract.clientId,
    freelancerId: contract.freelancerId,
    agreedAmount: contract.agreedAmount || 0,
    startDate: contract.startDate || null,
    endDate: contract.endDate || null,
    terms: contract.terms || "",
    status: contract.status || "ACTIVE",
    milestones: (contract.milestones || []).map(normalizeMilestone),
    createdAt: contract.createdAt || null,
    // enriched fields — populated after extra fetches
    jobTitle: contract.jobTitle || null,
    clientName: contract.clientName || null,
    freelancerName: contract.freelancerName || null,
  };
}

export function normalizeMilestone(m) {
  return {
    id: m.id,
    contractId: m.contractId,
    title: m.title || "",
    description: m.description || "",
    amount: m.amount || 0,
    sequenceOrder: m.sequenceOrder || 0,
    status: m.status || "PENDING",
  };
}

// Fetch job title for a contract (safe — returns null on error)
async function fetchJobTitle(jobId) {
  try {
    const job = await getJobById(jobId);
    return job?.title || null;
  } catch {
    return null;
  }
}

// Fetch a user's display name via the auth service (uses userId not profileId)
async function fetchUserName(userId) {
  if (!userId) return null;
  try {
    const info = await getUserById(userId);
    if (!info) return null;
    const name = [info.firstName, info.lastName].filter(Boolean).join(" ").trim();
    return name || info.email || null;
  } catch {
    return null;
  }
}

export function useContracts() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAppStore.getState().user;

  const fetchContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyContracts();
      const list = Array.isArray(result) ? result : result?.content ?? result?.contracts ?? [];
      const normalized = list.map(normalizeContract);

      // Enrich each contract with job title and party names in parallel
      const enriched = await Promise.all(
        normalized.map(async (contract) => {
          // 1. Job title — fetch from job service
          const jobTitle = await fetchJobTitle(contract.jobId);

          // 2. Names — current user's name we already have from the store
          //    The other party we try to resolve from profile service
          const currentUserId = user?.id;
          const isCurrentUserClient = contract.clientId === currentUserId;

          let clientName = null;
          let freelancerName = null;

          if (isCurrentUserClient) {
            clientName = user ? `${user.firstName} ${user.lastName}`.trim() || user.name : null;
            freelancerName = await fetchUserName(contract.freelancerId);
          } else {
            freelancerName = user ? `${user.firstName} ${user.lastName}`.trim() || user.name : null;
            clientName = await fetchUserName(contract.clientId);
          }

          return {
            ...contract,
            jobTitle: jobTitle || `Job #${contract.jobId?.slice(0, 8)}`,
            clientName: clientName || `Client #${contract.clientId?.slice(0, 8)}`,
            freelancerName: freelancerName || `Freelancer #${contract.freelancerId?.slice(0, 8)}`,
          };
        })
      );

      setData(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  return { data, isLoading, error, refetch: fetchContracts };
}

export function useMilestones(contractId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = () => {
    if (!contractId) { setIsLoading(false); return; }
    setIsLoading(true);
    getMilestonesForContract(contractId)
      .then((result) => {
        const list = Array.isArray(result) ? result : [];
        setData(list.map(normalizeMilestone));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { refetch(); }, [contractId]);

  return { data, isLoading, error, refetch };
}
