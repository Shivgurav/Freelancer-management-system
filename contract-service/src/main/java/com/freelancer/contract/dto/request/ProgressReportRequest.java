package com.freelancer.contract.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ProgressReportRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Percentage complete is required")
    @Min(value = 0,   message = "Percentage cannot be less than 0")
    @Max(value = 100, message = "Percentage cannot exceed 100")
    private Integer percentageComplete;

    // Comma separated file URLs from File Service
    private String attachmentUrls;
}