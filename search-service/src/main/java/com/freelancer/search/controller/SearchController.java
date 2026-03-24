package com.freelancer.search.controller;

import com.freelancer.search.dto.request.FreelancerSearchRequest;
import com.freelancer.search.dto.request.JobSearchRequest;
import com.freelancer.search.dto.response.FreelancerSearchResponse;
import com.freelancer.search.dto.response.JobSearchResponse;
import com.freelancer.search.dto.response.SearchResultResponse;
import com.freelancer.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    // ── Public search endpoints ───────────────────────────────────

    /**
     * POST /api/search/freelancers
     * Search freelancers with filters
     * Public — anyone can search
     *
     * Body: { skill, keyword, minRate, maxRate,
     *         minRating, availability, location,
     *         page, size, sortBy }
     */
    @PostMapping("/freelancers")
    public ResponseEntity<SearchResultResponse<FreelancerSearchResponse>>
            searchFreelancers(
                    @RequestBody FreelancerSearchRequest request) {
        return ResponseEntity.ok(
                searchService.searchFreelancers(request));
    }

    /**
     * POST /api/search/jobs
     * Search open jobs with filters
     * Public — anyone can search
     *
     * Body: { skill, keyword, minBudget, maxBudget,
     *         experienceLevel, page, size }
     */
    @PostMapping("/jobs")
    public ResponseEntity<SearchResultResponse<JobSearchResponse>>
            searchJobs(@RequestBody JobSearchRequest request) {
        return ResponseEntity.ok(searchService.searchJobs(request));
    }

    /**
     * GET /api/search/freelancers/top-rated
     * Top rated freelancers — for homepage
     */
    @GetMapping("/freelancers/top-rated")
    public ResponseEntity<SearchResultResponse<FreelancerSearchResponse>>
            getTopRated(
                    @RequestParam(defaultValue = "0") int page,
                    @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                searchService.getTopRatedFreelancers(page, size));
    }

    /**
     * GET /api/search/jobs/latest
     * Latest open jobs — for homepage
     */
    @GetMapping("/jobs/latest")
    public ResponseEntity<SearchResultResponse<JobSearchResponse>>
            getLatestJobs(
                    @RequestParam(defaultValue = "0") int page,
                    @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                searchService.getLatestJobs(page, size));
    }

    // ── Internal sync endpoints ───────────────────────────────────
    // Called by Profile Service and Job Service
    // Not called by frontend

    /**
     * POST /api/search/sync/freelancer
     * Profile Service calls this when a profile is
     * created or updated
     */
    @PostMapping("/sync/freelancer")
    public ResponseEntity<Void> syncFreelancer(
            @RequestBody Map<String, Object> profileData) {
        searchService.syncFreelancerProfile(profileData);
        return ResponseEntity.ok().build();
    }

    /**
     * PATCH /api/search/sync/freelancer/{profileId}/rating
     * Review Service calls this after a new review
     */
    @PatchMapping("/sync/freelancer/{profileId}/rating")
    public ResponseEntity<Void> updateFreelancerRating(
            @PathVariable UUID profileId,
            @RequestBody Map<String, Object> body) {
        double avgRating   = Double.parseDouble(
                body.get("avgRating").toString());
        int    totalReviews = Integer.parseInt(
                body.get("totalReviews").toString());
        searchService.updateFreelancerRating(
                profileId, avgRating, totalReviews);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/search/sync/job
     * Job Service calls this when a job is posted or updated
     */
    @PostMapping("/sync/job")
    public ResponseEntity<Void> syncJob(
            @RequestBody Map<String, Object> jobData) {
        searchService.syncJob(jobData);
        return ResponseEntity.ok().build();
    }

    /**
     * PATCH /api/search/sync/job/{jobId}/status
     * Job Service calls this when job status changes
     * e.g. OPEN → CLOSED when bid accepted
     */
    @PatchMapping("/sync/job/{jobId}/status")
    public ResponseEntity<Void> updateJobStatus(
            @PathVariable UUID jobId,
            @RequestBody Map<String, String> body) {
        searchService.updateJobStatus(jobId, body.get("status"));
        return ResponseEntity.ok().build();
    }
}