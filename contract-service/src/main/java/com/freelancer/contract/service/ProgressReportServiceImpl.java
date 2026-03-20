package com.freelancer.contract.service;

import com.freelancer.contract.client.AuthClient;
import com.freelancer.contract.client.AuthClient.UserInfo;
import com.freelancer.contract.client.NotificationClient;
import com.freelancer.contract.dto.request.ProgressReportRequest;
import com.freelancer.contract.dto.response.ProgressReportResponse;
import com.freelancer.contract.entity.Contract;
import com.freelancer.contract.entity.Milestone;
import com.freelancer.contract.entity.ProgressReport;
import com.freelancer.contract.enums.MilestoneStatus;
import com.freelancer.contract.enums.ReportStatus;
import com.freelancer.contract.exception.ContractException;
import com.freelancer.contract.exception.ResourceNotFoundException;
import com.freelancer.contract.repository.MilestoneRepository;
import com.freelancer.contract.repository.ProgressReportRepository;
import com.freelancer.contract.service.MilestoneService;
import com.freelancer.contract.service.ProgressReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressReportServiceImpl implements ProgressReportService {

    private final ProgressReportRepository reportRepository;
    private final MilestoneRepository      milestoneRepository;
    private final MilestoneService         milestoneService;
    private final NotificationClient notificationClient;
    private final AuthClient authClient;

    // ── Submit progress report ────────────────────────────────────
    // Freelancer submits this to show work done on a milestone
    @Override
    @Transactional
    public ProgressReportResponse submitReport(
            UUID milestoneId,
            UUID freelancerId,
            ProgressReportRequest request) {

        Milestone milestone = findMilestone(milestoneId);

        // Verify this freelancer belongs to the contract
        if (!milestone.getContract()
                .getFreelancerId().equals(freelancerId)) {
            throw new ContractException(
                    "You are not the freelancer on this contract");
        }

        // Milestone must be IN_PROGRESS or REVISION
        // Cannot submit report on PENDING or APPROVED milestone
        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS
                && milestone.getStatus() != MilestoneStatus.REVISION) {
            throw new ContractException(
                    "Milestone must be IN_PROGRESS or REVISION " +
                    "to submit a report");
        }

        ProgressReport report = ProgressReport.builder()
                .milestone(milestone)
                .submittedBy(freelancerId)
                .title(request.getTitle())
                .description(request.getDescription())
                .percentageComplete(request.getPercentageComplete())
                .attachmentUrls(request.getAttachmentUrls())
                .status(ReportStatus.SUBMITTED)
                .build();
        Contract contract=milestone.getContract();
        UserInfo clientInfo=authClient.getUserInfo(contract.getClientId());
        reportRepository.save(report);
        notificationClient.send(
        	    "PROGRESS_REPORT_SUBMITTED",
        	    clientInfo.getEmail(),
        	    clientInfo.getFullName()
        	    ,
        	    Map.of(
        	        "milestoneTitle", milestone.getTitle(),
        	        "reportTitle",    report.getTitle(),
        	        "percentage",     report.getPercentageComplete().toString(),
        	        "contractId",     milestone.getContract().getId().toString()
        	    )
        	);

        // Move milestone to SUBMITTED status
        // So client knows to review it
        milestone.setStatus(MilestoneStatus.SUBMITTED);
        milestoneRepository.save(milestone);

        log.info("Progress report submitted — milestoneId: {} " +
                 "by freelancerId: {}", milestoneId, freelancerId);

        return mapToResponse(report);
    }

    // ── Get all reports for milestone ─────────────────────────────
    @Override
    public List<ProgressReportResponse> getReportsForMilestone(
            UUID milestoneId) {
        return reportRepository
                .findByMilestoneIdOrderByCreatedAtDesc(milestoneId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Client approves report ────────────────────────────────────
    // Approving a report = approving the milestone
    // Which may trigger contract completion
    @Override
    @Transactional
    public ProgressReportResponse approveReport(UUID reportId,
                                                 UUID clientId) {
        ProgressReport report = findReport(reportId);
        Milestone milestone   = report.getMilestone();

        // Only client can approve
        if (!milestone.getContract().getClientId().equals(clientId)) {
            throw new ContractException(
                    "Only the client can approve reports");
        }

        if (report.getStatus() != ReportStatus.SUBMITTED
                && report.getStatus() != ReportStatus.REVIEWED) {
            throw new ContractException(
                    "Can only approve SUBMITTED or REVIEWED reports");
        }
         Contract contract=milestone.getContract();
         UserInfo freelancerInfo=authClient.getUserInfo(contract.getFreelancerId());
        report.setStatus(ReportStatus.APPROVED);
        reportRepository.save(report);
        notificationClient.send(
        	    "REPORT_APPROVED",
        	    freelancerInfo.getEmail(),
        	    freelancerInfo.getFullName(),
        	    Map.of(
        	        "milestoneTitle", milestone.getTitle(),
        	        "reportTitle",    report.getTitle()
        	    )
        	);

        // This triggers milestone approval
        // Which may trigger contract completion
        milestoneService.approveMilestone(
                milestone.getId(), clientId);

        log.info("Progress report APPROVED — reportId: {}", reportId);
        return mapToResponse(report);
    }

    // ── Client requests revision ──────────────────────────────────
    @Override
    @Transactional
    public ProgressReportResponse requestRevision(UUID reportId,
                                                   UUID clientId,
                                                   String feedback) {
        ProgressReport report = findReport(reportId);
        Milestone milestone   = report.getMilestone();

        if (!milestone.getContract().getClientId().equals(clientId)) {
            throw new ContractException(
                    "Only the client can request revision");
        }

        if (report.getStatus() != ReportStatus.SUBMITTED
                && report.getStatus() != ReportStatus.REVIEWED) {
            throw new ContractException(
                    "Can only request revision on " +
                    "SUBMITTED or REVIEWED reports");
        }

        report.setStatus(ReportStatus.NEEDS_REVISION);
        Contract contract=milestone.getContract();
        UserInfo freelancerInfo=authClient.getUserInfo(contract.getFreelancerId());
        notificationClient.send(
        	    "REVISION_REQUESTED",
        	    freelancerInfo.getEmail(),
        	    freelancerInfo.getFullName(),
        	    Map.of(
        	        "milestoneTitle", milestone.getTitle(),
        	        "feedback",       feedback,
        	        "contractId",     milestone.getContract().getId().toString()
        	    )
        	);
        report.setClientFeedback(feedback);
        reportRepository.save(report);
        

        // Move milestone back so freelancer can resubmit
        milestoneService.requestRevision(
                milestone.getId(), clientId);

        log.info("Revision requested on reportId: {}", reportId);
        return mapToResponse(report);
    }

    // ── Private helpers ───────────────────────────────────────────

    private Milestone findMilestone(UUID milestoneId) {
        return milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Milestone not found: " + milestoneId));
    }

    private ProgressReport findReport(UUID reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Progress report not found: " + reportId));
    }

    private ProgressReportResponse mapToResponse(ProgressReport r) {
        // Convert comma separated URLs back to list
        List<String> urls = (r.getAttachmentUrls() != null
                && !r.getAttachmentUrls().isEmpty())
                ? Arrays.asList(r.getAttachmentUrls().split(","))
                : List.of();

        return ProgressReportResponse.builder()
                .id(r.getId())
                .milestoneId(r.getMilestone().getId())
                .submittedBy(r.getSubmittedBy())
                .title(r.getTitle())
                .description(r.getDescription())
                .percentageComplete(r.getPercentageComplete())
                .clientFeedback(r.getClientFeedback())
                .status(r.getStatus())
                .attachmentUrls(urls)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}