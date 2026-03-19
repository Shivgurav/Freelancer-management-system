package com.freelancer.profile.service;

import com.freelancer.profile.dto.request.ClientProfileRequest;
import com.freelancer.profile.dto.request.ProfileRequest;
import com.freelancer.profile.dto.request.SkillRequest;
import com.freelancer.profile.dto.response.ClientProfileResponse;
import com.freelancer.profile.dto.response.ProfileResponse;
import com.freelancer.profile.dto.response.SkillResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ProfileService {

    // ── Freelancer ────────────────────────────────────────────────
    ProfileResponse createFreelancerProfile(UUID userId,
                                             ProfileRequest request);

    ProfileResponse getMyFreelancerProfile(UUID userId);

    ProfileResponse getFreelancerProfileById(UUID profileId);

    ProfileResponse updateFreelancerProfile(UUID userId,
                                             ProfileRequest request);

    SkillResponse   addSkill(UUID userId, SkillRequest request);

    void            removeSkill(UUID userId, UUID skillId);

    List<SkillResponse> getAllSkills();

    List<SkillResponse> searchSkills(String keyword);

    // ── Client ────────────────────────────────────────────────────
    ClientProfileResponse createClientProfile(UUID userId,
                                               ClientProfileRequest request);

    ClientProfileResponse getMyClientProfile(UUID userId);

    ClientProfileResponse getClientProfileById(UUID profileId);

    ClientProfileResponse updateClientProfile(UUID userId,
                                               ClientProfileRequest request);
 // In ProfileService interface — add these 2 methods
    void updateFreelancerRating(UUID userId,
                                 BigDecimal avgRating,
                                 int totalReviews);

    void updateClientRating(UUID userId,
                             BigDecimal avgRating,
                             int totalReviews);
}