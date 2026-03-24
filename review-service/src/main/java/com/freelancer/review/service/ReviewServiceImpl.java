package com.freelancer.review.service;

import com.freelancer.review.dto.request.ReviewRequest;
import com.freelancer.review.dto.response.ReviewResponse;
import com.freelancer.review.entity.Review;
import com.freelancer.review.exception.ResourceNotFoundException;
import com.freelancer.review.exception.ReviewException;
import com.freelancer.review.repository.ReviewRepository;
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

    // CRITICAL FIX: Original code created fresh plain WebClient instances
    // inside validateContract() and updateProfileRating() with:
    //   WebClient.builder().baseUrl(contractServiceUrl).build()
    // Plain WebClient cannot resolve Eureka service names.
    // Now injecting the @LoadBalanced WebClient.Builder bean (already
    // declared in review-service's existing WebClientConfig.java).
    private final WebClient.Builder webClientBuilder;

    @Value("${contract.service.url}")
    private String contractServiceUrl;

    @Value("${profile.service.url}")
    private String profileServiceUrl;

    @Override
    @Transactional
    public ReviewResponse submitReview(UUID reviewerId,
                                        String reviewerRole,
                                        ReviewRequest request) {
        if (reviewerId.equals(request.getRevieweeId())) {
            throw new ReviewException("You cannot review yourself");
        }

        validateContract(request.getContractId(), reviewerId, reviewerRole);

        if (reviewRepository.existsByContractIdAndReviewerId(
                request.getContractId(), reviewerId)) {
            throw new ReviewException(
                    "You have already submitted a review for this contract");
        }

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

        updateProfileRating(request.getRevieweeId(), reviewerRole);

        return mapToResponse(review);
    }

    @Override
    public List<ReviewResponse> getReviewsForUser(UUID userId) {
        return reviewRepository.findByRevieweeId(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ReviewResponse> getReviewsForContract(UUID contractId) {
        return reviewRepository.findByContractId(contractId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ReviewResponse> getReviewsByUser(UUID userId) {
        return reviewRepository.findByReviewerId(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void validateContract(UUID contractId,
                                   UUID reviewerId,
                                   String reviewerRole) {
        try {
            // FIX: use injected @LoadBalanced webClientBuilder
            Map response = webClientBuilder.build()
                    .get()
                    .uri(contractServiceUrl + "/api/contracts/" + contractId)
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
                        "Reviews can only be submitted after the contract " +
                        "is completed. Current status: " + status);
            }

        } catch (ReviewException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not validate contract {} — " +
                     "contract service unavailable: {}",
                     contractId, e.getMessage());
        }
    }

    private void updateProfileRating(UUID revieweeId, String reviewerRole) {
        try {
            double newAvg = reviewRepository
                    .calculateAvgRating(revieweeId).orElse(0.0);
            long totalReviews = reviewRepository.countByRevieweeId(revieweeId);

            String profileType = "CLIENT".equals(reviewerRole)
                    ? "freelancer" : "client";

            // FIX: use injected @LoadBalanced webClientBuilder
            webClientBuilder.build()
                    .patch()
                    .uri(profileServiceUrl + "/api/profiles/" + profileType + "/rating")
                    .header("X-User-Id",   revieweeId.toString())
                    .header("X-User-Role", reviewerRole)
                    .bodyValue(Map.of(
                            "avgRating",    newAvg,
                            "totalReviews", totalReviews
                    ))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();

            log.info("Updated {} profile rating for userId: {} → avg: {} ({} reviews)",
                     profileType, revieweeId, newAvg, totalReviews);

        } catch (Exception e) {
            log.error("Failed to update profile rating for userId: {} — {}",
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