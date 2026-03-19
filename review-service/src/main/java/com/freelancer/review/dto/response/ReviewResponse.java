package com.freelancer.review.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private UUID          id;
    private UUID          contractId;
    private UUID          reviewerId;
    private UUID          revieweeId;
    private String        reviewerRole;  // CLIENT or FREELANCER
    private Integer       rating;
    private String        comment;
    private LocalDateTime createdAt;
}