package com.freelancer.notification.enums;

public enum NotificationEvent {

    // Auth events
    WELCOME,                  // after registration

    // Profile events
    PROFILE_UPDATED,          // profile update confirmation

    // Job events
    JOB_POSTED,               // client posted a job
    JOB_MATCHES_SKILLS,       // freelancer skills match a new job
    BID_RECEIVED,             // client received a new bid
    BID_ACCEPTED,             // freelancer's bid was accepted
    BID_REJECTED,             // freelancer's bid was rejected
    BID_WITHDRAWN,            // client notified bid was withdrawn

    // Contract events
    CONTRACT_CREATED,         // both parties notified
    PROGRESS_REPORT_SUBMITTED,// client notified
    REPORT_APPROVED,          // freelancer notified
    REVISION_REQUESTED,       // freelancer notified
    MILESTONE_APPROVED,       // freelancer notified
    CONTRACT_COMPLETED,       // both parties notified

    // File events
    FILE_UPLOADED,            // other party notified

    // Review events
    REVIEW_RECEIVED           // reviewee notified
}