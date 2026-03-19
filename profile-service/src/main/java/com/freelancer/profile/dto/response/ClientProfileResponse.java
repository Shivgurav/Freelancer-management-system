package com.freelancer.profile.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfileResponse {

    private UUID          id;
    private UUID          userId;

    // Person info
    private String        firstName;
    private String        lastName;

    // Company info
    private String        companyName;
    private String        description;
    private String        industry;
    private String        companySize;
    private String        location;
    private String        websiteUrl;
    private String        linkedinUrl;

    private Integer       totalJobsPosted;
    private Integer       totalJobsCompleted;
    private BigDecimal    avgRating;
    private Integer       totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}