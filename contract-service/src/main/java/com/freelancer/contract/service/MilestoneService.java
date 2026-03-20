package com.freelancer.contract.service;

import com.freelancer.contract.dto.request.MilestoneRequest;
import com.freelancer.contract.dto.response.MilestoneResponse;

import java.util.List;
import java.util.UUID;

public interface MilestoneService {

    // Client adds a milestone to a contract
    MilestoneResponse addMilestone(UUID contractId,
                                    UUID clientId,
                                    MilestoneRequest request);

    // Get all milestones for a contract
    List<MilestoneResponse> getMilestonesForContract(UUID contractId);

    // Freelancer starts working on a milestone
    MilestoneResponse startMilestone(UUID milestoneId,
                                      UUID freelancerId);

    // Client approves a milestone
    // If all milestones approved → contract auto-completes
    MilestoneResponse approveMilestone(UUID milestoneId,
                                        UUID clientId);

    // Client requests revision on a milestone
    MilestoneResponse requestRevision(UUID milestoneId,
                                       UUID clientId);
}