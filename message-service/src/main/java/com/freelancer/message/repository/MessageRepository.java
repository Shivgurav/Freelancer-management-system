package com.freelancer.message.repository;

import com.freelancer.message.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository
        extends JpaRepository<Message, UUID> {

    // Full chat history — oldest first
    List<Message> findByContractIdOrderBySentAtAsc(
            UUID contractId);

    // Last N messages — newest first
    // Use Pageable to limit e.g. last 50
    List<Message> findByContractIdOrderBySentAtDesc(
            UUID contractId, Pageable pageable);

    // Unread count for a user in one contract
    long countByContractIdAndRecipientIdAndIsReadFalse(
            UUID contractId, UUID recipientId);

    // Unread count across ALL contracts for a user
    long countByRecipientIdAndIsReadFalse(UUID recipientId);

    // Find unread messages to mark as read
    List<Message> findByContractIdAndRecipientIdAndIsReadFalse(
            UUID contractId, UUID recipientId);

    // Mark all as read in one query
    @Modifying
    @Query("""
        UPDATE Message m
        SET m.isRead = true,
            m.readAt = :readAt
        WHERE m.contractId = :contractId
        AND m.recipientId = :userId
        AND m.isRead = false
        """)
    void markAllAsRead(UUID contractId,
                       UUID userId,
                       LocalDateTime readAt);

    // Delete messages older than X date
    // Called by scheduled cleanup job
    @Modifying
    @Query("""
        DELETE FROM Message m
        WHERE m.contractId = :contractId
        AND m.sentAt < :before
        """)
    void deleteOldMessages(UUID contractId,
                           LocalDateTime before);
}