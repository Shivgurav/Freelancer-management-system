package com.freelancer.contract.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class MessageClient {

    /*
     * BUG FIX — CONTRACT-SERVICE HAD NO MessageClient AT ALL
     *
     * When a contract is created, a chat room should be auto-created in
     * message-service. But contract-service never called message-service
     * because this client class simply didn't exist.
     *
     * This client calls POST /api/messages/room on message-service.
     * It is fire-and-forget (subscribe, not block) so a message-service
     * failure never rolls back the contract creation.
     */
    private final WebClient.Builder webClientBuilder;

    @Value("${services.message}")
    private String messageServiceUrl;

    public MessageClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    /**
     * Called right after a contract is saved.
     * Creates a chat room in message-service linking the two parties.
     *
     * @param contractId     — the newly created contract's ID
     * @param clientId       — UUID of the client
     * @param freelancerId   — UUID of the freelancer
     * @param clientName     — display name for the chat room
     * @param freelancerName — display name for the chat room
     * @param jobTitle       — shown in the chat room header
     */
    public void createChatRoom(UUID contractId,
                               UUID clientId,
                               UUID freelancerId,
                               String clientName,
                               String freelancerName,
                               String jobTitle) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("contractId",     contractId.toString());
            body.put("clientId",       clientId.toString());
            body.put("freelancerId",   freelancerId.toString());
            body.put("clientName",     clientName);
            body.put("freelancerName", freelancerName);
            body.put("jobTitle",       jobTitle);

            webClientBuilder.build()
                    .post()
                    .uri(messageServiceUrl + "/api/messages/room")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Void.class)
                    // Fire and forget — don't block contract creation
                    .subscribe(
                        null,
                        error -> log.error(
                            "Failed to create chat room for contract: {} — {}",
                            contractId, error.getMessage())
                    );

            log.info("Chat room creation triggered — contractId: {}", contractId);

        } catch (Exception e) {
            // NEVER fail contract creation because of messaging
            log.error("Could not trigger chat room creation — contractId: {} — {}",
                      contractId, e.getMessage());
        }
    }
}