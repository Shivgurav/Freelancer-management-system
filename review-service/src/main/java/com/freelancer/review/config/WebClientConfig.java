package com.freelancer.review.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // @LoadBalanced makes WebClient resolve service names
    // via Eureka instead of DNS
    // So "http://contract-service" becomes
    // "http://192.168.1.5:8084" automatically
    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}