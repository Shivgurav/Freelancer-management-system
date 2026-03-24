package com.freelancer.message.security;

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
import java.util.List;

@Slf4j
@Component
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest  request,
            HttpServletResponse response,
            FilterChain         filterChain)
            throws ServletException, IOException {

        String userId    = request.getHeader("X-User-Id");
        String role      = request.getHeader("X-User-Role");
        String email     = request.getHeader("X-User-Email");
        String firstName = request.getHeader("X-User-FirstName");
        String lastName  = request.getHeader("X-User-LastName");

        if (userId != null && role != null) {

            String fullName = "";
            if (firstName != null && lastName != null) {
                fullName = firstName + " " + lastName;
            } else if (firstName != null) {
                fullName = firstName;
            }

            var authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role));

            var auth = new UsernamePasswordAuthenticationToken(
                    userId, email, authorities);
            auth.setDetails(fullName);

            SecurityContextHolder.getContext()
                    .setAuthentication(auth);

            log.debug("Auth set — userId: {} role: {}",
                    userId, role);
        }

        filterChain.doFilter(request, response);
    }
}