package com.freelancer.profile.repository;

import com.freelancer.profile.entity.FreelancerSkill;
import com.freelancer.profile.entity.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FreelancerSkillRepository
        extends JpaRepository<FreelancerSkill, UUID> {

    List<FreelancerSkill> findByFreelancerProfile(FreelancerProfile profile);

    void deleteByFreelancerProfileAndSkillId(
            FreelancerProfile profile, UUID skillId);
}