package com.freelancer.profile.dto.response;

import com.freelancer.profile.enums.ProficiencyLevel;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponse {

    private UUID             id;
    private String           name;
    private String           category;
    private ProficiencyLevel proficiencyLevel;
}