package com.freelancer.profile.entity;

import com.freelancer.profile.enums.Availability;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "freelancer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreelancerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Links back to the User in auth-service
    // Each freelancer has exactly one profile
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String title;            // e.g. "Full Stack Java Developer"

    @Column(columnDefinition = "TEXT")
    private String bio;              // about me section

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;   // e.g. 25.00 USD per hour

    @Column(length = 100)
    private String location;         // e.g. "Mumbai, India"

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "portfolio_url", length = 255)
    private String portfolioUrl;     // link to external portfolio

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Availability availability = Availability.FULL_TIME;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;  // updated by review-service

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_jobs_completed")
    @Builder.Default
    private Integer totalJobsCompleted = 0;

    // One freelancer has many skills
    @OneToMany(mappedBy = "freelancerProfile",
               cascade = CascadeType.ALL,
               orphanRemoval = true,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<FreelancerSkill> freelancerSkills = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}