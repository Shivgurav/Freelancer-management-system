package com.freelancer.job.service;

import com.freelancer.job.dto.request.BidRequest;
import com.freelancer.job.dto.response.BidResponse;

import java.util.List;
import java.util.UUID;

public interface BidService {

    // Freelancer submits a bid on a job
    BidResponse submitBid(UUID jobId,
                          UUID freelancerId,
                          BidRequest request);

    // All bids on a job — client views this
    List<BidResponse> getBidsForJob(UUID jobId, UUID clientId);

    // All bids by a freelancer — freelancer views this
    List<BidResponse> getBidsByFreelancer(UUID freelancerId);

    // Client accepts a bid
    // This closes the job and rejects all other bids
    BidResponse acceptBid(UUID bidId, UUID clientId);

    // Client rejects a specific bid
    BidResponse rejectBid(UUID bidId, UUID clientId);

    // Freelancer withdraws their own bid
    BidResponse withdrawBid(UUID bidId, UUID freelancerId);
}