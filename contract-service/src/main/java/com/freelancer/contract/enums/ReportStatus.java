package com.freelancer.contract.enums;

public enum ReportStatus {
    SUBMITTED,       // freelancer sent the report
    REVIEWED,        // client has seen it
    APPROVED,        // client is happy — milestone moves to APPROVED
    NEEDS_REVISION   // client wants changes
}