package com.freelancer.contract.dto.response;

import com.freelancer.contract.enums.MilestoneStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneResponse {

    private UUID            id;
    private UUID            contractId;
    private String          title;
    private String          description;
    private BigDecimal      amount;
    private LocalDate       dueDate;
    private MilestoneStatus status;
    private Integer         sequenceOrder;
    private LocalDateTime   createdAt;
    private LocalDateTime   updatedAt;
}