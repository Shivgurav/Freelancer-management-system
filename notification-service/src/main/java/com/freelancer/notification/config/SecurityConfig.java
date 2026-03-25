package com.freelancer.notification.config;

import com.freelancer.notification.security.GatewayHeaderFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method
        .configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web
        .builders.HttpSecurity;
import org.springframework.security.config.annotation.web
        .configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http
        .SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication
        .AnonymousAuthenticationFilter;



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
                .sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS))
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            // KEY FIX — add BEFORE AnonymousAuthenticationFilter
            // NOT before UsernamePasswordAuthenticationFilter
            // AnonymousAuthenticationFilter runs AFTER ours
            // so it sees our auth and skips setting ANONYMOUS
            .addFilterBefore(
                    gatewayHeaderFilter,
                    AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
            		.requestMatchers("/api/notifications/**", "/actuator/**").permitAll()
                .requestMatchers(
                    "/api/jobs/debug/**",
                    "/actuator/**"
                ).permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}