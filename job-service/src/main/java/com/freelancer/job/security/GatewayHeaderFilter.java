package com.freelancer.job.security;

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

        String userId    = request.getHeader("X-User-Id");
        String role      = request.getHeader("X-User-Role");
        String email     = request.getHeader("X-User-Email");
        String firstName = request.getHeader("X-User-FirstName");
        String lastName  = request.getHeader("X-User-LastName");

        if (userId != null && role != null) {
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role));

            // Build full name from headers
            String fullName = "";
            if (firstName != null && lastName != null) {
                fullName = firstName + " " + lastName;
            } else if (firstName != null) {
                fullName = firstName;
            }

            // We store extra info in a custom auth token
            // principal   = userId
            // credentials = email
            // details     = fullName  ← store name here
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userId,    // principal
                            email,     // credentials
                            authorities);

            // Store fullName in details
            auth.setDetails(fullName);

            SecurityContextHolder.getContext()
                    .setAuthentication(auth);

            log.debug("Security context set — " +
                      "userId: {} role: {} name: {}",
                    userId, role, fullName);
        }

        filterChain.doFilter(request, response);
    }
}