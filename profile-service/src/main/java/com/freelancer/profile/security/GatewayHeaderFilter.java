package com.freelancer.profile.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String role   = request.getHeader("X-User-Role");
        String email  = request.getHeader("X-User-Email");

        // If headers are present — build Spring Security context
        if (userId != null && role != null) {

            // Spring Security needs roles prefixed with ROLE_
            // e.g. "FREELANCER" becomes "ROLE_FREELANCER"
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
            );

            // Build auth object — principal = userId, credentials = email
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId,   // who is this user
                            email,    // their email
                            authorities // their role
                    );

            // Set into Spring Security context
            // Now @PreAuthorize and .authenticated() will work correctly
            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

            log.debug("Set security context for userId: {} role: {}",
                    userId, role);
        }

        filterChain.doFilter(request, response);
    }
}