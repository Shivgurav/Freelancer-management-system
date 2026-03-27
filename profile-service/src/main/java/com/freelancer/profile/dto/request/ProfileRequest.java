package com.freelancer.profile.dto.request;

import com.freelancer.profile.enums.Availability;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ProfileRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String bio;

    @DecimalMin(value = "0.0",
                inclusive = false,
                message = "Hourly rate must be greater than 0")
    private BigDecimal hourlyRate;

    private String  location;

    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 50, message = "Years of experience cannot exceed 50")
    private Integer yearsOfExperience;

    private String portfolioUrl;
    private String linkedinUrl;
    private String githubUrl;

    private Availability availability;

    // List of skills to add to the profile
    private List<SkillRequest> skills;
    
    private UUID resumeFileId;
}