package com.freelancer.notification.repository;

import com.freelancer.notification.entity.NotificationLog;
import com.freelancer.notification.enums.NotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationLogRepository
        extends JpaRepository<NotificationLog, UUID> {

    // All notifications sent to an email
    List<NotificationLog> findByRecipientEmail(String email);

    // All failed notifications — for retry
    List<NotificationLog> findBySentFalse();

    // All notifications for a specific event type
    List<NotificationLog> findByEvent(NotificationEvent event);
}