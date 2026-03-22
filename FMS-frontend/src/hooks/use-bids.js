import { useState, useEffect } from "react";
import {
  getMyBids, getBidsForJob,
  submitBid as apiSubmitBid,
  acceptBid as apiAcceptBid,
  rejectBid as apiRejectBid,
  withdrawBid as apiWithdrawBid,
} from "@/api/bids";
import { getJobById } from "@/api/jobs";

// Normalize BidResponse from backend to UI shape
function normalizeBid(bid) {
  return {
    id: bid.id,
    jobPostId: bid.jobPostId || bid.jobId,
    freelancerId: bid.freelancerId,
    amount: bid.bidAmount ?? bid.amount ?? 0,
    coverLetter: bid.coverLetter || "",
    deliveryDays: bid.estimatedDays ?? bid.deliveryDays ?? null,
    status: bid.status || "PENDING",
    createdAt: bid.createdAt || null,
    freelancerName: bid.freelancerName || null,
    jobTitle: bid.jobTitle || null,
  };
}

// Enrich bids with job titles — batch fetch unique jobIds
async function enrichBidsWithJobTitles(bids) {
  // Collect unique jobPostIds that have no title yet
  const uniqueJobIds = [...new Set(
    bids
      .filter((b) => !b.jobTitle && b.jobPostId)
      .map((b) => b.jobPostId)
  )];

  if (uniqueJobIds.length === 0) return bids;

  // Fetch all unique jobs in parallel
  const jobMap = {};
  await Promise.all(
    uniqueJobIds.map(async (jobId) => {
      try {
        const job = await getJobById(jobId);
        if (job?.title) jobMap[jobId] = job.title;
      } catch {
        // job fetch failed — leave title null
      }
    })
  );

  // Merge titles back into bids
  return bids.map((bid) => ({
    ...bid,
    jobTitle: bid.jobTitle || jobMap[bid.jobPostId] || `Job #${bid.jobPostId?.slice(0, 8) || "?"}`,
  }));
}

// FREELANCER: my submitted bids — enriched with job titles
export function useBids() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBids = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyBids();
      const list = Array.isArray(result) ? result : result?.content ?? result?.bids ?? [];
      const normalized = list.map(normalizeBid);
      const enriched = await enrichBidsWithJobTitles(normalized);
      setData(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBids(); }, []);

  return { data, isLoading, error, refetch: fetchBids };
}

// CLIENT: bids on a specific job — job title already known from the job object
export function useBidsForJob(jobId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBids = async () => {
    if (!jobId) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBidsForJob(jobId);
      const list = Array.isArray(result) ? result : result?.content ?? result?.bids ?? [];
      setData(list.map(normalizeBid));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBids(); }, [jobId]);

  return { data, isLoading, error, refetch: fetchBids };
}

export async function submitBid(jobId, clientId, bidData) {
  return apiSubmitBid(jobId, clientId, {
    bidAmount: Number(bidData.amount || bidData.bidAmount),
    coverLetter: bidData.coverLetter,
    estimatedDays: Number(bidData.deliveryDays || bidData.estimatedDays),
  });
}

export async function acceptBid(bidId) { return apiAcceptBid(bidId); }
export async function rejectBid(bidId) { return apiRejectBid(bidId); }
export async function withdrawBid(bidId) { return apiWithdrawBid(bidId); }
