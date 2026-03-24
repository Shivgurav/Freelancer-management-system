package com.freelancer.message.controller;

import com.freelancer.message.dto.ChatMessageRequest;
import com.freelancer.message.dto.MessageResponse;
import com.freelancer.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class MessageController {

    private final MessageService        messageService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Frontend sends to: /app/chat/send
     *
     * Flow:
     * 1. Save message to Supabase PostgreSQL
     * 2. Push to SENDER via WebSocket (they see it)
     * 3. Push to RECIPIENT via WebSocket (they see it)
     */
    @MessageMapping("/chat/send")
    public void sendMessage(
            @Payload ChatMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        // Get userId stored in WebSocket session
        // during the initial connection handshake
        Map<String, Object> attrs =
                headerAccessor.getSessionAttributes();

        if (attrs == null || attrs.get("userId") == null) {
            log.warn("Unauthenticated WebSocket message");
            return;
        }

        UUID   senderId   = UUID.fromString(
                attrs.get("userId").toString());
        String senderName = attrs.getOrDefault(
                "fullName", "User").toString();

        // Save to Supabase and get response
        MessageResponse response = messageService.sendMessage(
                senderId, senderName, request);

        // Push to SENDER — they see their own message
        messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/queue/messages",
                response);

        // Push to RECIPIENT — they see it in real time
        messagingTemplate.convertAndSendToUser(
                response.getRecipientId().toString(),
                "/queue/messages",
                response);

        log.debug("Message pushed via WebSocket — " +
                  "from: {} to: {}",
                senderId, response.getRecipientId());
    }

    /**
     * Frontend sends to: /app/chat/read
     * { "contractId": "uuid" }
     * Marks all messages in contract as read
     */
    @MessageMapping("/chat/read")
    public void markAsRead(
            @Payload Map<String, String> payload,
            SimpMessageHeaderAccessor headerAccessor) {

        Map<String, Object> attrs =
                headerAccessor.getSessionAttributes();
        if (attrs == null || attrs.get("userId") == null) return;

        UUID userId     = UUID.fromString(
                attrs.get("userId").toString());
        UUID contractId = UUID.fromString(
                payload.get("contractId"));

        messageService.markAsRead(contractId, userId);

        // Notify the other person their messages were read
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/read-receipt",
                Map.of("contractId", contractId,
                        "readBy",     userId));
    }
}