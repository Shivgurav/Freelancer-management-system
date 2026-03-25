package com.freelancer.file.dto.response;

import com.freelancer.file.enums.FileType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FileUploadResponse {

    private UUID id;
    private String originalName;
    private FileType fileType;
    private String mimeType;
    private Long sizeBytes;
    private LocalDateTime uploadedAt;

    // Nullable (only for portfolio or public files)
    private String publicUrl;
}