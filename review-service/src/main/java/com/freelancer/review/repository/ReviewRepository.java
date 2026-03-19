package com.freelancer.review.repository;

import com.freelancer.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    // Check if reviewer already reviewed this contract
    // Prevents duplicate reviews
    boolean existsByContractIdAndReviewerId(
            UUID contractId, UUID reviewerId);

    // All reviews received by a specific user (their reviewee_id)
    // Used to show reviews on a freelancer/client profile
    List<Review> findByRevieweeId(UUID revieweeId);

    // All reviews for a specific contract
    // Both client→freelancer and freelancer→client
    List<Review> findByContractId(UUID contractId);

    // All reviews written BY a specific user
    List<Review> findByReviewerId(UUID reviewerId);

    // Calculate average rating for a user
    // Used to update avg_rating on profile
    @Query("SELECT AVG(r.rating) FROM Review r " +
           "WHERE r.revieweeId = :userId")
    Optional<Double> calculateAvgRating(UUID userId);

    // Total number of reviews a user received
    long countByRevieweeId(UUID userId);
}