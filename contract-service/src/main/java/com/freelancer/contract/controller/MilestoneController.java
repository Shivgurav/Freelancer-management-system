package com.freelancer.contract.controller;

import com.freelancer.contract.dto.request.MilestoneRequest;
import com.freelancer.contract.dto.response.MilestoneResponse;
import com.freelancer.contract.security.UserPrincipal;
import com.freelancer.contract.service.MilestoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    // Client adds milestone to contract
    @PostMapping("/contract/{contractId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<MilestoneResponse> addMilestone(
            @PathVariable UUID contractId,
            @Valid @RequestBody MilestoneRequest request) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(milestoneService.addMilestone(
                        contractId, clientId, request));
    }

    // Get all milestones for a contract
    @GetMapping("/contract/{contractId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<MilestoneResponse>> getMilestones(
            @PathVariable UUID contractId) {
        return ResponseEntity.ok(
                milestoneService.getMilestonesForContract(contractId));
    }

    // Freelancer starts working on milestone
    @PatchMapping("/{milestoneId}/start")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<MilestoneResponse> startMilestone(
            @PathVariable UUID milestoneId) {
        UUID freelancerId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                milestoneService.startMilestone(
                        milestoneId, freelancerId));
    }

    // Client approves milestone
    @PatchMapping("/{milestoneId}/approve")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<MilestoneResponse> approveMilestone(
            @PathVariable UUID milestoneId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                milestoneService.approveMilestone(
                        milestoneId, clientId));
    }

    // Client requests revision
    @PatchMapping("/{milestoneId}/revision")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<MilestoneResponse> requestRevision(
            @PathVariable UUID milestoneId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                milestoneService.requestRevision(
                        milestoneId, clientId));
    }
}