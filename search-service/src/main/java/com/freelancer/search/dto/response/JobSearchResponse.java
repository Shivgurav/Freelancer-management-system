package com.freelancer.search.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchResponse {

    private UUID         jobId;
    private UUID         clientId;
    private String       title;
    private String       description;
    private BigDecimal   budgetMin;
    private BigDecimal   budgetMax;
    private List<String> requiredSkills;
    private String       experienceLevel;
    private Integer      totalBids;
    private Integer      durationDays;
}