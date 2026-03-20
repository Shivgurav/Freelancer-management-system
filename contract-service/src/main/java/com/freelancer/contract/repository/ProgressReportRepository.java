package com.freelancer.contract.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freelancer.contract.entity.ProgressReport;


public interface ProgressReportRepository extends JpaRepository<ProgressReport, UUID> {
	List<ProgressReport> findByMilestoneIdOrderByCreatedAtDesc(UUID milestoneId);
	
	List<ProgressReport> findBySubmittedBy(UUID freelancerId);

}
