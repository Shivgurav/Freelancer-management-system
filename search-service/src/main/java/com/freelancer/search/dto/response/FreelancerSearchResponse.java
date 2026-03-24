package com.freelancer.search.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreelancerSearchResponse {

    private UUID          profileId;
    private UUID          userId;
    private String        fullName;
    private String        title;
    private String        location;
    private BigDecimal    hourlyRate;
    private Integer       yearsOfExperience;
    private List<String>  skills;
    private BigDecimal    avgRating;
    private Integer       totalReviews;
    private Integer       totalJobsCompleted;
    private String        availability;
}