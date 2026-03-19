package com.freelancer.profile.repository;

import com.freelancer.profile.entity.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FreelancerProfileRepository
        extends JpaRepository<FreelancerProfile, UUID> {

    // Find profile by the userId from auth-service
    Optional<FreelancerProfile> findByUserId(UUID userId);

    // Check if a profile already exists for this user
    boolean existsByUserId(UUID userId);
}