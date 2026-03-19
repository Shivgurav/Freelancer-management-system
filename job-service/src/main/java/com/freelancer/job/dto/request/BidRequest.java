package com.freelancer.job.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BidRequest {

    @NotNull(message = "Bid amount is required")
    @DecimalMin(value = "1.0", message = "Bid amount must be at least 1")
    private BigDecimal bidAmount;

    @NotBlank(message = "Cover letter is required")
    @Size(min = 50,
          message = "Cover letter must be at least 50 characters")
    private String coverLetter;

    @NotNull(message = "Estimated days is required")
    @Min(value = 1, message = "Estimated days must be at least 1")
    private Integer estimatedDays;
}