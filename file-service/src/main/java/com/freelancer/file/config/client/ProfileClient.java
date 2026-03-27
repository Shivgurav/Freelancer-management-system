package com.freelancer.file.config.client;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class ProfileClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.profile}")
    private String profileServiceUrl;

    public ProfileClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public void updateProfile(UUID userId, UUID fileId) {

        Map<String, Object> body = new HashMap<>();
        body.put("resumeFileId", fileId);

        webClientBuilder.build()
                .put()
                .uri(profileServiceUrl + "/api/profiles/internal/client/{userId}/resume", userId)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .block(); // blocking because it's internal call
    }
}