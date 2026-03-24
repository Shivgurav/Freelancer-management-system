package com.freelancer.auth.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // CRITICAL FIX: auth-service was missing this entirely.
    // Without @LoadBalanced, WebClient cannot resolve Eureka service names
    // like "http://profile-service" — it tries to do a real DNS lookup
    // and fails with "UnknownHostException: profile-service".
    // This caused profile creation to silently fail after every registration.
    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}