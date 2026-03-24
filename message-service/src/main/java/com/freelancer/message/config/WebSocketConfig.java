package com.freelancer.message.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config
        .MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation
        .EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation
        .StompEndpointRegistry;
import org.springframework.web.socket.config.annotation
        .WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig
        implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(
            MessageBrokerRegistry registry) {

        // In-memory broker
        // /user/queue/messages → private to one user
        // /topic/contract/123 → broadcast to contract room
        registry.enableSimpleBroker("/queue", "/topic");

        // Messages from frontend come to /app/...
        registry.setApplicationDestinationPrefixes("/app");

        // /user prefix for private messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(
            StompEndpointRegistry registry) {

        // Frontend connects to ws://host:8090/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
    
}