package com.freelancer.review.service;

import com.freelancer.review.dto.request.ReviewRequest;
import com.freelancer.review.dto.response.ReviewResponse;
import com.freelancer.review.entity.Review;
import com.freelancer.review.exception.ResourceNotFoundException;
import com.freelancer.review.exception.ReviewException;
import com.freelancer.review.repository.ReviewRepository;
import com.freelancer.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    @Value("${contract.service.url}")
    private String contractServiceUrl;

    @Value("${profile.service.url}")
    private String profileServiceUrl;

    // ── Submit review ─────────────────────────────────────────────
    @Override
    @Transactional
    public ReviewResponse submitReview(UUID reviewerId,
                                        String reviewerRole,
                                        ReviewRequest request) {

        // Step 1 — Cannot review yourself
        if (reviewerId.equals(request.getRevieweeId())) {
            throw new ReviewException("You cannot review yourself");
        }

        // Step 2 — Check contract exists and is COMPLETED
        // We call Contract Service via HTTP
        validateContract(request.getContractId(),
                         reviewerId,
                         reviewerRole);

        // Step 3 — Check if reviewer already reviewed this contract
        if (reviewRepository.existsByContractIdAndReviewerId(
                request.getContractId(), reviewerId)) {
            throw new ReviewException(
                    "You have already submitted a review for this contract");
        }

        // Step 4 — Save the review
        Review review = Review.builder()
                .contractId(request.getContractId())
                .reviewerId(reviewerId)
                .revieweeId(request.getRevieweeId())
                .reviewerRole(reviewerRole)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);
        log.info("Review submitted by {} [{}] for contract {}",
                reviewerId, reviewerRole, request.getContractId());

        // Step 5 — Update avg rating on the reviewee's profile
        updateProfileRating(request.getRevieweeId(), reviewerRole);

        return mapToResponse(review);
    }

    // ── Get reviews for a user ────────────────────────────────────
    @Override
    public List<ReviewResponse> getReviewsForUser(UUID userId) {
        return reviewRepository
                .findByRevieweeId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Get reviews for a contract ────────────────────────────────
    @Override
    public List<ReviewResponse> getReviewsForContract(UUID contractId) {
        return reviewRepository
                .findByContractId(contractId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Get reviews by a user ─────────────────────────────────────
    @Override
    public List<ReviewResponse> getReviewsByUser(UUID userId) {
        return reviewRepository
                .findByReviewerId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ═════════════════════════════════════════════════════════════
    // Private helpers
    // ═════════════════════════════════════════════════════════════

    /**
     * Calls Contract Service to verify:
     * 1. Contract exists
     * 2. Contract status is COMPLETED
     * 3. The reviewer is actually a party on this contract
     *
     * If Contract Service is not yet built, this gracefully
     * skips validation and logs a warning.
     */
    private void validateContract(UUID contractId,
                                   UUID reviewerId,
                                   String reviewerRole) {
        try {
            WebClient client = WebClient.builder()
                    .baseUrl(contractServiceUrl)
                    .build();

            // GET /api/contracts/{contractId}/validate
            // Contract Service returns the contract details
            Map response = client.get()
                    .uri("/api/contracts/{id}", contractId)
                    .header("X-User-Id",   reviewerId.toString())
                    .header("X-User-Role", reviewerRole)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new ResourceNotFoundException(
                        "Contract not found: " + contractId);
            }

            String status = (String) response.get("status");
            if (!"COMPLETED".equals(status)) {
                throw new ReviewException(
                        "Reviews can only be submitted after " +
                        "the contract is completed. " +
                        "Current status: " + status);
            }

        } catch (ReviewException | ResourceNotFoundException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            // Contract service might not be running yet during dev
            // Log warning but allow review for now
            log.warn("Could not validate contract {} — " +
                     "contract service unavailable: {}",
                     contractId, e.getMessage());
        }
    }

    /**
     * After a review is submitted, recalculate and update
     * the reviewee's average rating on their profile.
     *
     * If reviewer is CLIENT → update FreelancerProfile.avgRating
     * If reviewer is FREELANCER → update ClientProfile.avgRating
     */
    private void updateProfileRating(UUID revieweeId,
                                      String reviewerRole) {
        try {
            // Calculate new average from all reviews
            double newAvg = reviewRepository
                    .calculateAvgRating(revieweeId)
                    .orElse(0.0);

            long totalReviews = reviewRepository
                    .countByRevieweeId(revieweeId);

            WebClient client = WebClient.builder()
                    .baseUrl(profileServiceUrl)
                    .build();

            // Determine which profile type to update
            // CLIENT reviewed FREELANCER → update freelancer profile
            // FREELANCER reviewed CLIENT → update client profile
            String profileType = "CLIENT".equals(reviewerRole)
                    ? "freelancer" : "client";

            // PATCH /api/profiles/{type}/rating
            client.patch()
                    .uri("/api/profiles/{type}/rating", profileType)
                    .header("X-User-Id",   revieweeId.toString())
                    .header("X-User-Role", reviewerRole)
                    .bodyValue(Map.of(
                            "avgRating",    newAvg,
                            "totalReviews", totalReviews
                    ))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();

            log.info("Updated {} profile rating for userId: {} " +
                     "→ avg: {} ({} reviews)",
                     profileType, revieweeId, newAvg, totalReviews);

        } catch (Exception e) {
            // Don't fail the review if profile update fails
            // It can be retried later
            log.error("Failed to update profile rating " +
                      "for userId: {} — {}",
                      revieweeId, e.getMessage());
        }
    }

    private ReviewResponse mapToResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .contractId(r.getContractId())
                .reviewerId(r.getReviewerId())
                .revieweeId(r.getRevieweeId())
                .reviewerRole(r.getReviewerRole())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}