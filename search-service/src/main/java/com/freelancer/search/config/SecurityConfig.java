package com.freelancer.search.config;

import com.freelancer.search.security.GatewayHeaderFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
            // FIX: was addFilterBefore(UsernamePasswordAuthenticationFilter.class).
            // Must be AnonymousAuthenticationFilter — same reason as message-service.
            .addFilterBefore(gatewayHeaderFilter,
                    AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // All search and sync endpoints are public.
                // Search is public for anyone to browse.
                // Sync endpoints are called by other services internally.
                .requestMatchers(
                    "/api/search/**",
                    "/actuator/**"
                ).permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}