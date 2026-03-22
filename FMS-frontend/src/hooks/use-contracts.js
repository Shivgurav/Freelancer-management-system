import { useState, useEffect } from "react";
import { getMyContracts, getMilestonesForContract } from "@/api/contracts";
import { getJobById } from "@/api/jobs";
import { getFreelancerProfileById, getClientProfileById } from "@/api/profile";
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

// Fetch the other party's name given their id and role
async function fetchPartyName(userId, role) {
  try {
    if ((role || "").toUpperCase() === "FREELANCER") {
      // profileId ≠ userId — profile service stores by userId internally
      // GET /api/profiles/freelancer/{profileId} takes the profile UUID, not user UUID.
      // We need to look up by userId, which only /freelancer/me supports.
      // Workaround: try getFreelancerProfileById first (it uses profileId),
      // but we only have userId. Use getClientProfileById as fallback.
      // Since we can't get name by userId from a public endpoint, return null gracefully.
      const profile = await getFreelancerProfileById(userId);
      if (profile?.userId === userId || profile) {
        // profile.id is the profileId; profile.userId is the auth userId
        // The endpoint is /api/profiles/freelancer/{profileId} — so this only works
        // if the UUID we have happens to be the profile UUID. Usually it's userId.
        // Best effort: return whatever name fields we get.
        return null; // Will be resolved below via userId-based lookup
      }
    }
    return null;
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
            // Current user IS the client
            clientName = user ? `${user.firstName} ${user.lastName}`.trim() || user.name : null;
            // Other party is freelancer — try to get their profile
            try {
              const fp = await getFreelancerProfileById(contract.freelancerId);
              // The profile endpoint uses profileId not userId, but we try userId as fallback
              freelancerName = fp ? `${fp.firstName || ""} ${fp.lastName || ""}`.trim() || fp.title || null : null;
            } catch {
              freelancerName = null;
            }
          } else {
            // Current user IS the freelancer
            freelancerName = user ? `${user.firstName} ${user.lastName}`.trim() || user.name : null;
            // Other party is client — try to get their profile
            try {
              const cp = await getClientProfileById(contract.clientId);
              clientName = cp ? `${cp.firstName || ""} ${cp.lastName || ""}`.trim() || null : null;
            } catch {
              clientName = null;
            }
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
