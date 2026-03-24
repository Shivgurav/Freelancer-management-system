package com.freelancer.search.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_index",
    indexes = {
        @Index(name = "idx_job_budget_min",
               columnList = "budget_min"),
        @Index(name = "idx_job_budget_max",
               columnList = "budget_max"),
        @Index(name = "idx_job_status",
               columnList = "status"),
        @Index(name = "idx_job_experience",
               columnList = "experience_level")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobIndex {

    @Id
    // Same as JobPost.id in job-service
    private UUID id;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "budget_min", precision = 10, scale = 2)
    private BigDecimal budgetMin;

    @Column(name = "budget_max", precision = 10, scale = 2)
    private BigDecimal budgetMax;

    // Skills stored as comma separated string
    @Column(name = "required_skills", columnDefinition = "TEXT")
    private String requiredSkills;

    // OPEN, CLOSED, CANCELLED, COMPLETED
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "experience_level", length = 20)
    private String experienceLevel;

    @Column(name = "total_bids")
    @Builder.Default
    private Integer totalBids = 0;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}