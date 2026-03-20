package com.freelancer.contract.controller;

import com.freelancer.contract.dto.request.ProgressReportRequest;
import com.freelancer.contract.dto.response.ProgressReportResponse;
import com.freelancer.contract.security.UserPrincipal;
import com.freelancer.contract.service.ProgressReportService;
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
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ProgressReportController {

    private final ProgressReportService reportService;

    // Freelancer submits a progress report
    @PostMapping("/milestone/{milestoneId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ProgressReportResponse> submitReport(
            @PathVariable UUID milestoneId,
            @Valid @RequestBody ProgressReportRequest request) {
        UUID freelancerId = UserPrincipal.getCurrentUserId();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reportService.submitReport(
                        milestoneId, freelancerId, request));
    }

    // Get all reports for a milestone
    @GetMapping("/milestone/{milestoneId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<ProgressReportResponse>> getReports(
            @PathVariable UUID milestoneId) {
        return ResponseEntity.ok(
                reportService.getReportsForMilestone(milestoneId));
    }

    // Client approves a report
    @PatchMapping("/{reportId}/approve")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ProgressReportResponse> approveReport(
            @PathVariable UUID reportId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                reportService.approveReport(reportId, clientId));
    }

    // Client requests revision with feedback
    @PatchMapping("/{reportId}/revision")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ProgressReportResponse> requestRevision(
            @PathVariable UUID reportId,
            @RequestBody Map<String, String> body) {
        UUID   clientId = UserPrincipal.getCurrentUserId();
        String feedback = body.get("feedback");
        return ResponseEntity.ok(
                reportService.requestRevision(
                        reportId, clientId, feedback));
    }
}