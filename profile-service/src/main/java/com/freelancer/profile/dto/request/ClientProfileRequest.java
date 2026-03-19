package com.freelancer.profile.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClientProfileRequest {

    // Person's name — required
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    // Company details — optional
    // Not everyone posting jobs has a company
    private String companyName;

    private String description;

    private String industry;

    private String companySize;

    private String location;

    private String websiteUrl;

    private String linkedinUrl;
}