package com.freelancer.contract.client;
// Change package per service:
// com.freelancer.auth.client
// com.freelancer.contract.client
// com.freelancer.review.client

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class NotificationClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.notification}")
    private String notificationServiceUrl;

    public NotificationClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    /**
     * Send a notification — fire and forget
     * Does NOT block the calling method
     * Does NOT fail the calling method if notification fails
     *
     * @param event          — plain string e.g. "BID_ACCEPTED"
     * @param recipientEmail — who gets the email
     * @param recipientName  — their name shown in email
     * @param data           — dynamic data for email template
     */
    public void send(String event,
                     String recipientEmail,
                     String recipientName,
                     Map<String, String> data) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("event",          event);
            body.put("recipientEmail", recipientEmail);
            body.put("recipientName",  recipientName);
            body.put("data",           data);

            webClientBuilder.build()
                    .post()
                    .uri(notificationServiceUrl
                         + "/api/notifications/send")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Void.class)
                    // subscribe() = fire and forget
                    // does not wait for response
                    // does not block
                    .subscribe(
                        null,
                        error -> log.error(
                            "Notification failed — event: {} " +
                            "error: {}", event, error.getMessage())
                    );

            log.info("Notification triggered — event: {} to: {}",
                    event, recipientEmail);

        } catch (Exception e) {
            // NEVER fail the main operation
            // Notification failure should not affect
            // bid acceptance, contract creation etc.
            log.error("Could not trigger notification — " +
                      "event: {} error: {}", event, e.getMessage());
        }
    }
}