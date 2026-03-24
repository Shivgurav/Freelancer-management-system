package com.freelancer.auth.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class ProfileServiceClient {

    // CRITICAL FIX: Original code created a plain WebClient:
    //   WebClient.builder().baseUrl(profileServiceUrl).build()
    // Plain WebClient cannot resolve Eureka service names like
    // "http://profile-service" — needs the @LoadBalanced builder bean.
    // Now injecting the @LoadBalanced WebClient.Builder instead.
    private final WebClient.Builder webClientBuilder;

    @Value("${services.profile}")
    private String profileServiceUrl;

    public ProfileServiceClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public void createProfileForUser(UUID userId,
                                      String firstName,
                                      String lastName,
                                      String role) {
        try {
            if ("FREELANCER".equals(role)) {
                createFreelancerProfile(userId, firstName, lastName);
            } else if ("CLIENT".equals(role)) {
                createClientProfile(userId, firstName, lastName);
            }
        } catch (Exception e) {
            log.error("Failed to auto-create profile for userId: {} — {}",
                      userId, e.getMessage());
        }
    }

    private void createFreelancerProfile(UUID userId,
                                          String firstName,
                                          String lastName) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", firstName + " " + lastName);
        body.put("bio", "");
        body.put("availability", "FULL_TIME");

        webClientBuilder.build()
                .post()
                .uri(profileServiceUrl + "/api/profiles/freelancer/init")
                .header("X-User-Id",   userId.toString())
                .header("X-User-Role", "FREELANCER")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .block();

        log.info("Freelancer profile auto-created for userId: {}", userId);
    }

    private void createClientProfile(UUID userId,
                                      String firstName,
                                      String lastName) {
        Map<String, Object> body = new HashMap<>();
        body.put("firstName",   firstName);
        body.put("lastName",    lastName);
        body.put("companyName", "");
        body.put("description", "");

        webClientBuilder.build()
                .post()
                .uri(profileServiceUrl + "/api/profiles/client/init")
                .header("X-User-Id",   userId.toString())
                .header("X-User-Role", "CLIENT")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .block();

        log.info("Client profile auto-created for userId: {}", userId);
    }
}