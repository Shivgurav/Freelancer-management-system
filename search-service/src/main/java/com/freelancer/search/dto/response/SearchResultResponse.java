package com.freelancer.search.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultResponse<T> {

    private List<T> results;
    private int     totalResults;
    private int     page;
    private int     size;
    private int     totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}