package com.freelancer.search.service;

import com.freelancer.search.dto.request.FreelancerSearchRequest;
import com.freelancer.search.dto.request.JobSearchRequest;
import com.freelancer.search.dto.response.FreelancerSearchResponse;
import com.freelancer.search.dto.response.JobSearchResponse;
import com.freelancer.search.dto.response.SearchResultResponse;
import com.freelancer.search.entity.FreelancerIndex;
import com.freelancer.search.entity.JobIndex;
import com.freelancer.search.repository.FreelancerIndexRepository;
import com.freelancer.search.repository.JobIndexRepository;
import com.freelancer.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final FreelancerIndexRepository freelancerIndexRepo;
    private final JobIndexRepository        jobIndexRepo;

    // ── Search freelancers ────────────────────────────────────────
    @Override
    public SearchResultResponse<FreelancerSearchResponse>
            searchFreelancers(FreelancerSearchRequest request) {

        // Run the search query with all filters
        List<FreelancerIndex> results =
                freelancerIndexRepo.searchFreelancers(
                        request.getSkill(),
                        request.getMinRate(),
                        request.getMaxRate(),
                        request.getMinRating(),
                        request.getAvailability(),
                        request.getLocation(),
                        request.getKeyword());

        // Apply sorting on top of DB results
        results = sortFreelancers(results, request.getSortBy());

        // Apply pagination manually
        return paginate(
                results.stream()
                       .map(this::mapFreelancer)
                       .collect(Collectors.toList()),
                request.getPage(),
                request.getSize());
    }

    // ── Search jobs ───────────────────────────────────────────────
    @Override
    public SearchResultResponse<JobSearchResponse>
            searchJobs(JobSearchRequest request) {

        List<JobIndex> results = jobIndexRepo.searchJobs(
                request.getSkill(),
                request.getMinBudget(),
                request.getMaxBudget(),
                request.getExperienceLevel(),
                request.getKeyword());

        return paginate(
                results.stream()
                       .map(this::mapJob)
                       .collect(Collectors.toList()),
                request.getPage(),
                request.getSize());
    }

    // ── Top rated freelancers ─────────────────────────────────────
    @Override
    public SearchResultResponse<FreelancerSearchResponse>
            getTopRatedFreelancers(int page, int size) {

        // Only show freelancers with at least 1 review
        List<FreelancerSearchResponse> results =
                freelancerIndexRepo.findTopRated(1)
                        .stream()
                        .map(this::mapFreelancer)
                        .collect(Collectors.toList());

        return paginate(results, page, size);
    }

    // ── Latest open jobs ──────────────────────────────────────────
    @Override
    public SearchResultResponse<JobSearchResponse>
            getLatestJobs(int page, int size) {

        List<JobSearchResponse> results =
                jobIndexRepo.findByStatusOrderByCreatedAtDesc("OPEN")
                        .stream()
                        .map(this::mapJob)
                        .collect(Collectors.toList());

        return paginate(results, page, size);
    }

    // ── Sync freelancer profile from Profile Service ──────────────
    // Called when a profile is created or updated
    @Override
    @Transactional
    public void syncFreelancerProfile(Map<String, Object> data) {
        try {
            UUID profileId = UUID.fromString(
                    data.get("id").toString());

            // Find existing or create new index entry
            FreelancerIndex index = freelancerIndexRepo
                    .findById(profileId)
                    .orElse(FreelancerIndex.builder()
                            .id(profileId)
                            .build());

            // Update all searchable fields
            if (data.get("userId") != null) {
                index.setUserId(UUID.fromString(
                        data.get("userId").toString()));
            }
            if (data.get("title") != null) {
                index.setTitle(data.get("title").toString());
            }
            if (data.get("firstName") != null) {
                index.setFirstName(
                        data.get("firstName").toString());
            }
            if (data.get("lastName") != null) {
                index.setLastName(
                        data.get("lastName").toString());
            }
            if (data.get("location") != null) {
                index.setLocation(data.get("location").toString());
            }
            if (data.get("hourlyRate") != null) {
                index.setHourlyRate(new BigDecimal(
                        data.get("hourlyRate").toString()));
            }
            if (data.get("yearsOfExperience") != null) {
                index.setYearsOfExperience(Integer.parseInt(
                        data.get("yearsOfExperience").toString()));
            }
            if (data.get("availability") != null) {
                index.setAvailability(
                        data.get("availability").toString());
            }
            if (data.get("avgRating") != null) {
                index.setAvgRating(new BigDecimal(
                        data.get("avgRating").toString()));
            }
            if (data.get("totalReviews") != null) {
                index.setTotalReviews(Integer.parseInt(
                        data.get("totalReviews").toString()));
            }
            if (data.get("totalJobsCompleted") != null) {
                index.setTotalJobsCompleted(Integer.parseInt(
                        data.get("totalJobsCompleted").toString()));
            }

            // Convert skills list to comma separated string
            if (data.get("skills") != null) {
                Object skillsObj = data.get("skills");
                if (skillsObj instanceof List) {
                    index.setSkills(
                            ((List<?>) skillsObj).stream()
                                    .map(Object::toString)
                                    .collect(Collectors.joining(",")));
                } else {
                    index.setSkills(skillsObj.toString());
                }
            }

            index.setLastSyncedAt(LocalDateTime.now());
            index.setActive(true);

            freelancerIndexRepo.save(index);
            log.info("Freelancer index synced — profileId: {}",
                    profileId);

        } catch (Exception e) {
            log.error("Failed to sync freelancer profile: {}",
                    e.getMessage());
        }
    }

    // ── Update freelancer rating ──────────────────────────────────
    // Called by Review Service after new review
    @Override
    @Transactional
    public void updateFreelancerRating(UUID profileId,
                                        double avgRating,
                                        int totalReviews) {
        freelancerIndexRepo.findById(profileId).ifPresent(index -> {
            index.setAvgRating(BigDecimal.valueOf(avgRating));
            index.setTotalReviews(totalReviews);
            index.setLastSyncedAt(LocalDateTime.now());
            freelancerIndexRepo.save(index);
            log.info("Rating updated in search index — " +
                     "profileId: {} avg: {}",
                    profileId, avgRating);
        });
    }

    // ── Sync job from Job Service ─────────────────────────────────
    @Override
    @Transactional
    public void syncJob(Map<String, Object> data) {
        try {
            UUID jobId = UUID.fromString(
                    data.get("id").toString());

            JobIndex index = jobIndexRepo
                    .findById(jobId)
                    .orElse(JobIndex.builder()
                            .id(jobId)
                            .build());

            if (data.get("clientId") != null) {
                index.setClientId(UUID.fromString(
                        data.get("clientId").toString()));
            }
            if (data.get("title") != null) {
                index.setTitle(data.get("title").toString());
            }
            if (data.get("description") != null) {
                index.setDescription(
                        data.get("description").toString());
            }
            if (data.get("budgetMin") != null) {
                index.setBudgetMin(new BigDecimal(
                        data.get("budgetMin").toString()));
            }
            if (data.get("budgetMax") != null) {
                index.setBudgetMax(new BigDecimal(
                        data.get("budgetMax").toString()));
            }
            if (data.get("status") != null) {
                index.setStatus(data.get("status").toString());
            }
            if (data.get("experienceLevel") != null) {
                index.setExperienceLevel(
                        data.get("experienceLevel").toString());
            }
            if (data.get("durationDays") != null) {
                index.setDurationDays(Integer.parseInt(
                        data.get("durationDays").toString()));
            }

            // Convert skills list to comma separated string
            if (data.get("requiredSkills") != null) {
                Object skillsObj = data.get("requiredSkills");
                if (skillsObj instanceof List) {
                    index.setRequiredSkills(
                            ((List<?>) skillsObj).stream()
                                    .map(Object::toString)
                                    .collect(Collectors.joining(",")));
                } else {
                    index.setRequiredSkills(skillsObj.toString());
                }
            }

            if (data.get("createdAt") != null) {
                index.setCreatedAt(LocalDateTime.parse(
                        data.get("createdAt").toString()));
            } else {
                index.setCreatedAt(LocalDateTime.now());
            }

            index.setLastSyncedAt(LocalDateTime.now());
            jobIndexRepo.save(index);
            log.info("Job index synced — jobId: {}", jobId);

        } catch (Exception e) {
            log.error("Failed to sync job: {}", e.getMessage());
        }
    }

    // ── Update job status ─────────────────────────────────────────
    @Override
    @Transactional
    public void updateJobStatus(UUID jobId, String status) {
        jobIndexRepo.findById(jobId).ifPresent(index -> {
            index.setStatus(status);
            index.setLastSyncedAt(LocalDateTime.now());
            jobIndexRepo.save(index);
            log.info("Job status updated in search index — " +
                     "jobId: {} status: {}", jobId, status);
        });
    }

    // ═════════════════════════════════════════════════════════════
    // Private helpers
    // ═════════════════════════════════════════════════════════════

    private List<FreelancerIndex> sortFreelancers(
            List<FreelancerIndex> list, String sortBy) {

        if (sortBy == null) return list;

        return switch (sortBy) {
            case "rate_asc" -> list.stream()
                    .filter(f -> f.getHourlyRate() != null)
                    .sorted((a, b) -> a.getHourlyRate()
                                       .compareTo(b.getHourlyRate()))
                    .collect(Collectors.toList());

            case "rate_desc" -> list.stream()
                    .filter(f -> f.getHourlyRate() != null)
                    .sorted((a, b) -> b.getHourlyRate()
                                       .compareTo(a.getHourlyRate()))
                    .collect(Collectors.toList());

            case "jobs_completed" -> list.stream()
                    .sorted((a, b) -> b.getTotalJobsCompleted()
                                       .compareTo(
                                               a.getTotalJobsCompleted()))
                    .collect(Collectors.toList());

            // Default — sort by rating
            default -> list.stream()
                    .sorted((a, b) -> b.getAvgRating()
                                       .compareTo(a.getAvgRating()))
                    .collect(Collectors.toList());
        };
    }

    // Manual pagination — split list into pages
    private <T> SearchResultResponse<T> paginate(
            List<T> allResults, int page, int size) {

        int total      = allResults.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex  = page * size;
        int toIndex    = Math.min(fromIndex + size, total);

        List<T> pageResults = fromIndex >= total
                ? Collections.emptyList()
                : allResults.subList(fromIndex, toIndex);

        return SearchResultResponse.<T>builder()
                .results(pageResults)
                .totalResults(total)
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .hasNext(page < totalPages - 1)
                .hasPrevious(page > 0)
                .build();
    }

    private FreelancerSearchResponse mapFreelancer(
            FreelancerIndex f) {

        List<String> skillList =
                (f.getSkills() != null && !f.getSkills().isEmpty())
                ? Arrays.asList(f.getSkills().split(","))
                : List.of();

        String fullName = "";
        if (f.getFirstName() != null && f.getLastName() != null) {
            fullName = f.getFirstName() + " " + f.getLastName();
        } else if (f.getFirstName() != null) {
            fullName = f.getFirstName();
        }

        return FreelancerSearchResponse.builder()
                .profileId(f.getId())
                .userId(f.getUserId())
                .fullName(fullName)
                .title(f.getTitle())
                .location(f.getLocation())
                .hourlyRate(f.getHourlyRate())
                .yearsOfExperience(f.getYearsOfExperience())
                .skills(skillList)
                .avgRating(f.getAvgRating())
                .totalReviews(f.getTotalReviews())
                .totalJobsCompleted(f.getTotalJobsCompleted())
                .availability(f.getAvailability())
                .build();
    }

    private JobSearchResponse mapJob(JobIndex j) {
        List<String> skillList =
                (j.getRequiredSkills() != null
                && !j.getRequiredSkills().isEmpty())
                ? Arrays.asList(j.getRequiredSkills().split(","))
                : List.of();

        return JobSearchResponse.builder()
                .jobId(j.getId())
                .clientId(j.getClientId())
                .title(j.getTitle())
                .description(j.getDescription())
                .budgetMin(j.getBudgetMin())
                .budgetMax(j.getBudgetMax())
                .requiredSkills(skillList)
                .experienceLevel(j.getExperienceLevel())
                .totalBids(j.getTotalBids())
                .durationDays(j.getDurationDays())
                .build();
    }
}