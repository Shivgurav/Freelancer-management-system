package com.freelancer.review.service;

import com.freelancer.review.dto.request.ReviewRequest;
import com.freelancer.review.dto.response.ReviewResponse;

import java.util.List;
import java.util.UUID;

public interface ReviewService {

    // Submit a review after contract completion
    ReviewResponse submitReview(UUID reviewerId,
                                String reviewerRole,
                                ReviewRequest request);

    // Get all reviews received by a user
    // Shown on freelancer/client public profile
    List<ReviewResponse> getReviewsForUser(UUID userId);

    // Get all reviews for a specific contract
    // Shows both sides — client reviewed freelancer AND vice versa
    List<ReviewResponse> getReviewsForContract(UUID contractId);

    // Get all reviews written by a user
    List<ReviewResponse> getReviewsByUser(UUID userId);
}