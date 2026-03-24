package com.freelancer.contract.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // CRITICAL FIX: contract-service was completely missing this file.
    // AuthClient and JobClient both inject WebClient.Builder via constructor.
    // Without this bean, Spring throws NoSuchBeanDefinitionException
    // at startup and contract-service NEVER starts.
    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}