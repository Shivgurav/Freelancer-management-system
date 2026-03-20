package com.freelancer.contract.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ContractRequest {

    @NotNull(message = "Job ID is required")
    private UUID jobId;

    @NotNull(message = "Bid ID is required")
    private UUID bidId;

    @NotNull(message = "Client ID is required")
    private UUID clientId;

    @NotNull(message = "Freelancer ID is required")
    private UUID freelancerId;

    @NotNull(message = "Agreed amount is required")
    @DecimalMin(value = "1.0",
                message = "Amount must be greater than 0")
    private BigDecimal agreedAmount;

    private LocalDate startDate;
    private LocalDate endDate;
    private String    terms;
}