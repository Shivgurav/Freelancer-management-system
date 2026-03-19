package com.freelancer.review.controller;

import com.freelancer.review.dto.request.ReviewRequest;
import com.freelancer.review.dto.response.ReviewResponse;
import com.freelancer.review.security.UserPrincipal;
import com.freelancer.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * POST /api/reviews
     *
     * Both CLIENT and FREELANCER can call this endpoint.
     * The reviewer role is automatically taken from their JWT
     * via the X-User-Role header injected by Gateway.
     *
     * CLIENT submits: they are reviewing the FREELANCER
     * FREELANCER submits: they are reviewing the CLIENT
     */
    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<ReviewResponse> submitReview(
            @Valid @RequestBody ReviewRequest request) {

        UUID   reviewerId   = UserPrincipal.getCurrentUserId();
        String reviewerRole = UserPrincipal.getCurrentUserRole();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reviewService.submitReview(
                        reviewerId, reviewerRole, request));
    }

    /**
     * GET /api/reviews/user/{userId}
     *
     * Get all reviews received by a user.
     * Public endpoint — shown on their profile page.
     * Anyone can see a freelancer's or client's reviews.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForUser(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(
                reviewService.getReviewsForUser(userId));
    }

    /**
     * GET /api/reviews/contract/{contractId}
     *
     * Get both reviews for a contract.
     * Shows what the client said about the freelancer
     * AND what the freelancer said about the client.
     */
    @GetMapping("/contract/{contractId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<ReviewResponse>> getReviewsForContract(
            @PathVariable UUID contractId) {
        return ResponseEntity.ok(
                reviewService.getReviewsForContract(contractId));
    }

    /**
     * GET /api/reviews/my-reviews
     *
     * Get all reviews I have written.
     */
    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<ReviewResponse>> getMyReviews() {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                reviewService.getReviewsByUser(userId));
    }
}