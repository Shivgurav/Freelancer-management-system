package com.freelancer.contract.service;

import com.freelancer.contract.dto.request.ContractRequest;
import com.freelancer.contract.dto.response.ContractResponse;

import java.util.List;
import java.util.UUID;

public interface ContractService {

    // Called by Job Service when bid is accepted
    ContractResponse createContract(ContractRequest request);

    // Get contract by ID
    // Used by Review Service to validate contract status
    ContractResponse getContractById(UUID contractId);

    // Get all contracts for a client
    List<ContractResponse> getContractsByClient(UUID clientId);

    // Get all contracts for a freelancer
    List<ContractResponse> getContractsByFreelancer(UUID freelancerId);

    // Client or freelancer cancels contract
    ContractResponse cancelContract(UUID contractId, UUID userId);

    // Called internally when all milestones are approved
    ContractResponse completeContract(UUID contractId);
}