package com.freelancer.contract.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

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

    // FIX: was String (comma-separated) but React sends a JSON array.
    // Jackson cannot deserialize ["url1","url2"] into a String.
    // Changed to List<String> — Jackson handles it automatically.
    // The service layer joins them with "," before saving to DB.
    private List<String> attachmentUrls;
}