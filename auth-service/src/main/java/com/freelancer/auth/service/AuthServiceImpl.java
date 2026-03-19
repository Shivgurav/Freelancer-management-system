package com.freelancer.auth.service;

import com.freelancer.auth.client.ProfileServiceClient;
import com.freelancer.auth.dto.request.LoginRequest;
import com.freelancer.auth.dto.request.RefreshTokenRequest;
import com.freelancer.auth.dto.request.RegisterRequest;
import com.freelancer.auth.dto.response.AuthResponse;
import com.freelancer.auth.dto.response.UserResponse;
import com.freelancer.auth.entity.RefreshToken;
import com.freelancer.auth.entity.User;
import com.freelancer.auth.enums.Role;
import com.freelancer.auth.exception.AuthException;
import com.freelancer.auth.repository.RefreshTokenRepository;
import com.freelancer.auth.repository.UserRepository;
import com.freelancer.auth.service.AuthService;
import com.freelancer.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService             jwtService;
    private final PasswordEncoder        passwordEncoder;
    private final ProfileServiceClient profileServiceClient;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already registered");
        }
        if (request.getRole() == Role.ADMIN) {
            throw new AuthException(
                    "Admin accounts cannot be self-registered");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);
        log.info("Registered: {} [{}]", user.getEmail(), user.getRole());

        // Auto-create profile based on role
        // This runs AFTER user is saved so userId exists in DB
        profileServiceClient.createProfileForUser(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name()
        );

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!user.isActive()) {
            throw new AuthException("Account is deactivated. Please contact support.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Invalid email or password");
        }

        // Revoke all previous refresh tokens for this user
        refreshTokenRepository.revokeAllByUser(user);

        log.info("User logged in: {} [{}]", user.getEmail(), user.getRole());
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {

        RefreshToken storedToken = refreshTokenRepository
                .findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (storedToken.isRevoked()) {
            throw new AuthException("Refresh token has been revoked");
        }
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("Refresh token has expired. Please login again.");
        }

        // Rotate: revoke old token, issue new one
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        log.info("Token refreshed for: {}", storedToken.getUser().getEmail());
        return buildAuthResponse(storedToken.getUser());
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository
                .findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                    log.info("Logged out user, token revoked");
                });
    }

    @Override
    public UserResponse getMe(UUID userId) {
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // Private helper — builds the full auth response
    // Called after every successful register / login / refresh
    // ─────────────────────────────────────────────────────────────
    private AuthResponse buildAuthResponse(User user) {

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();

        // Save refresh token to DB
        RefreshToken tokenEntity = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiresAt(LocalDateTime.now()
                        .plusSeconds(jwtService.getRefreshExpirationMs() / 1000))
                .build();
        refreshTokenRepository.save(tokenEntity);

        // Build nested user info
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();

        // Clean response — no duplicate fields
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userResponse)     // ← single nested object
                .build();
    }
}