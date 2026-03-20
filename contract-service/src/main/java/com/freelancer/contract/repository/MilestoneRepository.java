package com.freelancer.contract.repository;

import com.freelancer.contract.entity.Milestone;
import com.freelancer.contract.enums.MilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MilestoneRepository
        extends JpaRepository<Milestone, UUID> {

    // All milestones for a contract in order
    List<Milestone> findByContractIdOrderBySequenceOrderAsc(
            UUID contractId);

    // Check if all milestones are approved
    // Used to auto-complete the contract
    boolean existsByContractIdAndStatusNot(
            UUID contractId, MilestoneStatus status);

    // Count approved milestones
    long countByContractIdAndStatus(
            UUID contractId, MilestoneStatus status);
}