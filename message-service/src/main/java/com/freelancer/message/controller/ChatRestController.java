package com.freelancer.message.controller;

import com.freelancer.message.dto.MessageResponse;
import com.freelancer.message.security.UserPrincipal;
import com.freelancer.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class ChatRestController {

    private final MessageService messageService;

    /**
     * POST /api/messages/room
     * Internal — Contract Service calls this
     * when a contract is created
     */
    @PostMapping("/room")
    public ResponseEntity<Void> createChatRoom(
            @RequestBody Map<String, Object> body) {

        messageService.createChatRoom(
            UUID.fromString(body.get("contractId").toString()),
            UUID.fromString(body.get("clientId").toString()),
            UUID.fromString(body.get("freelancerId").toString()),
            body.get("clientName").toString(),
            body.get("freelancerName").toString(),
            body.get("jobTitle").toString()
        );

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * GET /api/messages/recent/{contractId}
     * Load last 50 messages when chat window opens
     */
    @GetMapping("/recent/{contractId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<MessageResponse>> getRecent(
            @PathVariable UUID contractId) {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                messageService.getRecentMessages(
                        contractId, userId));
    }

    /**
     * GET /api/messages/history/{contractId}
     * Load full chat history
     */
    @GetMapping("/history/{contractId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<MessageResponse>> getHistory(
            @PathVariable UUID contractId) {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(
                messageService.getChatHistory(
                        contractId, userId));
    }

    /**
     * GET /api/messages/rooms
     * Get chat room list for sidebar
     */
    @GetMapping("/rooms")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<Map<String, Object>>> getRooms() {
        UUID   userId = UserPrincipal.getCurrentUserId();
        String role   = UserPrincipal.getCurrentUserRole();
        return ResponseEntity.ok(
                messageService.getMyChatRooms(userId, role));
    }

    /**
     * GET /api/messages/unread-count
     * Unread badge on chat icon
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        UUID userId = UserPrincipal.getCurrentUserId();
        return ResponseEntity.ok(Map.of(
                "unreadCount",
                messageService.getUnreadCount(userId)));
    }
}