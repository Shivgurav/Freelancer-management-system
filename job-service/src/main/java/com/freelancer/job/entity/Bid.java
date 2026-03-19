package com.freelancer.job.entity;

import com.freelancer.job.enums.BidStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bids",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"job_post_id", "freelancer_id"}
        // One freelancer can only bid once per job
    ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_post_id", nullable = false)
    private JobPost jobPost;

    // Freelancer who placed this bid
    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    @Column(name = "bid_amount",
            nullable = false,
            precision = 10,
            scale = 2)
    private BigDecimal bidAmount;

    @Column(name = "cover_letter",
            nullable = false,
            columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "estimated_days", nullable = false)
    private Integer estimatedDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BidStatus status = BidStatus.PENDING;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}