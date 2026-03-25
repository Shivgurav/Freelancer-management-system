package com.freelancer.job.service;

import com.freelancer.job.client.AuthClient;
import com.freelancer.job.client.AuthClient.UserInfo;
import com.freelancer.job.client.NotificationClient;
import com.freelancer.job.client.SearchClient;
import com.freelancer.job.dto.request.JobRequest;
import com.freelancer.job.dto.response.JobResponse;
import com.freelancer.job.entity.JobPost;
import com.freelancer.job.enums.JobStatus;
import com.freelancer.job.exception.JobException;
import com.freelancer.job.exception.ResourceNotFoundException;
import com.freelancer.job.repository.JobPostRepository;
import com.freelancer.job.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {

    private final JobPostRepository  jobPostRepository;
    private final NotificationClient notificationClient;
    private final AuthClient         authClient;
    private final SearchClient       searchClient;

    @Override
    @Transactional
    public JobResponse createJob(UUID clientId, JobRequest request) {

        String skillsStr = request.getRequiredSkills() != null
                ? String.join(",", request.getRequiredSkills())
                : "";

        JobPost job = JobPost.builder()
                .clientId(clientId)
                .title(request.getTitle())
                .description(request.getDescription())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .deadline(request.getDeadline())
                .durationDays(request.getDurationDays())
                .experienceLevel(request.getExperienceLevel())
                .requiredSkills(skillsStr)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .status(JobStatus.OPEN)
                .build();

        jobPostRepository.save(job);
        searchClient.syncJob(buildJobSyncData(job));

        UserInfo clientInfo = authClient.getUserInfo(clientId);

        // FIX: was sending notification TWICE — once via authClient and once via
        // UserPrincipal.getCurrentUserEmail(). Removed the duplicate.
     // Replace the notification call with null-safe version
        Map<String, String> notifData = new HashMap<>();
        notifData.put("jobTitle",  job.getTitle());
        notifData.put("budgetMin", job.getBudgetMin() != null
                ? job.getBudgetMin().toString() : "0");
        notifData.put("budgetMax", job.getBudgetMax() != null
                ? job.getBudgetMax().toString() : "0");

        notificationClient.send(
            "JOB_POSTED",
            clientInfo.getEmail(),
            clientInfo.getFullName(),
            notifData
        );

        log.info("Job created by clientId: {} — title: {}",
                clientId, job.getTitle());
        return mapToResponse(job);
    }

    @Override
    public JobResponse getJobById(UUID jobId) {
        return mapToResponse(findJobById(jobId));
    }

    @Override
    public List<JobResponse> getAllOpenJobs() {
        return jobPostRepository
                .findByStatus(JobStatus.OPEN)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<JobResponse> getJobsByClient(UUID clientId) {
        return jobPostRepository
                .findByClientId(clientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<JobResponse> searchJobsByTitle(String keyword) {
        return jobPostRepository
                .findByTitleContainingIgnoreCaseAndStatus(
                        keyword, JobStatus.OPEN)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<JobResponse> searchJobsBySkill(String skill) {
        return jobPostRepository
                .findOpenJobsBySkill(skill)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public JobResponse cancelJob(UUID jobId, UUID clientId) {
        JobPost job = findJobById(jobId);

        if (!job.getClientId().equals(clientId)) {
            throw new JobException(
                    "You are not authorized to cancel this job");
        }
        if (job.getStatus() == JobStatus.CLOSED) {
            throw new JobException(
                    "Cannot cancel a job that is already closed");
        }

        job.setStatus(JobStatus.CANCELLED);
        jobPostRepository.save(job);
        searchClient.updateJobStatus(job.getId(), "CANCELLED");
        log.info("Job cancelled — jobId: {}", jobId);
        return mapToResponse(job);
    }

    private JobPost findJobById(UUID jobId) {
        return jobPostRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Job not found with id: " + jobId));
    }

    private JobResponse mapToResponse(JobPost job) {
        List<String> skills = (job.getRequiredSkills() != null
                && !job.getRequiredSkills().isEmpty())
                ? Arrays.asList(job.getRequiredSkills().split(","))
                : List.of();

        return JobResponse.builder()
                .id(job.getId())
                .clientId(job.getClientId())
                .title(job.getTitle())
                .description(job.getDescription())
                .budgetMin(job.getBudgetMin())
                .budgetMax(job.getBudgetMax())
                .deadline(job.getDeadline())
                .durationDays(job.getDurationDays())
                .experienceLevel(job.getExperienceLevel())
                .requiredSkills(skills)
                .status(job.getStatus())
                .totalBids(job.getTotalBids())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    private Map<String, Object> buildJobSyncData(JobPost job) {
        Map<String, Object> data = new HashMap<>();
        data.put("id",              job.getId().toString());
        data.put("clientId",        job.getClientId().toString());
        data.put("title",           job.getTitle());
        data.put("description",     job.getDescription());
        data.put("budgetMin",       job.getBudgetMin());
        data.put("budgetMax",       job.getBudgetMax());
        data.put("status",          job.getStatus().name());
        data.put("experienceLevel", job.getExperienceLevel());
        data.put("durationDays",    job.getDurationDays());
     // Replace buildJobSyncData with null-safe version
        String skills = job.getRequiredSkills();
        data.put("requiredSkills",
            (skills != null && !skills.isBlank())
                ? Arrays.asList(skills.split(","))
                : Collections.emptyList());

        data.put("createdAt",
            job.getCreatedAt() != null
                ? job.getCreatedAt().toString()
                : LocalDateTime.now().toString());
        return data;
    }
}