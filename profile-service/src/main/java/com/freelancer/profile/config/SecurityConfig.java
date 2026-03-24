package com.freelancer.profile.config;
// Change package per service

import com.freelancer.profile.security.GatewayHeaderFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity          // enables @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)

            // Disable session — stateless REST API
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Disable default Spring Security form login
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            // Add our filter BEFORE Spring Security's auth filter
            // This ensures security context is set BEFORE
            // Spring Security checks permissions
            .addFilterBefore(gatewayHeaderFilter,
                    UsernamePasswordAuthenticationFilter.class)

            .authorizeHttpRequests(auth -> auth
                // Public endpoints — no auth needed
                .requestMatchers(
                    "/api/profiles/freelancer/**",
                    "/api/profiles/client/**",
                    "/api/profiles/skills/**",
                    "/api/profiles/*/init",
                    "/actuator/**"
                ).permitAll()

                // Everything else needs authentication
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
