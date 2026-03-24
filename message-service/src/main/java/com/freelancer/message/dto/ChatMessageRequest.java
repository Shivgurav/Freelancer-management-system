package com.freelancer.message.dto;

import com.freelancer.message.enums.MessageType;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatMessageRequest {

    private UUID        contractId;
    private String      content;
    private MessageType type;
    private String      fileUrl;
    private String      fileName;
}