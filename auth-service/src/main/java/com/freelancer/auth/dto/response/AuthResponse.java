package com.freelancer.auth.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String       accessToken;
    private String       refreshToken;
    private String       tokenType;
    private UserResponse user;        // ← nested, not flat
}