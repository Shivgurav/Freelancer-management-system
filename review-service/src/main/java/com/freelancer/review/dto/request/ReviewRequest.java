package com.freelancer.review.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewRequest {

    @NotNull(message = "Contract ID is required")
    private UUID contractId;

    // Who is being reviewed
    // Frontend passes the other person's userId
    @NotNull(message = "Reviewee ID is required")
    private UUID revieweeId;

    // Star rating — must be between 1 and 5
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    // Optional written comment
    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    private String comment;
}