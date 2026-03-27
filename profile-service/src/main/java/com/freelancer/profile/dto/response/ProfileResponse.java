package com.freelancer.profile.dto.response;

import com.freelancer.profile.enums.Availability;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private UUID             id;
    private UUID             userId;
    private String           title;
    private String           bio;
    private BigDecimal       hourlyRate;
    private String           location;
    private Integer          yearsOfExperience;
    private String           portfolioUrl;
    private String           linkedinUrl;
    private String           githubUrl;
    private Availability     availability;
    private BigDecimal       avgRating;
    private Integer          totalReviews;
    private Integer          totalJobsCompleted;
    private List<SkillResponse> skills;
    private LocalDateTime    createdAt;
    private LocalDateTime    updatedAt;
    private UUID resumeFileId;
}