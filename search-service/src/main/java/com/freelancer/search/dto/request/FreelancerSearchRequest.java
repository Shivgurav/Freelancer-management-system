package com.freelancer.search.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FreelancerSearchRequest {

    // e.g. "Java" — searches in skills list
    private String skill;

    // e.g. "React developer" — searches in title and skills
    private String keyword;

    // Hourly rate range
    private BigDecimal minRate;
    private BigDecimal maxRate;

    // Minimum star rating — e.g. 4.0
    private BigDecimal minRating;

    // FULL_TIME, PART_TIME, NOT_AVAILABLE
    private String availability;

    // e.g. "Mumbai" or "India"
    private String location;

    // Page number for pagination — starts at 0
    private int page = 0;

    // How many results per page
    private int size = 10;

    // Sort by: "rating", "rate_asc", "rate_desc", "jobs_completed"
    private String sortBy = "rating";
}