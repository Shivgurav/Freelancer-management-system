package com.freelancer.review.config;

import com.freelancer.review.security.GatewayHeaderFilter;
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
                // FIX: was /api/jobs/** (copy-paste from job-service) — now correct review paths.
                // Public — anyone can see reviews on a user's profile
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/reviews/user/**"
                ).permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}