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

        // Read headers — Spring normalizes header names to lowercase
        // so X-User-Id and x-user-id both work
        String userId    = request.getHeader("X-User-Id");
        String role      = request.getHeader("X-User-Role");
        String email     = request.getHeader("X-User-Email");
        String firstName = request.getHeader("X-User-FirstName");
        String lastName  = request.getHeader("X-User-LastName");

        log.debug("GatewayHeaderFilter — path: {} userId: {} role: {}",
                request.getRequestURI(), userId, role);

        if (userId != null && role != null) {

            // Spring Security needs "ROLE_" prefix
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role));

            String fullName = "";
            if (firstName != null && lastName != null) {
                fullName = firstName + " " + lastName;
            }

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userId,      // principal
                            email,       // credentials
                            authorities  // roles
                    );

            auth.setDetails(fullName);

            // Set into security context BEFORE the filter chain continues
            SecurityContextHolder.getContext()
                    .setAuthentication(auth);

            log.debug("Security context set — userId: {} role: {}",
                    userId, role);

        } else {
            log.warn("No X-User-Id or X-User-Role header found " +
                     "for path: {}", request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}