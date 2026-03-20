package com.freelancer.contract.service;

import com.freelancer.contract.client.AuthClient;
import com.freelancer.contract.client.AuthClient.UserInfo;
import com.freelancer.contract.client.NotificationClient;
import com.freelancer.contract.dto.request.MilestoneRequest;
import com.freelancer.contract.dto.response.MilestoneResponse;
import com.freelancer.contract.entity.Contract;
import com.freelancer.contract.entity.Milestone;
import com.freelancer.contract.enums.ContractStatus;
import com.freelancer.contract.enums.MilestoneStatus;
import com.freelancer.contract.exception.ContractException;
import com.freelancer.contract.exception.ResourceNotFoundException;
import com.freelancer.contract.repository.ContractRepository;
import com.freelancer.contract.repository.MilestoneRepository;
import com.freelancer.contract.service.ContractService;
import com.freelancer.contract.service.MilestoneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MilestoneServiceImpl implements MilestoneService {

    private final MilestoneRepository  milestoneRepository;
    private final ContractRepository   contractRepository;
    private final ContractService      contractService;
    private final NotificationClient notificationClient;
    private final AuthClient authClient;

    // ── Add milestone ─────────────────────────────────────────────
    // Only CLIENT can add milestones to their contract
    @Override
    @Transactional
    public MilestoneResponse addMilestone(UUID contractId,
                                           UUID clientId,
                                           MilestoneRequest request) {
        Contract contract = findContract(contractId);

        // Only the client on this contract can add milestones
        if (!contract.getClientId().equals(clientId)) {
            throw new ContractException(
                    "Only the client can add milestones");
        }

        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new ContractException(
                    "Can only add milestones to an ACTIVE contract");
        }

        Milestone milestone = Milestone.builder()
                .contract(contract)
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .sequenceOrder(request.getSequenceOrder())
                .status(MilestoneStatus.PENDING)
                .build();

        milestoneRepository.save(milestone);
        log.info("Milestone added to contractId: {} — title: {}",
                contractId, milestone.getTitle());
        return mapToResponse(milestone);
    }

    // ── Get milestones ────────────────────────────────────────────
    @Override
    public List<MilestoneResponse> getMilestonesForContract(
            UUID contractId) {
        return milestoneRepository
                .findByContractIdOrderBySequenceOrderAsc(contractId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Freelancer starts a milestone ─────────────────────────────
    @Override
    @Transactional
    public MilestoneResponse startMilestone(UUID milestoneId,
                                             UUID freelancerId) {
        Milestone milestone = findMilestone(milestoneId);

        // Verify freelancer belongs to this contract
        if (!milestone.getContract()
                .getFreelancerId().equals(freelancerId)) {
            throw new ContractException(
                    "You are not the freelancer on this contract");
        }

        if (milestone.getStatus() != MilestoneStatus.PENDING) {
            throw new ContractException(
                    "Only PENDING milestones can be started");
        }

        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        milestoneRepository.save(milestone);
        log.info("Milestone started — milestoneId: {}", milestoneId);
        return mapToResponse(milestone);
    }

    // ── Client approves milestone ─────────────────────────────────
    // This is the key method — if ALL milestones approved
    // then the contract auto-completes
    @Override
    @Transactional
    public MilestoneResponse approveMilestone(UUID milestoneId,
                                               UUID clientId) {
        Milestone milestone = findMilestone(milestoneId);
        Contract  contract  = milestone.getContract();

        // Only the client can approve
        if (!contract.getClientId().equals(clientId)) {
            throw new ContractException(
                    "Only the client can approve milestones");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new ContractException(
                    "Only SUBMITTED milestones can be approved");
        }

        milestone.setStatus(MilestoneStatus.APPROVED);
        milestoneRepository.save(milestone);
        UserInfo freelancerInfo=authClient.getUserInfo(contract.getFreelancerId());
        
        notificationClient.send(
        	    "MILESTONE_APPROVED",
        	    freelancerInfo.getEmail(),
        	    freelancerInfo.getFullName(),
        	    Map.of(
        	        "milestoneTitle",  milestone.getTitle(),
        	        "milestoneAmount", milestone.getAmount().toString()
        	    )
        	);
        log.info("Milestone APPROVED — milestoneId: {}", milestoneId);

        // Check if ALL milestones are now approved
        // If yes — auto complete the contract
        checkAndCompleteContract(contract);

        return mapToResponse(milestone);
    }

    // ── Client requests revision ──────────────────────────────────
    @Override
    @Transactional
    public MilestoneResponse requestRevision(UUID milestoneId,
                                              UUID clientId) {
        Milestone milestone = findMilestone(milestoneId);

        if (!milestone.getContract().getClientId().equals(clientId)) {
            throw new ContractException(
                    "Only the client can request revision");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new ContractException(
                    "Can only request revision on SUBMITTED milestones");
        }

        milestone.setStatus(MilestoneStatus.REVISION);
        milestoneRepository.save(milestone);
        log.info("Revision requested — milestoneId: {}", milestoneId);
        return mapToResponse(milestone);
    }

    // ── Private helpers ───────────────────────────────────────────

    // Checks if all milestones APPROVED → completes the contract
    private void checkAndCompleteContract(Contract contract) {
        boolean anyNotApproved = milestoneRepository
                .existsByContractIdAndStatusNot(
                        contract.getId(),
                        MilestoneStatus.APPROVED);

        if (!anyNotApproved) {
            // All milestones are APPROVED
            contractService.completeContract(contract.getId());
            log.info("All milestones approved — " +
                     "Contract auto-completed: {}", contract.getId());
        }
    }

    private Contract findContract(UUID contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Contract not found: " + contractId));
    }

    private Milestone findMilestone(UUID milestoneId) {
        return milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Milestone not found: " + milestoneId));
    }

    private MilestoneResponse mapToResponse(Milestone m) {
        return MilestoneResponse.builder()
                .id(m.getId())
                .contractId(m.getContract().getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .amount(m.getAmount())
                .dueDate(m.getDueDate())
                .status(m.getStatus())
                .sequenceOrder(m.getSequenceOrder())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}