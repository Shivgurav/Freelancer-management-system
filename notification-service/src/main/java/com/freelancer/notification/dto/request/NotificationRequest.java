package com.freelancer.notification.dto.request;

import com.freelancer.notification.enums.NotificationEvent;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class NotificationRequest {

    // Which event triggered this notification
    @NotNull(message = "Event is required")
    private NotificationEvent event;

    // Who to send the email to
    @Email(message = "Invalid recipient email")
    @NotBlank(message = "Recipient email is required")
    private String recipientEmail;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    // Dynamic data for filling in the email template
    // e.g. { "jobTitle": "Java Developer", "bidAmount": "1000" }
    private Map<String, String> data;
}