package com.freelancer.contract.repository;

import com.freelancer.contract.entity.Contract;
import com.freelancer.contract.enums.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository
        extends JpaRepository<Contract, UUID> {

    // All contracts for a client
    List<Contract> findByClientId(UUID clientId);

    // All contracts for a freelancer
    List<Contract> findByFreelancerId(UUID freelancerId);

    // Find contract by the bid that created it
    Optional<Contract> findByBidId(UUID bidId);

    // Active contracts for a user
    List<Contract> findByClientIdAndStatus(
            UUID clientId, ContractStatus status);

    List<Contract> findByFreelancerIdAndStatus(
            UUID freelancerId, ContractStatus status);
}