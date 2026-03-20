package com.freelancer.job.service;

import com.freelancer.job.client.AuthClient;
import com.freelancer.job.client.AuthClient.UserInfo;
import com.freelancer.job.client.NotificationClient;
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
import com.freelancer.job.security.UserPrincipal;
import com.freelancer.job.service.BidService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BidServiceImpl implements BidService {

    private final BidRepository     bidRepository;
    private final JobPostRepository jobPostRepository;
    private final WebClient.Builder webClientBuilder;
    private final NotificationClient notificationClient;
    private final AuthClient authClient;

    // Read service URLs from application.yml
    // Uses Eureka service name — NOT localhost
    @Value("${services.contract}")
    private String contractServiceUrl;

    @Value("${services.notification}")
    private String notificationServiceUrl;

    // Constructor injection — note WebClient.Builder not WebClient
    // Because @LoadBalanced only works on WebClient.Builder bean
    public BidServiceImpl(
            BidRepository bidRepository,
            JobPostRepository jobPostRepository,
            WebClient.Builder webClientBuilder,
            NotificationClient notificationClient,
            AuthClient authClient) {
        this.bidRepository     = bidRepository;
        this.jobPostRepository = jobPostRepository;
        this.webClientBuilder  = webClientBuilder;
        this.notificationClient=notificationClient;
        this.authClient=authClient;
    }

    @Override
    @Transactional
    public BidResponse submitBid(UUID jobId,
                                  UUID freelancerId,
                                  UUID clientId,
                                  BidRequest request) {
        JobPost job = findJobById(jobId);

        if (job.getStatus() != JobStatus.OPEN) {
            throw new JobException(
                    "This job is no longer accepting bids");
        }
        if (job.getClientId().equals(freelancerId)) {
            throw new JobException("You cannot bid on your own job");
        }
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
        UserInfo clientInfo=authClient.getUserInfo(clientId);
        UserInfo freelancerInfo=authClient.getUserInfo(freelancerId);
        
        bidRepository.save(bid);
        notificationClient.send(
        	    "BID_RECEIVED",
        	    clientInfo.getEmail(),
        	    clientInfo.getFullName(),
        	    Map.of(
        	        "jobTitle",       job.getTitle(),
        	        "freelancerName", freelancerInfo.getFullName(),
        	        "bidAmount",      bid.getBidAmount().toString(),
        	        "estimatedDays",  bid.getEstimatedDays().toString(),
        	        "jobId",          job.getId().toString()
        	    )
        	);
       
        

        job.setTotalBids(job.getTotalBids() + 1);
        jobPostRepository.save(job);

        log.info("Bid submitted — freelancerId: {} jobId: {}",
                freelancerId, jobId);
        return mapToResponse(bid);
    }

    @Override
    public List<BidResponse> getBidsForJob(UUID jobId, UUID clientId) {
        JobPost job = findJobById(jobId);
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
        Bid bid     = findBidById(bidId);
        JobPost job = bid.getJobPost();

        if (!job.getClientId().equals(clientId)) {
            throw new JobException(
                    "You are not authorized to accept this bid");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new JobException("Only PENDING bids can be accepted");
        }
        if (job.getStatus() != JobStatus.OPEN) {
            throw new JobException("This job is no longer open");
        }
        
        UserInfo clientInfo=authClient.getUserInfo(clientId);
      
        // Accept this bid
        bid.setStatus(BidStatus.ACCEPTED);
        bidRepository.save(bid);
        notificationClient.send(
        	    "BID_ACCEPTED",
        	    UserPrincipal.getCurrentUserEmail(),
        	    UserPrincipal.getCurrentUserName(),
        	    Map.of(
        	        "jobTitle",     job.getTitle(),
        	        "clientName",   clientInfo.getFullName(),
        	        "agreedAmount", bid.getBidAmount().toString()
        	    )
        	);

        // Reject all other bids
        bidRepository.rejectAllOtherBids(job, bidId);

        // Close the job
        job.setStatus(JobStatus.CLOSED);
        jobPostRepository.save(job);
       

        // Auto-create contract in Contract Service
        createContractFromBid(bid, job);

        log.info("Bid accepted — bidId: {} jobId: {}",
                bidId, job.getId());
        return mapToResponse(bid);
    }

    @Override
    @Transactional
    public BidResponse rejectBid(UUID bidId, UUID clientId) {
        Bid bid = findBidById(bidId);
        if (!bid.getJobPost().getClientId().equals(clientId)) {
            throw new JobException(
                    "You are not authorized to reject this bid");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new JobException("Only PENDING bids can be rejected");
        }
        bid.setStatus(BidStatus.REJECTED);
        bidRepository.save(bid);
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
      

        JobPost job = bid.getJobPost();
        job.setTotalBids(Math.max(0, job.getTotalBids() - 1));
        jobPostRepository.save(job);

        return mapToResponse(bid);
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private void createContractFromBid(Bid bid, JobPost job) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("jobId",       job.getId());
            body.put("bidId",       bid.getId());
            body.put("clientId",    job.getClientId());
            body.put("freelancerId",bid.getFreelancerId());
            body.put("agreedAmount",bid.getBidAmount());

            // Uses Eureka service name — resolves dynamically
            // Works locally, in Docker, and in production
            webClientBuilder.build()
                    .post()
                    .uri(contractServiceUrl + "/api/contracts")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("Contract created for bidId: {}", bid.getId());

        } catch (Exception e) {
            // Log but don't fail bid acceptance
            // Contract can be created manually if needed
            log.error("Failed to create contract for bidId: {} — {}",
                    bid.getId(), e.getMessage());
        }
    }

    private JobPost findJobById(UUID jobId) {
        return jobPostRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Job not found: " + jobId));
    }

    private Bid findBidById(UUID bidId) {
        return bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bid not found: " + bidId));
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
