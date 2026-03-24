package com.freelancer.search.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "freelancer_index",
    indexes = {
        // Database indexes for fast filtering
        @Index(name = "idx_hourly_rate",
               columnList = "hourly_rate"),
        @Index(name = "idx_avg_rating",
               columnList = "avg_rating"),
        @Index(name = "idx_availability",
               columnList = "availability"),
        @Index(name = "idx_location",
               columnList = "location")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreelancerIndex {

    @Id
    // This ID is the same as FreelancerProfile.id in profile-service
    // Not auto-generated — we set it ourselves when syncing
    private UUID id;

    // userId from auth-service
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 100)
    private String location;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    // Skills stored as comma separated string
    // e.g. "Java,Spring Boot,PostgreSQL,React"
    // Used for full-text search
    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_jobs_completed")
    @Builder.Default
    private Integer totalJobsCompleted = 0;

    // FULL_TIME, PART_TIME, NOT_AVAILABLE
    @Column(name = "availability", length = 20)
    private String availability;

    @Column(name = "profile_url", length = 255)
    private String profileUrl;

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    // When was this record last synced from Profile Service
    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;
}