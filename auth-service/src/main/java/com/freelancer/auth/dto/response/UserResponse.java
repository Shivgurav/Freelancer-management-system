package com.freelancer.auth.dto.response;

import com.freelancer.auth.enums.Role;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID          id;
    private String        email;
    private String        firstName;
    private String        lastName;
    private Role          role;
    private boolean       isActive;
    private LocalDateTime createdAt;
}