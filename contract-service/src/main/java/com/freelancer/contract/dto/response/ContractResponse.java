package com.freelancer.contract.dto.response;

import com.freelancer.contract.enums.ContractStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {

    private UUID             id;
    private UUID             jobId;
    private UUID             bidId;
    private UUID             clientId;
    private UUID             freelancerId;
    private BigDecimal       agreedAmount;
    private LocalDate        startDate;
    private LocalDate        endDate;
    private ContractStatus   status;
    private String           terms;
    private List<MilestoneResponse> milestones;
    private LocalDateTime    createdAt;
    private LocalDateTime    updatedAt;
}