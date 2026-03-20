package com.freelancer.contract.entity;

import com.freelancer.contract.enums.MilestoneStatus;
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
@Table(name = "milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Which contract this milestone belongs to
    // This IS a real DB foreign key — same database
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(nullable = false, length = 200)
    private String title;        // e.g. "Design phase"

    @Column(columnDefinition = "TEXT")
    private String description;  // what needs to be delivered

    // Amount for this milestone
    // Sum of all milestones = contract.agreedAmount
    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;

    // Order of this milestone in the contract
    // e.g. 1 = first, 2 = second
    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    // Progress reports submitted for this milestone
    @OneToMany(mappedBy = "milestone",
               cascade = CascadeType.ALL,
               fetch = FetchType.LAZY,
               orphanRemoval = true)
    @Builder.Default
    private List<ProgressReport> progressReports = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}