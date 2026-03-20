package com.freelancer.contract.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MilestoneRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @DecimalMin(value = "0.0",
                message = "Amount cannot be negative")
    private BigDecimal amount;

    private LocalDate dueDate;

    private Integer sequenceOrder;
}