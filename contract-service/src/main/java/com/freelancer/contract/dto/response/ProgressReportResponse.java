package com.freelancer.contract.dto.response;

import com.freelancer.contract.enums.ReportStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressReportResponse {

    private UUID          id;
    private UUID          milestoneId;
    private UUID          submittedBy;
    private String        title;
    private String        description;
    private Integer       percentageComplete;
    private String        clientFeedback;
    private ReportStatus  status;
    private List<String>  attachmentUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}