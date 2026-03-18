import { useState, useEffect } from "react";
import { getMyBids, submitBid as apiSubmitBid, acceptBid, getBidsForJob } from "@/api/jobs";

export function useBids() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getMyBids()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.content ?? result?.bids ?? [];
        setData(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}

export function useBidsForJob(jobId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    getBidsForJob(jobId)
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.content ?? result?.bids ?? [];
        setData(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  return { data, isLoading, error };
}

export async function submitBid(jobId, bidData) {
  return apiSubmitBid(jobId, bidData);
}

export async function updateBidStatus(bidId, status) {
  if (status === "Accepted") {
    return acceptBid(bidId);
  }
  return { id: bidId, status };
}
