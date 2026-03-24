package com.freelancer.profile.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class SearchClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.search}")
    private String searchServiceUrl;

    public SearchClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    // Called after profile is created or updated
    public void syncFreelancerProfile(Map<String, Object> profileData) {
        try {
            webClientBuilder.build()
                    .post()
                    .uri(searchServiceUrl +
                         "/api/search/sync/freelancer")
                    .bodyValue(profileData)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribe(
                        null,
                        err -> log.error("Search sync failed: {}",
                                err.getMessage())
                    );
        } catch (Exception e) {
            log.error("Could not sync to search: {}", e.getMessage());
        }
    }

    // Called after rating is updated
    public void updateRating(UUID profileId,
                              double avgRating,
                              int totalReviews) {
        try {
            webClientBuilder.build()
                    .patch()
                    .uri(searchServiceUrl +
                         "/api/search/sync/freelancer/"
                         + profileId + "/rating")
                    .bodyValue(Map.of(
                            "avgRating",    avgRating,
                            "totalReviews", totalReviews
                    ))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribe(
                        null,
                        err -> log.error("Rating sync failed: {}",
                                err.getMessage())
                    );
        } catch (Exception e) {
            log.error("Could not sync rating: {}", e.getMessage());
        }
    }
}