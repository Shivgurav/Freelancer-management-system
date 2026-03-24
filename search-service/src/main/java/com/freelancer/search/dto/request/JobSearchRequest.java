package com.freelancer.search.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class JobSearchRequest {

    // e.g. "Spring Boot"
    private String skill;

    // e.g. "developer" — searches in title and description
    private String keyword;

    // Budget range the freelancer is looking for
    private BigDecimal minBudget;
    private BigDecimal maxBudget;

    // BEGINNER, INTERMEDIATE, EXPERT
    private String experienceLevel;

    private int page = 0;
    private int size = 10;
}