package com.freelancer.message.service;

import com.freelancer.message.dto.ChatMessageRequest;
import com.freelancer.message.dto.MessageResponse;
import com.freelancer.message.entity.ChatRoom;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface MessageService {

    // Create chat room — called by Contract Service
    ChatRoom createChatRoom(UUID contractId,
                             UUID clientId,
                             UUID freelancerId,
                             String clientName,
                             String freelancerName,
                             String jobTitle);

    // Send message — called by WebSocket controller
    MessageResponse sendMessage(UUID senderId,
                                 String senderName,
                                 ChatMessageRequest request);

    // Load last 50 messages — on chat open
    List<MessageResponse> getRecentMessages(UUID contractId,
                                             UUID userId);

    // Load full history
    List<MessageResponse> getChatHistory(UUID contractId,
                                          UUID userId);

    // Mark all messages as read
    void markAsRead(UUID contractId, UUID userId);

    // All chat rooms for a user — for sidebar
    List<Map<String, Object>> getMyChatRooms(UUID userId,
                                              String role);

    // Total unread count — for notification badge
    long getUnreadCount(UUID userId);
}