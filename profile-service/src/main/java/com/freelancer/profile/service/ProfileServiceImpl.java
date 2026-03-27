package com.freelancer.profile.service;

import com.freelancer.profile.client.NotificationClient;
import com.freelancer.profile.client.SearchClient;
import com.freelancer.profile.dto.request.ClientProfileRequest;
import com.freelancer.profile.dto.request.ProfileRequest;
import com.freelancer.profile.dto.request.SkillRequest;
import com.freelancer.profile.dto.response.ClientProfileResponse;
import com.freelancer.profile.dto.response.ProfileResponse;
import com.freelancer.profile.dto.response.SkillResponse;
import com.freelancer.profile.entity.ClientProfile;
import com.freelancer.profile.entity.FreelancerProfile;
import com.freelancer.profile.entity.FreelancerSkill;
import com.freelancer.profile.entity.Skill;
import com.freelancer.profile.enums.Availability;
import com.freelancer.profile.exception.ProfileException;
import com.freelancer.profile.exception.ResourceNotFoundException;
import com.freelancer.profile.repository.ClientProfileRepository;
import com.freelancer.profile.repository.FreelancerProfileRepository;
import com.freelancer.profile.repository.FreelancerSkillRepository;
import com.freelancer.profile.repository.SkillRepository;
import com.freelancer.profile.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ClientProfileRepository     clientProfileRepository;
    private final SkillRepository             skillRepository;
    private final FreelancerSkillRepository   freelancerSkillRepository;
    private final NotificationClient          notificationClient;
    private final SearchClient                searchClient;

    @Override
    @Transactional
    public ProfileResponse createFreelancerProfile(UUID userId,
                                                    ProfileRequest request) {
        if (freelancerProfileRepository.existsByUserId(userId)) {
            throw new ProfileException(
                    "Freelancer profile already exists for this user");
        }
        String[] fullName=request.getTitle().split(" ");

        FreelancerProfile profile = FreelancerProfile.builder()
                .userId(userId)
                .title(request.getTitle())
                .bio(request.getBio())
                .hourlyRate(request.getHourlyRate())
                .location(request.getLocation())
                .yearsOfExperience(request.getYearsOfExperience())
                .portfolioUrl(request.getPortfolioUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .githubUrl(request.getGithubUrl())
                .firstName(fullName[0])
                .lastName(fullName[1])
                .availability(request.getAvailability() != null
                        ? request.getAvailability()
                        : Availability.FULL_TIME)
                .build();

        profile = freelancerProfileRepository.save(profile);
      

        if (request.getSkills() != null) {
            for (SkillRequest sr : request.getSkills()) {
                addSkillToProfile(profile, sr);
            }
        }
        searchClient.syncFreelancerProfile(buildSyncData(profile));  

        log.info("Freelancer profile created for userId: {}", userId);
        return mapFreelancerToResponse(
                freelancerProfileRepository.findById(profile.getId()).get());
    }

    @Override
    public ProfileResponse getMyFreelancerProfile(UUID userId) {
        return mapFreelancerToResponse(
                freelancerProfileRepository.findByUserId(userId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Freelancer profile not found")));
    }

    @Override
    public ProfileResponse getFreelancerProfileById(UUID profileId) {
        return mapFreelancerToResponse(
                freelancerProfileRepository.findById(profileId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Freelancer profile not found")));
    }

    @Override
    @Transactional
    public ProfileResponse updateFreelancerProfile(UUID userId,
                                                    ProfileRequest request) {
        FreelancerProfile profile = freelancerProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Freelancer profile not found"));

        if (request.getTitle() != null)
            profile.setTitle(request.getTitle());
        if (request.getBio() != null)
            profile.setBio(request.getBio());
        if (request.getHourlyRate() != null)
            profile.setHourlyRate(request.getHourlyRate());
        if (request.getLocation() != null)
            profile.setLocation(request.getLocation());
        if (request.getYearsOfExperience() != null)
            profile.setYearsOfExperience(request.getYearsOfExperience());
        if (request.getPortfolioUrl() != null)
            profile.setPortfolioUrl(request.getPortfolioUrl());
        if (request.getLinkedinUrl() != null)
            profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getGithubUrl() != null)
            profile.setGithubUrl(request.getGithubUrl());
        if (request.getAvailability() != null)
            profile.setAvailability(request.getAvailability());

        freelancerProfileRepository.save(profile);
        searchClient.syncFreelancerProfile(buildSyncData(profile));

        // FIX 1: Was sending "${userID}" as a literal string — not a variable.
        // FIX 2: request.getTitle() can be null if only other fields updated
        //        — Map.of() throws NullPointerException on null values.
        String email = UserPrincipal.getCurrentUserEmail();
        String name  = UserPrincipal.getCurrentUserName();
        if (email != null) {
            notificationClient.send(
                "PROFILE_UPDATED",
                email,
                name != null ? name : "User",
                Map.of(
                    "userId", userId.toString(),
                    "title",  profile.getTitle() != null ? profile.getTitle() : ""
                )
            );
        }

        log.info("Freelancer profile updated for userId: {}", userId);
        return mapFreelancerToResponse(profile);
    }

    @Override
    @Transactional
    public SkillResponse addSkill(UUID userId, SkillRequest request) {
        FreelancerProfile profile = freelancerProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Freelancer profile not found"));
        return mapSkillToResponse(addSkillToProfile(profile, request));
    }

    @Override
    @Transactional
    public void removeSkill(UUID userId, UUID skillId) {
        FreelancerProfile profile = freelancerProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Freelancer profile not found"));
        freelancerSkillRepository
                .deleteByFreelancerProfileAndSkillId(profile, skillId);
        log.info("Skill {} removed from profile {}", skillId, profile.getId());
    }

    @Override
    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(s -> SkillResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .category(s.getCategory())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<SkillResponse> searchSkills(String keyword) {
        return skillRepository
                .findByNameContainingIgnoreCase(keyword).stream()
                .map(s -> SkillResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .category(s.getCategory())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClientProfileResponse createClientProfile(
            UUID userId, ClientProfileRequest request) {
        if (clientProfileRepository.existsByUserId(userId)) {
            throw new ProfileException(
                    "Client profile already exists for this user");
        }

        ClientProfile profile = ClientProfile.builder()
                .userId(userId)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .companyName(request.getCompanyName())
                .description(request.getDescription())
                .industry(request.getIndustry())
                .companySize(request.getCompanySize())
                .location(request.getLocation())
                .websiteUrl(request.getWebsiteUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .build();

        clientProfileRepository.save(profile);
        log.info("Client profile created for userId: {}", userId);
        return mapClientToResponse(profile);
    }

    @Override
    @Transactional
    public ClientProfileResponse updateClientProfile(
            UUID userId, ClientProfileRequest request) {
        ClientProfile profile = clientProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client profile not found"));

        if (request.getFirstName() != null)   profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null)    profile.setLastName(request.getLastName());
        if (request.getCompanyName() != null) profile.setCompanyName(request.getCompanyName());
        if (request.getDescription() != null) profile.setDescription(request.getDescription());
        if (request.getIndustry() != null)    profile.setIndustry(request.getIndustry());
        if (request.getCompanySize() != null) profile.setCompanySize(request.getCompanySize());
        if (request.getLocation() != null)    profile.setLocation(request.getLocation());
        if (request.getWebsiteUrl() != null)  profile.setWebsiteUrl(request.getWebsiteUrl());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());

        clientProfileRepository.save(profile);
        log.info("Client profile updated for userId: {}", userId);
        return mapClientToResponse(profile);
    }

    @Override
    public ClientProfileResponse getMyClientProfile(UUID userId) {
        ClientProfile profile = clientProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client profile not found. Please complete your profile first."));
        return mapClientToResponse(profile);
    }

    @Override
    public ClientProfileResponse getClientProfileById(UUID profileId) {
        ClientProfile profile = clientProfileRepository
                .findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client profile not found with id: " + profileId));
        return mapClientToResponse(profile);
    }

    @Override
    @Transactional
    public void updateFreelancerRating(UUID userId,
                                        BigDecimal avgRating,
                                        int totalReviews) {
        FreelancerProfile profile = freelancerProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Freelancer profile not found"));
        profile.setAvgRating(avgRating);
        profile.setTotalReviews(totalReviews);
        freelancerProfileRepository.save(profile);
        searchClient.updateRating(profile.getId(),
                profile.getAvgRating().doubleValue(),
                profile.getTotalReviews());
        log.info("Updated freelancer rating: userId={} avg={} total={}",
                userId, avgRating, totalReviews);
    }

    @Override
    @Transactional
    public void updateClientRating(UUID userId,
                                    BigDecimal avgRating,
                                    int totalReviews) {
        ClientProfile profile = clientProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client profile not found"));
        profile.setAvgRating(avgRating);
        profile.setTotalReviews(totalReviews);
        clientProfileRepository.save(profile);
        log.info("Updated client rating: userId={} avg={} total={}",
                userId, avgRating, totalReviews);
    }

    // ── Private helpers ───────────────────────────────────────────

    private Map<String, Object> buildSyncData(FreelancerProfile p) {
        Map<String, Object> data = new HashMap<>();
        data.put("id",               p.getId().toString());
        data.put("userId",           p.getUserId().toString());
        data.put("title",            p.getTitle());
        data.put("location",         p.getLocation());
        data.put("hourlyRate",       p.getHourlyRate());
        data.put("yearsOfExperience",p.getYearsOfExperience());
        data.put("availability",     p.getAvailability() != null
                ? p.getAvailability().name() : "FULL_TIME");
        data.put("avgRating",        p.getAvgRating());
        data.put("totalReviews",     p.getTotalReviews());
        data.put("totalJobsCompleted", p.getTotalJobsCompleted());
        data.put("firstName", p.getFirstName());
        data.put("lastName", p.getLastName());
        List<String> skillNames = p.getFreelancerSkills().stream()
                .map(fs -> fs.getSkill().getName())
                .collect(Collectors.toList());
        data.put("skills", skillNames);
        return data;
    }

    private FreelancerSkill addSkillToProfile(FreelancerProfile profile,
                                               SkillRequest sr) {
        Skill skill = skillRepository
                .findByNameIgnoreCase(sr.getName())
                .orElseGet(() -> skillRepository.save(
                        Skill.builder()
                             .name(sr.getName())
                             .category(sr.getCategory())
                             .build()));

        boolean alreadyAdded = profile.getFreelancerSkills().stream()
                .anyMatch(fs -> fs.getSkill().getId().equals(skill.getId()));

        if (alreadyAdded) {
            throw new ProfileException(
                    "Skill '" + sr.getName() + "' already added");
        }

        return freelancerSkillRepository.save(
                FreelancerSkill.builder()
                        .freelancerProfile(profile)
                        .skill(skill)
                        .proficiencyLevel(sr.getProficiencyLevel())
                        .build());
    }

    private ProfileResponse mapFreelancerToResponse(FreelancerProfile p) {
        return ProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .title(p.getTitle())
                .bio(p.getBio())
                .hourlyRate(p.getHourlyRate())
                .location(p.getLocation())
                .yearsOfExperience(p.getYearsOfExperience())
                .portfolioUrl(p.getPortfolioUrl())
                .linkedinUrl(p.getLinkedinUrl())
                .githubUrl(p.getGithubUrl())
                .availability(p.getAvailability())
                .avgRating(p.getAvgRating())
                .totalReviews(p.getTotalReviews())
                .totalJobsCompleted(p.getTotalJobsCompleted())
                .skills(p.getFreelancerSkills().stream()
                        .map(this::mapSkillToResponse)
                        .collect(Collectors.toList()))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private ClientProfileResponse mapClientToResponse(ClientProfile p) {
        return ClientProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .companyName(p.getCompanyName())
                .description(p.getDescription())
                .industry(p.getIndustry())
                .companySize(p.getCompanySize())
                .location(p.getLocation())
                .websiteUrl(p.getWebsiteUrl())
                .linkedinUrl(p.getLinkedinUrl())
                .totalJobsPosted(p.getTotalJobsPosted())
                .totalJobsCompleted(p.getTotalJobsCompleted())
                .avgRating(p.getAvgRating())
                .totalReviews(p.getTotalReviews())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private SkillResponse mapSkillToResponse(FreelancerSkill fs) {
        return SkillResponse.builder()
                .id(fs.getSkill().getId())
                .name(fs.getSkill().getName())
                .category(fs.getSkill().getCategory())
                .proficiencyLevel(fs.getProficiencyLevel())
                .build();
    }
}