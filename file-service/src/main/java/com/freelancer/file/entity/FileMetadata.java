package com.freelancer.file.entity;

import com.freelancer.file.enums.FileType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_metadata",
    indexes = {
        @Index(name = "idx_file_owner",    columnList = "owner_id"),
        @Index(name = "idx_file_contract", columnList = "contract_id"),
        @Index(name = "idx_file_type",     columnList = "file_type")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "owner_name", length = 200)
    private String ownerName;

    // NULL for portfolio files — not tied to any contract
    @Column(name = "contract_id")
    private UUID contractId;

    // For PROGRESS_ATTACHMENT only
    @Column(name = "milestone_id")
    private UUID milestoneId;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 30)
    private FileType fileType;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    // Which MinIO bucket
    @Column(nullable = false, length = 100)
    private String bucket;

    // Path inside the bucket e.g. "uuid/resume.pdf"
    @Column(name = "object_key", nullable = false, length = 500)
    private String objectKey;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}