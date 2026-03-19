package com.freelancer.job.repository;

import com.freelancer.job.entity.Bid;
import com.freelancer.job.entity.JobPost;
import com.freelancer.job.enums.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidRepository extends JpaRepository<Bid, UUID> {

    // All bids on a job
    List<Bid> findByJobPost(JobPost jobPost);

    // All bids by a freelancer
    List<Bid> findByFreelancerId(UUID freelancerId);

    // Check if freelancer already bid on this job
    boolean existsByJobPostAndFreelancerId(
            JobPost jobPost, UUID freelancerId);

    // Find specific bid by job and freelancer
    Optional<Bid> findByJobPostAndFreelancerId(
            JobPost jobPost, UUID freelancerId);

    // Reject all other bids when one is accepted
    @Modifying
    @Query("UPDATE Bid b SET b.status = 'REJECTED' " +
           "WHERE b.jobPost = :jobPost " +
           "AND b.id != :acceptedBidId " +
           "AND b.status = 'PENDING'")
    void rejectAllOtherBids(JobPost jobPost, UUID acceptedBidId);
}