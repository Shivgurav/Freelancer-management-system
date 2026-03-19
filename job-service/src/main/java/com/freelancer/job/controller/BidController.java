package com.freelancer.job.controller;

import com.freelancer.job.dto.request.BidRequest;
import com.freelancer.job.dto.response.BidResponse;
import com.freelancer.job.security.UserPrincipal;
import com.freelancer.job.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bids")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    // FREELANCER submits a bid
    @PostMapping("/job/{jobId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<BidResponse> submitBid(
            @PathVariable UUID jobId,
            @Valid @RequestBody BidRequest request) {
        UUID freelancerId = UserPrincipal.getCurrentUserId();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bidService.submitBid(jobId, freelancerId, request));
    }

    // CLIENT views all bids on their job
    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<BidResponse>> getBidsForJob(
            @PathVariable UUID jobId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                bidService.getBidsForJob(jobId, clientId));
    }

    // FREELANCER views all their own bids
    @GetMapping("/my-bids")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<BidResponse>> getMyBids() {
        UUID freelancerId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                bidService.getBidsByFreelancer(freelancerId));
    }

    // CLIENT accepts a bid
    @PatchMapping("/{bidId}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<BidResponse> acceptBid(
            @PathVariable UUID bidId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                bidService.acceptBid(bidId, clientId));
    }

    // CLIENT rejects a bid
    @PatchMapping("/{bidId}/reject")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<BidResponse> rejectBid(
            @PathVariable UUID bidId) {
        UUID clientId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                bidService.rejectBid(bidId, clientId));
    }

    // FREELANCER withdraws their bid
    @PatchMapping("/{bidId}/withdraw")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<BidResponse> withdrawBid(
            @PathVariable UUID bidId) {
        UUID freelancerId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                bidService.withdrawBid(bidId, freelancerId));
    }
}