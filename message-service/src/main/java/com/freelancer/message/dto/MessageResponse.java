package com.freelancer.message.dto;

import com.freelancer.message.enums.MessageType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private UUID          id;
    private UUID          contractId;
    private UUID          senderId;
    private String        senderName;
    private UUID          recipientId;
    private String        content;
    private MessageType   type;
    private String        fileUrl;
    private String        fileName;
    private boolean       isRead;
    private LocalDateTime sentAt;

    // "ME" — I sent this
    // "THEM" — they sent this
    // Set based on who is viewing the chat
    private String        direction;
}