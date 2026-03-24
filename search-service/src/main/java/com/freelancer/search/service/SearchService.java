package com.freelancer.search.service;

import com.freelancer.search.dto.request.FreelancerSearchRequest;
import com.freelancer.search.dto.request.JobSearchRequest;
import com.freelancer.search.dto.response.FreelancerSearchResponse;
import com.freelancer.search.dto.response.JobSearchResponse;
import com.freelancer.search.dto.response.SearchResultResponse;

import java.util.Map;
import java.util.UUID;

public interface SearchService {

    // Search freelancers with filters
    SearchResultResponse<FreelancerSearchResponse>
            searchFreelancers(FreelancerSearchRequest request);

    // Search open jobs with filters
    SearchResultResponse<JobSearchResponse>
            searchJobs(JobSearchRequest request);

    // Get top rated freelancers — for homepage
    SearchResultResponse<FreelancerSearchResponse>
            getTopRatedFreelancers(int page, int size);

    // Get latest open jobs — for homepage
    SearchResultResponse<JobSearchResponse>
            getLatestJobs(int page, int size);

    // ── Sync endpoints — called by other services ─────────────────
    // Called by Profile Service when a profile is created or updated
    void syncFreelancerProfile(Map<String, Object> profileData);

    // Called by Profile Service when rating is updated
    void updateFreelancerRating(UUID profileId,
                                 double avgRating,
                                 int totalReviews);

    // Called by Job Service when a job is posted or updated
    void syncJob(Map<String, Object> jobData);

    // Called by Job Service when job status changes
    void updateJobStatus(UUID jobId, String status);
}