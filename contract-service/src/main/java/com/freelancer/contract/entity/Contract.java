package com.freelancer.contract.entity;

import com.freelancer.contract.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Soft reference to Job Service — no DB foreign key
    // because Job DB and Contract DB are separate
    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    // Soft reference to the accepted bid in Job Service
    @Column(name = "bid_id", nullable = false)
    private UUID bidId;

    // Soft references to User in Auth Service
    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    // The amount the freelancer bid — agreed price
    @Column(name = "agreed_amount",
            nullable = false,
            precision = 10,
            scale = 2)
    private BigDecimal agreedAmount;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContractStatus status = ContractStatus.ACTIVE;

    // Additional notes or terms agreed upon
    @Column(columnDefinition = "TEXT")
    private String terms;

    // List of milestones — work is split into stages
    @OneToMany(mappedBy = "contract",
               cascade = CascadeType.ALL,
               fetch = FetchType.LAZY,
               orphanRemoval = true)
    @Builder.Default
    private List<Milestone> milestones = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}