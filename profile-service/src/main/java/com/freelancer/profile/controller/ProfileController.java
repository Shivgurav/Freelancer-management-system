package com.freelancer.profile.controller;

import com.freelancer.profile.dto.request.ClientProfileRequest;
import com.freelancer.profile.dto.request.ProfileRequest;
import com.freelancer.profile.dto.request.SkillRequest;
import com.freelancer.profile.dto.response.ClientProfileResponse;
import com.freelancer.profile.dto.response.ProfileResponse;
import com.freelancer.profile.dto.response.SkillResponse;
import com.freelancer.profile.enums.Availability;
import com.freelancer.profile.security.UserPrincipal;
import com.freelancer.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // ── Internal — called by Auth Service after registration ──────

    @PostMapping("/freelancer/init")
    public ResponseEntity<ProfileResponse> initFreelancerProfile(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody Map<String, Object> body) {
        ProfileRequest request = new ProfileRequest();
        request.setTitle((String) body.get("title"));
        request.setBio("");
        request.setAvailability(Availability.FULL_TIME);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService
                        .createFreelancerProfile(userId, request));
    }

    @PostMapping("/client/init")
    public ResponseEntity<ClientProfileResponse> initClientProfile(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody Map<String, Object> body) {

        ClientProfileRequest request = new ClientProfileRequest();

        // Set person name from Auth Service
        request.setFirstName((String) body.get("firstName"));
        request.setLastName((String) body.get("lastName"));
        request.setCompanyName("");
        request.setDescription("");

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(profileService.createClientProfile(userId, request));
    }

    // ── Freelancer endpoints ──────────────────────────────────────

    // Update profile — only FREELANCER can update their own
    @PutMapping("/freelancer/me")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ProfileResponse> updateFreelancerProfile(
            @Valid @RequestBody ProfileRequest request) {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                profileService.updateFreelancerProfile(userId, request));
    }

    // Get my freelancer profile
    @GetMapping("/freelancer/me")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ProfileResponse> getMyFreelancerProfile() {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                profileService.getMyFreelancerProfile(userId));
    }

    // Public — anyone can view any freelancer profile
    @GetMapping("/freelancer/{profileId}")
    public ResponseEntity<ProfileResponse> getFreelancerProfile(
            @PathVariable UUID profileId) {
        return ResponseEntity.ok(
                profileService.getFreelancerProfileById(profileId));
    }

    // ── Skills ────────────────────────────────────────────────────

    @PostMapping("/freelancer/me/skills")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<SkillResponse> addSkill(
            @Valid @RequestBody SkillRequest request) {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.addSkill(userId, request));
    }

    @DeleteMapping("/freelancer/me/skills/{skillId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Void> removeSkill(
            @PathVariable UUID skillId) {
        UUID userId = UserPrincipal.getCurrentUserId();
        profileService.removeSkill(userId, skillId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/skills")
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        return ResponseEntity.ok(profileService.getAllSkills());
    }

    @GetMapping("/skills/search")
    public ResponseEntity<List<SkillResponse>> searchSkills(
            @RequestParam String keyword) {
        return ResponseEntity.ok(
                profileService.searchSkills(keyword));
    }

    // ── Client endpoints ──────────────────────────────────────────

    // Update profile — only CLIENT can update their own
    @PutMapping("/client/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ClientProfileResponse> updateClientProfile(
            @Valid @RequestBody ClientProfileRequest request) {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                profileService.updateClientProfile(userId, request));
    }

    // Get my client profile
    @GetMapping("/client/me")
    public ResponseEntity<ClientProfileResponse> getMyClientProfile() {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                profileService.getMyClientProfile(userId));
    }

    // Public — anyone can view any client profile
    @GetMapping("/client/{profileId}")
    public ResponseEntity<ClientProfileResponse> getClientProfile(
            @PathVariable UUID profileId) {
        return ResponseEntity.ok(
                profileService.getClientProfileById(profileId));
    }
 // ── Called by Review Service after a new review is submitted ─────
 // Updates avg_rating and total_reviews on the profile

 @PatchMapping("/freelancer/rating")
 public ResponseEntity<Void> updateFreelancerRating(
         @RequestHeader("X-User-Id") UUID userId,
         @RequestBody Map<String, Object> body) {

     double avgRating   = ((Number) body.get("avgRating")).doubleValue();
     int totalReviews   = ((Number) body.get("totalReviews")).intValue();

     profileService.updateFreelancerRating(
             userId,
             java.math.BigDecimal.valueOf(avgRating),
             totalReviews);

     return ResponseEntity.noContent().build();
 }

 @PatchMapping("/client/rating")
 public ResponseEntity<Void> updateClientRating(
         @RequestHeader("X-User-Id") UUID userId,
         @RequestBody Map<String, Object> body) {

     double avgRating   = ((Number) body.get("avgRating")).doubleValue();
     int totalReviews   = ((Number) body.get("totalReviews")).intValue();

     profileService.updateClientRating(
             userId,
             java.math.BigDecimal.valueOf(avgRating),
             totalReviews);

     return ResponseEntity.noContent().build();
 }
}