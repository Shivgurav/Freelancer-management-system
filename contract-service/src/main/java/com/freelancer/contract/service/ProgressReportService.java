package com.freelancer.contract.service;

import com.freelancer.contract.dto.request.ProgressReportRequest;
import com.freelancer.contract.dto.response.ProgressReportResponse;

import java.util.List;
import java.util.UUID;

public interface ProgressReportService {

    // Freelancer submits a progress report for a milestone
    ProgressReportResponse submitReport(UUID milestoneId,
                                         UUID freelancerId,
                                         ProgressReportRequest request);

    // Get all reports for a milestone
    List<ProgressReportResponse> getReportsForMilestone(
            UUID milestoneId);

    // Client approves a progress report
    // This moves milestone to APPROVED status
    ProgressReportResponse approveReport(UUID reportId,
                                          UUID clientId);

    // Client requests revision
    // Freelancer must submit a new report
    ProgressReportResponse requestRevision(UUID reportId,
                                            UUID clientId,
                                            String feedback);
}