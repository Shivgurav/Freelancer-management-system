package com.freelancer.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.env:dev}")
    private String appEnv;

    // Production frontend URL — set via environment variable
    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOriginsStr;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        if ("dev".equals(appEnv)) {
            config.addAllowedOriginPattern("*");
        } else {
            config.setAllowedOrigins(
                Arrays.asList(allowedOriginsStr.split(",")));
        }

        config.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE",
            "PATCH", "OPTIONS",
            "HEAD"     // ← needed for WebSocket upgrade
        ));

        config.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-User-Id",
            "X-User-Role",
            "X-User-Email",
            "X-User-FirstName",
            "X-User-LastName",
            "X-User-FullName",
            "Upgrade",           // ← needed for WebSocket
            "Connection",        // ← needed for WebSocket
            "Sec-WebSocket-Key", // ← needed for WebSocket
            "Sec-WebSocket-Version" // ← needed for WebSocket
        ));

        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}