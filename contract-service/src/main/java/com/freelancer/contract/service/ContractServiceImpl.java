package com.freelancer.contract.service;

import com.freelancer.contract.dto.request.ContractRequest;
import com.freelancer.contract.dto.response.ContractResponse;
import com.freelancer.contract.dto.response.MilestoneResponse;
import com.freelancer.contract.entity.Contract;
import com.freelancer.contract.enums.ContractStatus;
import com.freelancer.contract.exception.ContractException;
import com.freelancer.contract.exception.ResourceNotFoundException;
import com.freelancer.contract.repository.ContractRepository;
import com.freelancer.contract.service.ContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;

    // ── Create contract ───────────────────────────────────────────
    // Called by Job Service when bid is accepted
    @Override
    @Transactional
    public ContractResponse createContract(ContractRequest request) {

        // Check if contract already exists for this bid
        // Prevents duplicate contracts
        if (contractRepository.findByBidId(request.getBidId())
                .isPresent()) {
            throw new ContractException(
                    "Contract already exists for bid: "
                    + request.getBidId());
        }

        Contract contract = Contract.builder()
                .jobId(request.getJobId())
                .bidId(request.getBidId())
                .clientId(request.getClientId())
                .freelancerId(request.getFreelancerId())
                .agreedAmount(request.getAgreedAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .terms(request.getTerms())
                .status(ContractStatus.ACTIVE)
                .build();

        contractRepository.save(contract);
        log.info("Contract created — jobId: {} bidId: {}",
                request.getJobId(), request.getBidId());

        return mapToResponse(contract);
    }

    // ── Get contract by ID ────────────────────────────────────────
    // Used by Review Service to check contract status
    @Override
    public ContractResponse getContractById(UUID contractId) {
        return mapToResponse(findById(contractId));
    }

    // ── Get contracts by client ───────────────────────────────────
    @Override
    public List<ContractResponse> getContractsByClient(UUID clientId) {
        return contractRepository
                .findByClientId(clientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Get contracts by freelancer ───────────────────────────────
    @Override
    public List<ContractResponse> getContractsByFreelancer(
            UUID freelancerId) {
        return contractRepository
                .findByFreelancerId(freelancerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Cancel contract ───────────────────────────────────────────
    @Override
    @Transactional
    public ContractResponse cancelContract(UUID contractId,
                                            UUID userId) {
        Contract contract = findById(contractId);

        // Only client or freelancer on this contract can cancel
        boolean isParty = contract.getClientId().equals(userId)
                || contract.getFreelancerId().equals(userId);

        if (!isParty) {
            throw new ContractException(
                    "You are not authorized to cancel this contract");
        }

        if (contract.getStatus() == ContractStatus.COMPLETED) {
            throw new ContractException(
                    "Cannot cancel a completed contract");
        }

        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);
        log.info("Contract cancelled — contractId: {}", contractId);
        return mapToResponse(contract);
    }

    // ── Complete contract ─────────────────────────────────────────
    // Called internally when all milestones are APPROVED
    @Override
    @Transactional
    public ContractResponse completeContract(UUID contractId) {
        Contract contract = findById(contractId);
        contract.setStatus(ContractStatus.COMPLETED);
        contractRepository.save(contract);
        log.info("Contract COMPLETED — contractId: {}", contractId);
        return mapToResponse(contract);
    }

    // ── Private helpers ───────────────────────────────────────────

    private Contract findById(UUID contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Contract not found: " + contractId));
    }

    private ContractResponse mapToResponse(Contract c) {
        List<MilestoneResponse> milestones = c.getMilestones()
                .stream()
                .map(m -> MilestoneResponse.builder()
                        .id(m.getId())
                        .contractId(c.getId())
                        .title(m.getTitle())
                        .description(m.getDescription())
                        .amount(m.getAmount())
                        .dueDate(m.getDueDate())
                        .status(m.getStatus())
                        .sequenceOrder(m.getSequenceOrder())
                        .createdAt(m.getCreatedAt())
                        .updatedAt(m.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return ContractResponse.builder()
                .id(c.getId())
                .jobId(c.getJobId())
                .bidId(c.getBidId())
                .clientId(c.getClientId())
                .freelancerId(c.getFreelancerId())
                .agreedAmount(c.getAgreedAmount())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .status(c.getStatus())
                .terms(c.getTerms())
                .milestones(milestones)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}