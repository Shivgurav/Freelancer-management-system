package com.freelancer.auth.dto.response;

import com.freelancer.auth.enums.Role;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {
    private UUID   id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private Role   role;
}