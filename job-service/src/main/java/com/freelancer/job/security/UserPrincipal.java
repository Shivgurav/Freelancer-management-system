package com.freelancer.job.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context
        .SecurityContextHolder;

import java.util.UUID;

public class UserPrincipal {

    public static UUID getCurrentUserId() {
        Authentication auth = getAuth();
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException(
                    "No authenticated user found");
        }
        return UUID.fromString(
                auth.getPrincipal().toString());
    }

    public static String getCurrentUserRole() {
        Authentication auth = getAuth();
        if (auth == null || auth.getAuthorities() == null
                || auth.getAuthorities().isEmpty()) {
            return null;
        }
        return auth.getAuthorities()
                .iterator().next()
                .getAuthority()
                .replace("ROLE_", "");
    }

    public static String getCurrentUserEmail() {
        Authentication auth = getAuth();
        if (auth == null) return null;
        Object creds = auth.getCredentials();
        return creds != null ? creds.toString() : null;
    }

    public static String getCurrentUserName() {
        Authentication auth = getAuth();
        if (auth == null || auth.getDetails() == null) {
            return "User";
        }
        return auth.getDetails().toString();
    }

    private static Authentication getAuth() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication();
    }
}