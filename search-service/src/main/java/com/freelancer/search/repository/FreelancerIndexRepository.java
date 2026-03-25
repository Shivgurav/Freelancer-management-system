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
     * BUG FIX — lower(bytea) ERROR ON POSTGRESQL
     *
     * Root cause: JPQL LOWER() + CONCAT() with nullable parameters.
     *
     * When a search param is null, Hibernate generates SQL like:
     *   lower(concat('%', null, '%'))
     * PostgreSQL infers the null as type `bytea` (unknown binary type) and
     * throws: "ERROR: function lower(bytea) does not exist"
     *
     * The JPQL :param IS NULL check runs at the JPQL level (i.e. it skips
     * the entire condition), but Hibernate still type-binds the parameter
     * and PostgreSQL's type inference fires on the CONCAT expression itself.
     *
     * Fix: Use nativeQuery = true with explicit ::text casts.
     * PostgreSQL native SQL:
     *   - :param::text casts the null to text, making lower() happy
     *   - COALESCE wraps are unnecessary because we use the IS NULL guard
     *     separately in the WHERE clause pattern below
     *
     * The pattern used here:
     *   (:param IS NULL OR lower(f.column) LIKE lower('%' || :param || '%'))
     * In native SQL, :param::text forces the cast so lower() gets a text arg.
     */

    @Query(value = """
        SELECT *
        FROM freelancer_index f
        WHERE f.is_active = true
          AND (:skill    IS NULL OR lower(f.skills)        LIKE lower('%' || :skill::text    || '%'))
          AND (:minRate  IS NULL OR f.hourly_rate  >= :minRate)
          AND (:maxRate  IS NULL OR f.hourly_rate  <= :maxRate)
          AND (:minRating IS NULL OR f.avg_rating  >= :minRating)
          AND (:availability IS NULL OR f.availability = :availability::text)
          AND (:location IS NULL OR lower(f.location)      LIKE lower('%' || :location::text || '%'))
          AND (
               :keyword  IS NULL
               OR lower(f.title)  LIKE lower('%' || :keyword::text || '%')
               OR lower(f.skills) LIKE lower('%' || :keyword::text || '%')
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

    // ── Search by skill only ──────────────────────────────────────
    @Query(value = """
        SELECT *
        FROM freelancer_index f
        WHERE f.is_active = true
          AND lower(f.skills) LIKE lower('%' || :skill::text || '%')
        ORDER BY f.avg_rating DESC
        """,
        nativeQuery = true)
    List<FreelancerIndex> findBySkill(@Param("skill") String skill);

    // ── Top rated freelancers ─────────────────────────────────────
    @Query(value = """
        SELECT *
        FROM freelancer_index f
        WHERE f.is_active = true
          AND f.total_reviews >= :minReviews
        ORDER BY f.avg_rating DESC
        """,
        nativeQuery = true)
    List<FreelancerIndex> findTopRated(@Param("minReviews") int minReviews);

    // ── Find by userId — used when Profile Service sends updates ──
    Optional<FreelancerIndex> findByUserId(UUID userId);
}