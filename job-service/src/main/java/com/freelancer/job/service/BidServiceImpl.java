package com.freelancer.job.service;

import com.freelancer.job.dto.request.BidRequest;
import com.freelancer.job.dto.response.BidResponse;
import com.freelancer.job.entity.Bid;
import com.freelancer.job.entity.JobPost;
import com.freelancer.job.enums.BidStatus;
import com.freelancer.job.enums.JobStatus;
import com.freelancer.job.exception.JobException;
import com.freelancer.job.exception.ResourceNotFoundException;
import com.freelancer.job.repository.BidRepository;
import com.freelancer.job.repository.JobPostRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidServiceImpl implements BidService {

    private final BidRepository     bidRepository;
    private final JobPostRepository jobPostRepository;

    @Override
    @Transactional
    public BidResponse submitBid(UUID jobId,
                                  UUID freelancerId,
                                  BidRequest request) {
        JobPost job = findJobById(jobId);

        // Job must be open
        if (job.getStatus() != JobStatus.OPEN) {
            throw new JobException(
                    "This job is no longer accepting bids");
        }

        // Freelancer cannot bid on their own job
        if (job.getClientId().equals(freelancerId)) {
            throw new JobException(
                    "You cannot bid on your own job");
        }

        // One bid per freelancer per job
        if (bidRepository.existsByJobPostAndFreelancerId(
                job, freelancerId)) {
            throw new JobException(
                    "You have already placed a bid on this job");
        }

        Bid bid = Bid.builder()
                .jobPost(job)
                .freelancerId(freelancerId)
                .bidAmount(request.getBidAmount())
                .coverLetter(request.getCoverLetter())
                .estimatedDays(request.getEstimatedDays())
                .status(BidStatus.PENDING)
                .build();

        bidRepository.save(bid);

        // Increment total bids counter
        job.setTotalBids(job.getTotalBids() + 1);
        jobPostRepository.save(job);

        log.info("Bid submitted by freelancerId: {} on jobId: {}",
                freelancerId, jobId);
        return mapToResponse(bid);
    }

    @Override
    public List<BidResponse> getBidsForJob(UUID jobId, UUID clientId) {
        JobPost job = findJobById(jobId);

        // Only the job owner can see all bids
        if (!job.getClientId().equals(clientId)) {
            throw new JobException(
                    "You are not authorized to view bids for this job");
        }

        return bidRepository.findByJobPost(job)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BidResponse> getBidsByFreelancer(UUID freelancerId) {
        return bidRepository.findByFreelancerId(freelancerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BidResponse acceptBid(UUID bidId, UUID clientId) {
        Bid bid = findBidById(bidId);
        JobPost job = bid.getJobPost();

        // Only job owner can accept bids
        if (!job.getClientId().equals(clientId)) {
            throw new JobException(
                    "You are not authorized to accept this bid");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new JobException(
                    "Only PENDING bids can be accepted");
        }
        if (job.getStatus() != JobStatus.OPEN) {
            throw new JobException(
                    "This job is no longer open");
        }

        // Accept this bid
        bid.setStatus(BidStatus.ACCEPTED);
        bidRepository.save(bid);

        // Reject all other bids on this job
        bidRepository.rejectAllOtherBids(job, bidId);

        // Close the job — no more bids accepted
        job.setStatus(JobStatus.CLOSED);
        jobPostRepository.save(job);

        log.info("Bid accepted — bidId: {} jobId: {}",
                bidId, job.getId());
        return mapToResponse(bid);
    }

    @Override
    @Transactional
    public BidResponse rejectBid(UUID bidId, UUID clientId) {
        Bid bid = findBidById(bidId);
        JobPost job = bid.getJobPost();

        if (!job.getClientId().equals(clientId)) {
            throw new JobException(
                    "You are not authorized to reject this bid");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new JobException("Only PENDING bids can be rejected");
        }

        bid.setStatus(BidStatus.REJECTED);
        bidRepository.save(bid);

        log.info("Bid rejected — bidId: {}", bidId);
        return mapToResponse(bid);
    }

    @Override
    @Transactional
    public BidResponse withdrawBid(UUID bidId, UUID freelancerId) {
        Bid bid = findBidById(bidId);

        if (!bid.getFreelancerId().equals(freelancerId)) {
            throw new JobException(
                    "You are not authorized to withdraw this bid");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new JobException(
                    "Only PENDING bids can be withdrawn");
        }

        bid.setStatus(BidStatus.WITHDRAWN);
        bidRepository.save(bid);

        // Decrement total bids counter
        JobPost job = bid.getJobPost();
        job.setTotalBids(Math.max(0, job.getTotalBids() - 1));
        jobPostRepository.save(job);

        log.info("Bid withdrawn — bidId: {}", bidId);
        return mapToResponse(bid);
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private JobPost findJobById(UUID jobId) {
        return jobPostRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Job not found with id: " + jobId));
    }

    private Bid findBidById(UUID bidId) {
        return bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bid not found with id: " + bidId));
    }

    private BidResponse mapToResponse(Bid bid) {
        return BidResponse.builder()
                .id(bid.getId())
                .jobPostId(bid.getJobPost().getId())
                .freelancerId(bid.getFreelancerId())
                .bidAmount(bid.getBidAmount())
                .coverLetter(bid.getCoverLetter())
                .estimatedDays(bid.getEstimatedDays())
                .status(bid.getStatus())
                .submittedAt(bid.getSubmittedAt())
                .updatedAt(bid.getUpdatedAt())
                .build();
    }
}