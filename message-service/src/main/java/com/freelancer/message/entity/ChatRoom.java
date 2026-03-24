package com.freelancer.message.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_rooms",
    indexes = {
        @Index(name = "idx_room_client",
               columnList = "client_id"),
        @Index(name = "idx_room_freelancer",
               columnList = "freelancer_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "contract_id",
            nullable = false,
            unique = true)
    private UUID contractId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    @Column(name = "client_name", length = 200)
    private String clientName;

    @Column(name = "freelancer_name", length = 200)
    private String freelancerName;

    @Column(name = "job_title", length = 200)
    private String jobTitle;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}