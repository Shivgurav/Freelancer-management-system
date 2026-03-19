package com.freelancer.job.dto.response;

import com.freelancer.job.enums.JobStatus;
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
public class JobResponse {

    private UUID          id;
    private UUID          clientId;
    private String        title;
    private String        description;
    private BigDecimal    budgetMin;
    private BigDecimal    budgetMax;
    private LocalDate     deadline;
    private Integer       durationDays;
    private String        experienceLevel;
    private List<String>  requiredSkills;
    private JobStatus     status;
    private Integer       totalBids;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}