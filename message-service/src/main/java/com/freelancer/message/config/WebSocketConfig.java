package com.freelancer.message.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue", "/topic");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                /*
                 * BUG FIX #1 — USERID NEVER STORED IN WEBSOCKET SESSION
                 *
                 * The MessageController reads userId from session attributes:
                 *   attrs.get("userId")
                 * But nothing was ever putting userId INTO those attributes.
                 * Result: attrs.get("userId") is always null, the controller
                 * returns early with "Unauthenticated WebSocket message",
                 * sendMessage() is never called, nothing is saved to DB.
                 *
                 * Fix: add a HandshakeInterceptor that:
                 *   1. Reads the JWT from the ?token= query param
                 *      (browser WebSocket API cannot send custom headers)
                 *   2. Validates the JWT
                 *   3. Stores userId and fullName in the WebSocket session
                 *      attributes map — these persist for the life of the
                 *      connection and are available in every @MessageMapping
                 */
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(
                            ServerHttpRequest request,
                            ServerHttpResponse response,
                            WebSocketHandler wsHandler,
                            Map<String, Object> attributes) {

                        String query = request.getURI().getQuery();
                        String token = UriComponentsBuilder
                                .fromUriString("?" + (query != null ? query : ""))
                                .build()
                                .getQueryParams()
                                .getFirst("token");

                        if (token == null || token.isBlank()) {
                            log.warn("WebSocket handshake rejected — no token");
                            return false; // reject the connection
                        }

                        try {
                            SecretKey key = Keys.hmacShaKeyFor(
                                    jwtSecret.getBytes(StandardCharsets.UTF_8));

                            Claims claims = Jwts.parser()
                                    .verifyWith(key)
                                    .build()
                                    .parseSignedClaims(token)
                                    .getPayload();

                            String userId    = claims.getSubject();
                            String firstName = claims.get("firstName", String.class);
                            String lastName  = claims.get("lastName",  String.class);
                            String fullName  = (firstName != null ? firstName : "")
                                            + " "
                                            + (lastName  != null ? lastName  : "");

                            // Store in session — MessageController reads these
                            attributes.put("userId",   userId);
                            attributes.put("fullName", fullName.trim());

                            log.debug("WebSocket handshake OK — userId: {}", userId);
                            return true;

                        } catch (Exception e) {
                            log.warn("WebSocket handshake rejected — bad token: {}",
                                     e.getMessage());
                            return false;
                        }
                    }

                    @Override
                    public void afterHandshake(
                            ServerHttpRequest request,
                            ServerHttpResponse response,
                            WebSocketHandler wsHandler,
                            Exception exception) {
                        // nothing needed
                    }
                })
                .withSockJS();
    }
}