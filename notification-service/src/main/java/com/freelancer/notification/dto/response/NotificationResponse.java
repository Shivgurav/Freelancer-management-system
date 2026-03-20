package com.freelancer.notification.dto.response;

import com.freelancer.notification.enums.NotificationEvent;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID              id;
    private String            recipientEmail;
    private String            recipientName;
    private NotificationEvent event;
    private String            subject;
    private boolean           sent;
    private String            errorMessage;
    private LocalDateTime     createdAt;
    private LocalDateTime     sentAt;
}