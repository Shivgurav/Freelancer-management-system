package com.freelancer.notification.entity;

import com.freelancer.notification.enums.NotificationEvent;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Who received the email
    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "recipient_name")
    private String recipientName;

    // Which event triggered this notification
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationEvent event;

    // Email subject
    @Column(nullable = false)
    private String subject;

    // Was the email sent successfully?
    @Column(nullable = false)
    @Builder.Default
    private boolean sent = false;

    // If sending failed — why?
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // How many times did we try to send?
    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}