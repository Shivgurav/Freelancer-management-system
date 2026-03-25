package com.freelancer.search.repository;

import com.freelancer.search.entity.JobIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobIndexRepository
        extends JpaRepository<JobIndex, UUID> {

    /*
     * BUG FIX — lower(bytea) ERROR ON POSTGRESQL (same fix as FreelancerIndexRepository)
     *
     * JPQL LOWER(CONCAT('%', :param, '%')) with a null param causes:
     *   "ERROR: function lower(bytea) does not exist"
     * because PostgreSQL infers null as bytea.
     *
     * Fix: switch to nativeQuery = true and use :param::text to force
     * PostgreSQL to treat the parameter as text before passing to lower().
     */

    @Query(value = """
        SELECT *
        FROM job_index j
        WHERE j.status = 'OPEN'
          AND (:skill           IS NULL OR lower(j.required_skills) LIKE lower('%' || :skill::text           || '%'))
          AND (:minBudget       IS NULL OR j.budget_max >= :minBudget)
          AND (:maxBudget       IS NULL OR j.budget_min <= :maxBudget)
          AND (:experienceLevel IS NULL OR j.experience_level = :experienceLevel::text)
          AND (
               :keyword IS NULL
               OR lower(j.title)       LIKE lower('%' || :keyword::text || '%')
               OR lower(j.description) LIKE lower('%' || :keyword::text || '%')
              )
        ORDER BY j.created_at DESC
        """,
        nativeQuery = true)
    List<JobIndex> searchJobs(
            @Param("skill")           String skill,
            @Param("minBudget")       BigDecimal minBudget,
            @Param("maxBudget")       BigDecimal maxBudget,
            @Param("experienceLevel") String experienceLevel,
            @Param("keyword")         String keyword);

    // ── Latest open jobs ──────────────────────────────────────────
    List<JobIndex> findByStatusOrderByCreatedAtDesc(String status);
}