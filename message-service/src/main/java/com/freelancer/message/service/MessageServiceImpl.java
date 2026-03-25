package com.freelancer.message.service;

import com.freelancer.message.dto.ChatMessageRequest;
import com.freelancer.message.dto.MessageResponse;
import com.freelancer.message.entity.ChatRoom;
import com.freelancer.message.entity.Message;
import com.freelancer.message.enums.MessageType;
import com.freelancer.message.exception.MessageException;
import com.freelancer.message.repository.ChatRoomRepository;
import com.freelancer.message.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository  messageRepository;
    private final ChatRoomRepository chatRoomRepository;

    // ── Create chat room ──────────────────────────────────────────
    @Override
    @Transactional
    public ChatRoom createChatRoom(UUID contractId,
                                    UUID clientId,
                                    UUID freelancerId,
                                    String clientName,
                                    String freelancerName,
                                    String jobTitle) {

        /*
         * BUG FIX #1 — IDEMPOTENT BY CONTRACT ID, NOT BY PAIR
         *
         * Original logic: existsByContractId(contractId) → return if exists.
         * This is CORRECT: one chat room per contract. If the same client
         * and freelancer create a SECOND contract together, that is a NEW
         * project and deserves its own dedicated chat room.
         *
         * The original code would have been fine IF contract-service was
         * actually calling this endpoint — which it wasn't (see MessageClient fix).
         *
         * What we do NOT want is: existsByClientIdAndFreelancerId(...) → return
         * existing room. That would merge conversations from multiple contracts
         * into a single chat, which is confusing.
         *
         * Schema: ChatRoom has unique constraint on contract_id — enforced at
         * DB level. This service-level check is just a friendly guard.
         */
        Optional<ChatRoom> existing =
                chatRoomRepository.findByContractId(contractId);

        if (existing.isPresent()) {
            log.info("Chat room already exists for contractId: {} — returning existing",
                     contractId);
            return existing.get();
        }

        ChatRoom room = ChatRoom.builder()
                .contractId(contractId)
                .clientId(clientId)
                .freelancerId(freelancerId)
                .clientName(clientName)
                .freelancerName(freelancerName)
                .jobTitle(jobTitle)
                .build();

        chatRoomRepository.save(room);

        // System message to open the conversation
        Message systemMsg = Message.builder()
                .contractId(contractId)
                .senderId(clientId)
                .senderName("System")
                .recipientId(freelancerId)
                .content("Chat started for project: " + jobTitle
                         + ". You can now message each other!")
                .type(MessageType.SYSTEM)
                .isRead(false)
                .build();

        messageRepository.save(systemMsg);

        log.info("Chat room created — contractId: {}", contractId);
        return room;
    }

    // ── Send message ──────────────────────────────────────────────
    @Override
    @Transactional
    public MessageResponse sendMessage(UUID senderId,
                                        String senderName,
                                        ChatMessageRequest request) {

        ChatRoom room = chatRoomRepository
                .findByContractId(request.getContractId())
                .orElseThrow(() -> new MessageException(
                        "Chat room not found for contract: "
                        + request.getContractId()));

        boolean isMember =
                room.getClientId().equals(senderId)
                || room.getFreelancerId().equals(senderId);

        if (!isMember) {
            throw new MessageException(
                    "You are not a member of this chat room");
        }

        UUID recipientId = room.getClientId().equals(senderId)
                ? room.getFreelancerId()
                : room.getClientId();

        Message message = Message.builder()
                .contractId(request.getContractId())
                .senderId(senderId)
                .senderName(senderName)
                .recipientId(recipientId)
                .content(request.getContent())
                .type(request.getType() != null
                        ? request.getType()
                        : MessageType.TEXT)
                .fileUrl(request.getFileUrl())
                .fileName(request.getFileName())
                .isRead(false)
                .build();

        messageRepository.save(message);
        log.debug("Message saved — from: {} to: {}", senderId, recipientId);

        return mapToResponse(message, senderId);
    }

    // ── Get recent messages — last 50 ─────────────────────────────
    @Override
    public List<MessageResponse> getRecentMessages(UUID contractId,
                                                    UUID userId) {
        verifyRoomAccess(contractId, userId);

        List<MessageResponse> messages = messageRepository
                .findByContractIdOrderBySentAtDesc(
                        contractId,
                        PageRequest.of(0, 50))
                .stream()
                .map(m -> mapToResponse(m, userId))
                .collect(Collectors.toList());

        // Reverse so oldest appears first in chat window
        Collections.reverse(messages);
        return messages;
    }

    // ── Get full chat history ─────────────────────────────────────
    @Override
    public List<MessageResponse> getChatHistory(UUID contractId,
                                                  UUID userId) {
        verifyRoomAccess(contractId, userId);

        return messageRepository
                .findByContractIdOrderBySentAtAsc(contractId)
                .stream()
                .map(m -> mapToResponse(m, userId))
                .collect(Collectors.toList());
    }

    // ── Mark as read ──────────────────────────────────────────────
    @Override
    @Transactional
    public void markAsRead(UUID contractId, UUID userId) {
        verifyRoomAccess(contractId, userId);
        messageRepository.markAllAsRead(
                contractId, userId, LocalDateTime.now());
        log.debug("Marked as read — contractId: {} userId: {}",
                contractId, userId);
    }

    // ── Get my chat rooms ─────────────────────────────────────────
    @Override
    public List<Map<String, Object>> getMyChatRooms(UUID userId,
                                                     String role) {
        List<ChatRoom> rooms = "CLIENT".equals(role)
                ? chatRoomRepository.findByClientIdAndIsActiveTrue(userId)
                : chatRoomRepository.findByFreelancerIdAndIsActiveTrue(userId);

        return rooms.stream().map(room -> {
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("chatRoomId",     room.getId());
            info.put("contractId",     room.getContractId());
            info.put("jobTitle",       room.getJobTitle());
            info.put("clientName",     room.getClientName());
            info.put("freelancerName", room.getFreelancerName());
            info.put("unreadCount",
                    messageRepository
                    .countByContractIdAndRecipientIdAndIsReadFalse(
                            room.getContractId(), userId));
            return info;
        }).collect(Collectors.toList());
    }

    // ── Get unread count ──────────────────────────────────────────
    @Override
    public long getUnreadCount(UUID userId) {
        return messageRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    // ── Scheduled cleanup — runs every day at midnight ────────────
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanOldMessages() {
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        chatRoomRepository.findAll().forEach(room ->
                messageRepository.deleteOldMessages(
                        room.getContractId(), sixMonthsAgo));
        log.info("Old messages cleaned up");
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private void verifyRoomAccess(UUID contractId, UUID userId) {
        ChatRoom room = chatRoomRepository
                .findByContractId(contractId)
                .orElseThrow(() -> new MessageException(
                        "Chat room not found: " + contractId));

        boolean isMember =
                room.getClientId().equals(userId)
                || room.getFreelancerId().equals(userId);

        if (!isMember) {
            throw new MessageException(
                    "You are not a member of this chat room");
        }
    }

    private MessageResponse mapToResponse(Message m, UUID viewerId) {
        return MessageResponse.builder()
                .id(m.getId())
                .contractId(m.getContractId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .recipientId(m.getRecipientId())
                .content(m.getContent())
                .type(m.getType())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .isRead(m.isRead())
                .sentAt(m.getSentAt())
                .direction(m.getSenderId().equals(viewerId) ? "ME" : "THEM")
                .build();
    }
}