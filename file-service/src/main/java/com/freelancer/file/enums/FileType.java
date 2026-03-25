package com.freelancer.file.enums;

public enum FileType {
    RESUME,               // Freelancer CV — only CLIENT with active contract can download
    PROJECT_DOC,          // Client project brief — only FREELANCER on that contract
    PROGRESS_ATTACHMENT,  // Progress report files — both parties on contract
    PORTFOLIO             // Freelancer portfolio — PUBLIC, anyone can view
}