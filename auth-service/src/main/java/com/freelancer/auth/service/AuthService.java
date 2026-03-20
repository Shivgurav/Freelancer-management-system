package com.freelancer.auth.service;

import com.freelancer.auth.dto.request.LoginRequest;
import com.freelancer.auth.dto.request.RefreshTokenRequest;
import com.freelancer.auth.dto.request.RegisterRequest;
import com.freelancer.auth.dto.response.AuthResponse;
import com.freelancer.auth.dto.response.UserInfoResponse;
import com.freelancer.auth.dto.response.UserResponse;

import java.util.UUID;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(String refreshToken);

    UserResponse getMe(UUID userId);
    
    UserInfoResponse getUserById(UUID userId);
}