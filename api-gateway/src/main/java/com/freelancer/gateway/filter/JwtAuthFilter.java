package com.freelancer.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
public class JwtAuthFilter extends
        AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    // FIX 1: Added /api/auth/user/** so internal service calls to auth-service work.
    // FIX 2: Added /api/profiles/freelancer/init and /api/profiles/client/init
    //        so auth-service can auto-create profiles after registration.
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/user/",           // internal — other services call this
            "/api/profiles/skills",      // skill browsing
            "/api/profiles/freelancer/init",  // called by auth-service after register
            "/api/profiles/client/init",      // called by auth-service after register
            "/actuator"
    );

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // Step 1 — Skip JWT check for public paths
            if (isPublicPath(path)) {
                log.debug("Public path — skipping JWT: {}", path);
                return chain.filter(exchange);
            }

            // Step 2 — Check Authorization header exists
            // FIX 3: Also check query param "token" for WebSocket connections
            String authHeader = request.getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                // Check query param for WebSocket upgrade requests
                String tokenParam = request.getQueryParams().getFirst("token");
                if (tokenParam != null && !tokenParam.isBlank()) {
                    authHeader = "Bearer " + tokenParam;
                }
            }

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing or invalid Authorization header for: {}", path);
                return sendErrorResponse(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Missing or invalid Authorization header");
            }

            // Step 3 — Extract and validate JWT
            String token = authHeader.substring(7);

            try {
                Claims claims = extractClaims(token);

                String userId    = claims.getSubject();
                String role      = claims.get("role",      String.class);
                String email     = claims.get("email",     String.class);
                String firstName = claims.get("firstName", String.class);
                String lastName  = claims.get("lastName",  String.class);

                // Step 4 — Inject user info headers for downstream services
                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id",        userId)
                        .header("X-User-Role",       role)
                        .header("X-User-Email",      email)
                        .header("X-User-FirstName",  firstName)
                        .header("X-User-LastName",   lastName)
                        .headers(headers ->
                                headers.remove(HttpHeaders.AUTHORIZATION))
                        .build();

                log.debug("JWT valid — userId: {} role: {}", userId, role);
                return chain.filter(
                        exchange.mutate().request(mutatedRequest).build());

            } catch (ExpiredJwtException e) {
                log.warn("Expired JWT token for path: {}", path);
                return sendErrorResponse(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Token has expired. Please login again.");

            } catch (MalformedJwtException | SecurityException e) {
                log.warn("Invalid JWT token for path: {}", path);
                return sendErrorResponse(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Invalid token.");

            } catch (Exception e) {
                log.error("JWT processing error: {}", e.getMessage());
                return sendErrorResponse(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Token validation failed.");
            }
        };
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> sendErrorResponse(ServerWebExchange exchange,
                                          HttpStatus status,
                                          String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = """
                {
                  "status": %d,
                  "message": "%s"
                }
                """.formatted(status.value(), message);

        DataBuffer buffer = response.bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));

        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
        // Leave empty — no custom config needed
    }
}