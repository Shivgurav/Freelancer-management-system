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

    // ── Full job search — all filters combined ────────────────────
    @Query("""
        SELECT j FROM JobIndex j
        WHERE j.status = 'OPEN'
        AND (:skill IS NULL OR
             LOWER(j.requiredSkills) LIKE
             LOWER(CONCAT('%', :skill, '%')))
        AND (:minBudget IS NULL OR
             j.budgetMax >= :minBudget)
        AND (:maxBudget IS NULL OR
             j.budgetMin <= :maxBudget)
        AND (:experienceLevel IS NULL OR
             j.experienceLevel = :experienceLevel)
        AND (:keyword IS NULL OR
             LOWER(j.title) LIKE
             LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(j.description) LIKE
             LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY j.createdAt DESC
        """)
    List<JobIndex> searchJobs(
            @Param("skill")           String skill,
            @Param("minBudget")       BigDecimal minBudget,
            @Param("maxBudget")       BigDecimal maxBudget,
            @Param("experienceLevel") String experienceLevel,
            @Param("keyword")         String keyword);

    // ── Latest open jobs ──────────────────────────────────────────
    List<JobIndex> findByStatusOrderByCreatedAtDesc(String status);
}