package com.freelancer.contract.client;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;

@Slf4j
@Component
public class AuthClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.auth}")
    private String authServiceUrl;

    public AuthClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    // Get user info by their UUID
    // Returns their email and full name
    public UserInfo getUserInfo(UUID userId) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri(authServiceUrl +
                         "/api/auth/user/" + userId)
                    .retrieve()
                    .bodyToMono(UserInfo.class)
                    .block();

        } catch (Exception e) {
            log.error("Could not fetch user info for userId: {} — {}",
                    userId, e.getMessage());
            // Return empty info — don't fail main operation
            return new UserInfo(userId, "User", "user@unknown.com");
        }
    }

    // Simple DTO to hold user info from Auth Service
    @Data
    public static class UserInfo {
        private UUID   id;
        private String fullName;
        private String email;

        public UserInfo() {}

        public UserInfo(UUID id, String fullName, String email) {
            this.id       = id;
            this.fullName = fullName;
            this.email    = email;
        }
    }
}