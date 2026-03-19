package com.freelancer.job.dto.response;

import com.freelancer.job.enums.BidStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidResponse {

    private UUID          id;
    private UUID          jobPostId;
    private UUID          freelancerId;
    private BigDecimal    bidAmount;
    private String        coverLetter;
    private Integer       estimatedDays;
    private BidStatus     status;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
}