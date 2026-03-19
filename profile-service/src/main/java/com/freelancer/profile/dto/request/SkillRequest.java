package com.freelancer.profile.dto.request;

import com.freelancer.profile.enums.ProficiencyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SkillRequest {

    @NotBlank(message = "Skill name is required")
    private String name;            // e.g. "Java"

    @NotBlank(message = "Skill category is required")
    private String category;        // e.g. "Backend"

    @NotNull(message = "Proficiency level is required")
    private ProficiencyLevel proficiencyLevel;
}