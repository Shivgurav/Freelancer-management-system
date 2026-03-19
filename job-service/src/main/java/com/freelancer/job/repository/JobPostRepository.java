package com.freelancer.job.repository;

import com.freelancer.job.entity.JobPost;
import com.freelancer.job.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobPostRepository
        extends JpaRepository<JobPost, UUID> {

    // All jobs posted by a client
    List<JobPost> findByClientId(UUID clientId);

    // All open jobs — for freelancers to browse
    List<JobPost> findByStatus(JobStatus status);

    // Search jobs by title keyword
    List<JobPost> findByTitleContainingIgnoreCaseAndStatus(
            String keyword, JobStatus status);

    // Search jobs by skill
    @Query("SELECT j FROM JobPost j " +
           "WHERE j.status = 'OPEN' " +
           "AND LOWER(j.requiredSkills) LIKE LOWER(CONCAT('%', :skill, '%'))")
    List<JobPost> findOpenJobsBySkill(String skill);
}