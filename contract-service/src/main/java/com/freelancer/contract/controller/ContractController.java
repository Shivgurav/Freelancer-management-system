package com.freelancer.contract.controller;

import com.freelancer.contract.dto.request.ContractRequest;
import com.freelancer.contract.dto.response.ContractResponse;
import com.freelancer.contract.security.UserPrincipal;
import com.freelancer.contract.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    // Internal endpoint — called by Job Service when bid accepted
    // Not called by frontend directly
    @PostMapping
    public ResponseEntity<ContractResponse> createContract(
            @Valid @RequestBody ContractRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(contractService.createContract(request));
    }

    // Get contract by ID
    // Used by Review Service to validate contract status
    @GetMapping("/{contractId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<ContractResponse> getContract(
            @PathVariable UUID contractId) {
        return ResponseEntity.ok(
                contractService.getContractById(contractId));
    }

    // Client views all their contracts
    @GetMapping("/my-contracts")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<ContractResponse>> getMyContracts() {
        UUID   userId = UserPrincipal.getCurrentUserId();
        String role   = UserPrincipal.getCurrentUserRole();

        List<ContractResponse> contracts =
                "CLIENT".equals(role)
                ? contractService.getContractsByClient(userId)
                : contractService.getContractsByFreelancer(userId);

        return ResponseEntity.ok(contracts);
    }

    // Cancel contract
    @PatchMapping("/{contractId}/cancel")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<ContractResponse> cancelContract(
            @PathVariable UUID contractId) {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                contractService.cancelContract(contractId, userId));
    }
}