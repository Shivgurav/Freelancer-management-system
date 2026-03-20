package com.freelancer.contract.entity;

import com.freelancer.contract.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "progress_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Which milestone this report belongs to
    // Real DB foreign key — same database
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    // Who submitted this report — soft ref to User
    @Column(name = "submitted_by", nullable = false)
    private UUID submittedBy;

    @Column(nullable = false, length = 200)
    private String title;

    // Detailed description of what was done
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // How much of the milestone is done — 0 to 100
    @Column(name = "percentage_complete")
    private Integer percentageComplete;

    // Client's feedback when they request revision
    private String clientFeedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.SUBMITTED;

    // File attachment URLs from MinIO/File Service
    // Stored as comma separated URLs
    // e.g. "https://minio/bucket/file1.pdf,https://minio/bucket/file2.png"
    @Column(name = "attachment_urls", columnDefinition = "TEXT")
    private String attachmentUrls;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}