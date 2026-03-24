package com.freelancer.contract.config;

import com.freelancer.contract.security.GatewayHeaderFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // FIX: was registering gatewayHeaderFilter TWICE (once before
            // AnonymousAuthenticationFilter and once before
            // UsernamePasswordAuthenticationFilter). Removed the duplicate.
            .addFilterBefore(
                    gatewayHeaderFilter,
                    AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // FIX: POST /api/contracts is called internally by job-service.
                // job-service now sends X-User-Id/X-User-Role headers so the
                // GatewayHeaderFilter will authenticate it. But as a safety net,
                // we also permit it explicitly so even if headers are missing it
                // doesn't return 403 — it just won't have a security context.
                .requestMatchers(HttpMethod.POST, "/api/contracts").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}