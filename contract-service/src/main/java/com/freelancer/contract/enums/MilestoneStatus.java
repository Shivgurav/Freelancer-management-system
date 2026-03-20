package com.freelancer.contract.enums;

public enum MilestoneStatus {
    PENDING,      // not started yet
    IN_PROGRESS,  // freelancer is actively working
    SUBMITTED,    // freelancer submitted progress report
    APPROVED,     // client approved — milestone complete
    REVISION      // client wants changes
}