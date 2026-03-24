package com.freelancer.job.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication
        .UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority
        .SimpleGrantedAuthority;
import org.springframework.security.core.context
        .SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest  request,
            HttpServletResponse response,
            FilterChain         chain)
            throws ServletException, IOException {

        String userId    = request.getHeader("X-User-Id");
        String role      = request.getHeader("X-User-Role");
        String email     = request.getHeader("X-User-Email");
        String firstName = request.getHeader("X-User-FirstName");
        String lastName  = request.getHeader("X-User-LastName");

        // Log every request so you can debug
        log.info("▶ {} {} | userId={} role={}",
                request.getMethod(),
                request.getRequestURI(),
                userId, role);

        if (userId != null && role != null
                && !userId.isBlank() && !role.isBlank()) {

            // ROLE_ prefix is mandatory for Spring Security
            // hasRole('CLIENT') checks for 'ROLE_CLIENT'
            SimpleGrantedAuthority authority =
                    new SimpleGrantedAuthority("ROLE_" + role);

            String fullName = buildFullName(firstName, lastName);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userId,                    // principal
                            email,                     // credentials
                            Collections.singletonList(authority));

            auth.setDetails(fullName);

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(auth);

            log.info("✓ Auth set — userId={} role={} authority={}",
                    userId, role, authority.getAuthority());

        } else {
            log.warn("✗ Missing headers — userId={} role={} " +
                     "path={}", userId, role,
                    request.getRequestURI());
        }

        chain.doFilter(request, response);
    }

    private String buildFullName(String firstName,
                                  String lastName) {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        }
        return "";
    }
}