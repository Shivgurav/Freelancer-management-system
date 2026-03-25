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
import org.springframework.http.HttpMethod;
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
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /*
     * BUG FIX #9 — PUBLIC PATHS LIST WAS INCOMPLETE
     *
     * Original list was missing:
     *   - /api/auth/user/  → internal endpoint called by other services
     *   - /api/profiles/freelancer/init → called by auth-service after register
     *   - /api/profiles/client/init     → called by auth-service after register
     *
     * Without these, the gateway returned 401 on internal service-to-service
     * calls, so profile auto-creation always failed silently after registration.
     */
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/user/",                // internal — called by other services
            "/api/profiles/skills",           // public skill browsing
            "/api/profiles/freelancer/init",  // internal — called by auth-service
            "/api/profiles/client/init",      // internal — called by auth-service
            "/actuator"
    );

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            ServerHttpRequest request = exchange.getRequest();
            String path   = request.getURI().getPath();
            HttpMethod method = request.getMethod();

            /*
             * BUG FIX #10 — LET OPTIONS PREFLIGHT PASS THROUGH UNCONDITIONALLY
             *
             * CORS preflight requests are OPTIONS with no Authorization header.
             * If the gateway tries to validate a JWT on OPTIONS, it returns 401
             * which the browser treats identically to 403 — the actual POST/GET
             * never fires. OPTIONS must always be passed straight to the CORS
             * filter which will add the correct Access-Control-* headers.
             */
            if (HttpMethod.OPTIONS.equals(method)) {
                log.debug("OPTIONS preflight — passing through: {}", path);
                return chain.filter(exchange);
            }

            // Skip JWT check for public paths
            if (isPublicPath(path)) {
                log.debug("Public path — skipping JWT: {}", path);
                return chain.filter(exchange);
            }

            // Extract token from Authorization header
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            /*
             * BUG FIX #11 — WEBSOCKET TOKEN FROM QUERY PARAM
             *
             * Browser WebSocket API cannot send custom headers, so the JWT
             * must be passed as a query param: ws://host/ws/...?token=xxx
             * We promote it to a Bearer header so downstream validation works.
             */
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
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

            // Validate JWT and forward user info headers downstream
            String token = authHeader.substring(7);
            try {
                Claims claims = extractClaims(token);

                String userId    = claims.getSubject();
                String role      = claims.get("role",      String.class);
                String email     = claims.get("email",     String.class);
                String firstName = claims.get("firstName", String.class);
                String lastName  = claims.get("lastName",  String.class);

                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id",       userId)
                        .header("X-User-Role",      role)
                        .header("X-User-Email",     email)
                        .header("X-User-FirstName", firstName)
                        .header("X-User-LastName",  lastName)
                        // Strip the Authorization header — downstream services
                        // use X-User-* headers set by gateway, not the raw JWT
                        .headers(headers -> headers.remove(HttpHeaders.AUTHORIZATION))
                        .build();

                log.debug("JWT valid — userId: {} role: {}", userId, role);
                return chain.filter(exchange.mutate().request(mutatedRequest).build());

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
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
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
        // No custom config needed
    }
}