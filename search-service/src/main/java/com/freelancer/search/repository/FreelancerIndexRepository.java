package com.freelancer.search.repository;

import com.freelancer.search.entity.FreelancerIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface FreelancerIndexRepository
        extends JpaRepository<FreelancerIndex, UUID> {

    // ── Full search query — all filters combined ──────────────────
    // This is the main search query
    // Every filter is optional — if null it is ignored
    @Query("""
        SELECT f FROM FreelancerIndex f
        WHERE f.isActive = true
        AND (:skill IS NULL OR
             LOWER(f.skills) LIKE LOWER(CONCAT('%', :skill, '%')))
        AND (:minRate IS NULL OR
             f.hourlyRate >= :minRate)
        AND (:maxRate IS NULL OR
             f.hourlyRate <= :maxRate)
        AND (:minRating IS NULL OR
             f.avgRating >= :minRating)
        AND (:availability IS NULL OR
             f.availability = :availability)
        AND (:location IS NULL OR
             LOWER(f.location) LIKE
             LOWER(CONCAT('%', :location, '%')))
        AND (:keyword IS NULL OR
             LOWER(f.title) LIKE
             LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(f.skills) LIKE
             LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY f.avgRating DESC, f.totalJobsCompleted DESC
        """)
    List<FreelancerIndex> searchFreelancers(
            @Param("skill")        String skill,
            @Param("minRate")      BigDecimal minRate,
            @Param("maxRate")      BigDecimal maxRate,
            @Param("minRating")    BigDecimal minRating,
            @Param("availability") String availability,
            @Param("location")     String location,
            @Param("keyword")      String keyword);

    // ── Search by skill only ──────────────────────────────────────
    @Query("""
        SELECT f FROM FreelancerIndex f
        WHERE f.isActive = true
        AND LOWER(f.skills) LIKE
            LOWER(CONCAT('%', :skill, '%'))
        ORDER BY f.avgRating DESC
        """)
    List<FreelancerIndex> findBySkill(@Param("skill") String skill);

    // ── Top rated freelancers ─────────────────────────────────────
    @Query("""
        SELECT f FROM FreelancerIndex f
        WHERE f.isActive = true
        AND f.totalReviews >= :minReviews
        ORDER BY f.avgRating DESC
        """)
    List<FreelancerIndex> findTopRated(
            @Param("minReviews") int minReviews);

    // ── Find by userId — for syncing ──────────────────────────────
    // Used when Profile Service sends an update
    java.util.Optional<FreelancerIndex> findByUserId(UUID userId);
}