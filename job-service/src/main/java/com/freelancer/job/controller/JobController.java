package com.freelancer.job.controller;

import com.freelancer.job.dto.request.JobRequest;
import com.freelancer.job.dto.response.JobResponse;
import com.freelancer.job.security.UserPrincipal;
import com.freelancer.job.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // CLIENT posts a job
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<JobResponse> createJob(
            @Valid @RequestBody JobRequest request) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(jobService.createJob(clientId, request));
    }

    // Anyone can view a single job
    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponse> getJob(
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(jobService.getJobById(jobId));
    }

    // Anyone can browse open jobs
    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllOpenJobs() {
        return ResponseEntity.ok(jobService.getAllOpenJobs());
    }

    // Client views their own posted jobs
    @GetMapping("/my-jobs")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<JobResponse>> getMyJobs() {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                jobService.getJobsByClient(clientId));
    }

    // Search jobs by title
    @GetMapping("/search")
    public ResponseEntity<List<JobResponse>> searchByTitle(
            @RequestParam String keyword) {
        return ResponseEntity.ok(
                jobService.searchJobsByTitle(keyword));
    }

    // Search jobs by skill
    @GetMapping("/search/skill")
    public ResponseEntity<List<JobResponse>> searchBySkill(
            @RequestParam String skill) {
        return ResponseEntity.ok(
                jobService.searchJobsBySkill(skill));
    }

    // Client cancels their job
    @PatchMapping("/{jobId}/cancel")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<JobResponse> cancelJob(
            @PathVariable UUID jobId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                jobService.cancelJob(jobId, clientId));
    }
}