package com.freelancer.profile.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // e.g. "Java", "React", "Figma"
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    // e.g. "Backend", "Frontend", "Design"
    @Column(length = 100)
    private String category;
}