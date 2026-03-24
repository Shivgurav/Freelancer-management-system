package com.freelancer.message.repository;

import com.freelancer.message.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRoomRepository
        extends JpaRepository<ChatRoom, UUID> {

    Optional<ChatRoom> findByContractId(UUID contractId);

    boolean existsByContractId(UUID contractId);

    List<ChatRoom> findByClientIdAndIsActiveTrue(UUID clientId);

    List<ChatRoom> findByFreelancerIdAndIsActiveTrue(
            UUID freelancerId);
}