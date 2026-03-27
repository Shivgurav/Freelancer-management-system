package com.freelancer.profile.config;

import com.freelancer.profile.security.GatewayHeaderFilter;
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
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .addFilterBefore(
                    gatewayHeaderFilter,
                    AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // FIX: was /api/jobs/** (copy-paste from job-service) — now correct profile paths
                // Public — anyone can browse freelancer profiles and skills
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/profiles/freelancer/**",
                    "/api/profiles/client/**",
                    "/api/profiles/skills",
                    "/api/profiles/skills/search"
                ).permitAll()
                // Internal — called by auth-service after registration (no user token)
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/profiles/freelancer/init",
                    "/api/profiles/client/init"
                ).permitAll()
                // Internal — called by review-service to update ratings
                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/profiles/freelancer/rating",
                    "/api/profiles/client/rating"
                    
                ).permitAll()
                .requestMatchers(HttpMethod.PUT,
                		"/api/profiles/internal/client/**"
                ).permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}