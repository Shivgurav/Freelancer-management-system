package com.freelancer.file.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DownloadUrlResponse {

    private String downloadUrl;
    private LocalDateTime expiresAt;

    private String fileName;
    private Long sizeBytes;
    private String mimeType;
}