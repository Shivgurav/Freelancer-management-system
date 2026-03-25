package com.freelancer.search.repository;

import com.freelancer.search.entity.FreelancerIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FreelancerIndexRepository
        extends JpaRepository<FreelancerIndex, UUID> {

    /*
     * BUG FIX — Do NOT use :param::text in native queries with Spring Data JPA.
     *
     * Hibernate's named parameter parser sees `:keyword::text` and tries to bind
     * a parameter literally named `keyword::text`, then throws:
     *   "No argument for named parameter ':keyword::text'"
     *
     * The correct way to cast in a native query is SQL standard CAST() syntax:
     *   CAST(:keyword AS text)
     * Hibernate stops parsing the parameter name at the closing paren of CAST(),
     * so :keyword is bound correctly and the AS text cast happens at SQL level.
     *
     * The null-safe pattern used:
     *   (:param IS NULL OR lower(col) LIKE lower('%' || CAST(:param AS text) || '%'))
     * When :param is null  → the IS NULL short-circuits, no lower() call happens
     * When :param is a string → CAST(:param AS text) gives PostgreSQL a typed value
     */
    @Query(value = """
        SELECT *
        FROM freelancer_index f
        WHERE f.is_active = true
          AND (:skill        IS NULL OR lower(f.skills)      LIKE lower('%' || CAST(:skill        AS text) || '%'))
          AND (:minRate      IS NULL OR f.hourly_rate        >= :minRate)
          AND (:maxRate      IS NULL OR f.hourly_rate        <= :maxRate)
          AND (:minRating    IS NULL OR f.avg_rating         >= :minRating)
          AND (:availability IS NULL OR f.availability       =  CAST(:availability AS text))
          AND (:location     IS NULL OR lower(f.location)   LIKE lower('%' || CAST(:location     AS text) || '%'))
          AND (
               :keyword IS NULL
               OR lower(f.title)  LIKE lower('%' || CAST(:keyword AS text) || '%')
               OR lower(f.skills) LIKE lower('%' || CAST(:keyword AS text) || '%')
              )
        ORDER BY f.avg_rating DESC, f.total_jobs_completed DESC
        """,
        nativeQuery = true)
    List<FreelancerIndex> searchFreelancers(
            @Param("skill")        String skill,
            @Param("minRate")      BigDecimal minRate,
            @Param("maxRate")      BigDecimal maxRate,
            @Param("minRating")    BigDecimal minRating,
            @Param("availability") String availability,
            @Param("location")     String location,
            @Param("keyword")      String keyword);

    @Query(value = """
        SELECT *
        FROM freelancer_index f
        WHERE f.is_active = true
          AND lower(f.skills) LIKE lower('%' || CAST(:skill AS text) || '%')
        ORDER BY f.avg_rating DESC
        """,
        nativeQuery = true)
    List<FreelancerIndex> findBySkill(@Param("skill") String skill);

    @Query(value = """
        SELECT *
        FROM freelancer_index f
        WHERE f.is_active = true
          AND f.total_reviews >= :minReviews
        ORDER BY f.avg_rating DESC
        """,
        nativeQuery = true)
    List<FreelancerIndex> findTopRated(@Param("minReviews") int minReviews);

    Optional<FreelancerIndex> findByUserId(UUID userId);
}