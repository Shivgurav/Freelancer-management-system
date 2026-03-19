package com.freelancer.profile.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class UserPrincipal {

    // Get current user's UUID from Security context
    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user found");
        }

        return UUID.fromString(auth.getPrincipal().toString());
    }

    // Get current user's role
    public static String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || auth.getAuthorities().isEmpty()) {
            return null;
        }

        // Remove "ROLE_" prefix and return e.g. "FREELANCER"
        return auth.getAuthorities()
                .iterator()
                .next()
                .getAuthority()
                .replace("ROLE_", "");
    }
}