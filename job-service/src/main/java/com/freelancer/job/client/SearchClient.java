package com.freelancer.job.client;

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

    // Called after job is posted or updated
    public void syncJob(Map<String, Object> jobData) {
        try {
            webClientBuilder.build()
                    .post()
                    .uri(searchServiceUrl + "/api/search/sync/job")
                    .bodyValue(jobData)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribe(
                        null,
                        err -> log.error("Job sync failed: {}",
                                err.getMessage())
                    );
        } catch (Exception e) {
            log.error("Could not sync job: {}", e.getMessage());
        }
    }

    // Called when job status changes
    public void updateJobStatus(UUID jobId, String status) {
        try {
            webClientBuilder.build()
                    .patch()
                    .uri(searchServiceUrl +
                         "/api/search/sync/job/" + jobId + "/status")
                    .bodyValue(Map.of("status", status))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribe(
                        null,
                        err -> log.error("Status sync failed: {}",
                                err.getMessage())
                    );
        } catch (Exception e) {
            log.error("Could not sync status: {}", e.getMessage());
        }
    }
}