package com.freelancer.message.config;

import com.freelancer.message.security.GatewayHeaderFilter;
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
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS))
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            // FIX: was addFilterBefore(UsernamePasswordAuthenticationFilter.class).
            // Must be AnonymousAuthenticationFilter so the filter runs AFTER
            // Spring's auth filters but BEFORE the anonymous principal is set.
            // This ensures our X-User-Id auth token isn't overwritten.
            .addFilterBefore(gatewayHeaderFilter,
                    AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // WebSocket endpoint — auth is handled inside the WS session
                // /api/messages/room — internal, called by contract-service
                .requestMatchers(
                    "/ws/**",
                    "/api/messages/room",
                    "/actuator/**"
                ).permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}