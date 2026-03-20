package com.freelancer.job.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class UserPrincipal {

    // Gets userId from security context
    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user found");
        }
        return UUID.fromString(auth.getPrincipal().toString());
    }

    // Gets role from security context
    public static String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) {
            return null;
        }
        return auth.getAuthorities().iterator().next()
                .getAuthority().replace("ROLE_", "");
    }

    // Gets email — stored as credentials in auth token
    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null) return null;
        return auth.getCredentials() != null
                ? auth.getCredentials().toString()
                : null;
    }
 // Add this method to UserPrincipal.java
    public static String getCurrentUserName() {
        Authentication auth = SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            return "User";
        }
        return auth.getDetails().toString();
    }
}