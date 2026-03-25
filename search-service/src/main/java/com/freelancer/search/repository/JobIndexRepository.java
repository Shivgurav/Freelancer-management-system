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
     * Same fix as FreelancerIndexRepository:
     * Use CAST(:param AS text) instead of :param::text
     * to avoid Hibernate mis-parsing the parameter name.
     */
    @Query(value = """
        SELECT *
        FROM job_index j
        WHERE j.status = 'OPEN'
          AND (:skill           IS NULL OR lower(j.required_skills) LIKE lower('%' || CAST(:skill           AS text) || '%'))
          AND (:minBudget       IS NULL OR j.budget_max             >= :minBudget)
          AND (:maxBudget       IS NULL OR j.budget_min             <= :maxBudget)
          AND (:experienceLevel IS NULL OR j.experience_level       =  CAST(:experienceLevel AS text))
          AND (
               :keyword IS NULL
               OR lower(j.title)       LIKE lower('%' || CAST(:keyword AS text) || '%')
               OR lower(j.description) LIKE lower('%' || CAST(:keyword AS text) || '%')
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

    List<JobIndex> findByStatusOrderByCreatedAtDesc(String status);
}