package com.freelancer.job.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class JobRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @DecimalMin(value = "1.0", message = "Minimum budget must be at least 1")
    private BigDecimal budgetMin;

    @DecimalMin(value = "1.0", message = "Maximum budget must be at least 1")
    private BigDecimal budgetMax;

    private LocalDate deadline;

    private Integer durationDays;

    // e.g. "BEGINNER", "INTERMEDIATE", "EXPERT"
    private String experienceLevel;

    // List of skill names required for this job
    // e.g. ["Java", "Spring Boot", "PostgreSQL"]
    private List<String> requiredSkills;
}