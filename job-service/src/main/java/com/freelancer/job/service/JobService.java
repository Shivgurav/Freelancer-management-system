package com.freelancer.job.service;

import com.freelancer.job.dto.request.JobRequest;
import com.freelancer.job.dto.response.JobResponse;

import java.util.List;
import java.util.UUID;

public interface JobService {

    // Client posts a new job
    JobResponse createJob(UUID clientId, JobRequest request);

    // Get single job by id
    JobResponse getJobById(UUID jobId);

    // All open jobs — freelancers browse this
    List<JobResponse> getAllOpenJobs();

    // All jobs posted by a specific client
    List<JobResponse> getJobsByClient(UUID clientId);

    // Search open jobs by title keyword
    List<JobResponse> searchJobsByTitle(String keyword);

    // Search open jobs by skill
    List<JobResponse> searchJobsBySkill(String skill);

    // Client cancels their job
    JobResponse cancelJob(UUID jobId, UUID clientId);
}