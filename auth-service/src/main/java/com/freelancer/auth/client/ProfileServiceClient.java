package com.freelancer.auth.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;

@Slf4j
@Component
public class ProfileServiceClient {

    private final WebClient webClient;

    public ProfileServiceClient(
            @Value("${services.profile}")
            String profileServiceUrl) {

        this.webClient = WebClient.builder()
                .baseUrl(profileServiceUrl)
                .build();
    }

    // Called after registration
    // Automatically creates correct profile based on role
    public void createProfileForUser(UUID userId,
                                      String firstName,
                                      String lastName,
                                      String role) {
        try {
            if (role.equals("FREELANCER")) {
                createFreelancerProfile(userId, firstName, lastName);
            } else if (role.equals("CLIENT")) {
                createClientProfile(userId, firstName, lastName);
            }
        } catch (Exception e) {
            // Log but don't fail registration
            // Profile can be completed later
            log.error("Failed to auto-create profile for userId: {}" +
                      " — {}", userId, e.getMessage());
        }
    }

    private void createFreelancerProfile(UUID userId,
                                          String firstName,
                                          String lastName) {
        // Build a minimal default profile
        // User can update it later from their dashboard
        var body = new java.util.HashMap<String, Object>();
        body.put("title", firstName + " " + lastName);
        body.put("bio", "");
        body.put("availability", "FULL_TIME");

        webClient.post()
                .uri("/api/profiles/freelancer/init")
                // Pass userId directly — internal call, no JWT needed
                .header("X-User-Id",   userId.toString())
                .header("X-User-Role", "FREELANCER")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .block();   // wait for profile to be created

        log.info("Freelancer profile auto-created for userId: {}",
                userId);
    }

    private void createClientProfile(UUID userId,
            String firstName,
            String lastName) {
var body = new java.util.HashMap<String, Object>();

// Pass person's real name from registration
body.put("firstName",   firstName);
body.put("lastName",    lastName);
body.put("companyName", "");   // client fills this in later
body.put("description", "");

webClient.post()
.uri("/api/profiles/client/init")
.header("X-User-Id",   userId.toString())
.header("X-User-Role", "CLIENT")
.bodyValue(body)
.retrieve()
.bodyToMono(Void.class)
.block();

log.info("Client profile auto-created for userId: {}", userId);
}
}