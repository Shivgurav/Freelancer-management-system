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
import java.util.regex.Pattern;
import java.util.List;

@Slf4j
@Component
public class JwtAuthFilter extends
        AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    // ── Exact public paths — must match exactly ───────────────────
    // These paths skip JWT validation completely
    private static final List<String> PUBLIC_EXACT = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/profiles/skills",
            "/api/jobs",
            "/api/notifications/send",
            "/api/search/freelancers/top-rated",
            "/api/search/jobs/latest"
    );

    // ── Prefix public paths — anything starting with these ────────
    // Be VERY careful here — only truly public prefixes
    private static final List<String> PUBLIC_PREFIXES = List.of(
    	    "/api/auth/register",
    	    "/api/auth/login",
    	    "/api/auth/refresh",
    	    "/api/auth/user/",
    	    "/api/profiles/skills",
    	    "/api/search/sync/",
    	    "/api/search/freelancers/top-rated",
    	    "/api/search/jobs/latest",
    	    "/api/notifications/send",
    	    "/api/reviews/user/",
    	    "/api/messages/room",
    	    "/ws/",              // ← WebSocket connection
    	    "/ws/info",          // ← SockJS info endpoint
    	    "/actuator"
    	);

    // ── Regex patterns for dynamic public paths ───────────────────
    // e.g. GET /api/profiles/freelancer/123-uuid  → public
    // but  GET /api/profiles/freelancer/me         → requires auth
    private static final List<Pattern> PUBLIC_PATTERNS = List.of(
            // View a specific freelancer profile by ID (UUID)
            Pattern.compile(
                "/api/profiles/freelancer/" +
                "[0-9a-f]{8}-[0-9a-f]{4}-" +
                "[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"),

            // View a specific client profile by ID (UUID)
            Pattern.compile(
                "/api/profiles/client/" +
                "[0-9a-f]{8}-[0-9a-f]{4}-" +
                "[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"),

            // View a specific job by ID (UUID) — public
            Pattern.compile(
                "/api/jobs/" +
                "[0-9a-f]{8}-[0-9a-f]{4}-" +
                "[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"),

            // Public job search
            Pattern.compile("/api/jobs/search.*"),

            // Public skill search
            Pattern.compile("/api/profiles/skills/search.*"),

            // Public freelancer search
            Pattern.compile("/api/search/freelancers.*"),
            Pattern.compile("/api/search/jobs.*")
    );

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            ServerHttpRequest request = exchange.getRequest();
            String path   = request.getURI().getPath();
            String method = request.getMethod().name();

            // Step 1 — Check if path is public
            if (isPublicPath(path, method)) {
                log.debug("Public path — skipping JWT: {} {}",
                        method, path);
                return chain.filter(exchange);
            }

            // Step 2 — Check Authorization header
            String authHeader = request.getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null
                    || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing Authorization header: {} {}",
                        method, path);
                return sendError(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Missing or invalid Authorization header");
            }

            // Step 3 — Validate JWT
            String token = authHeader.substring(7);

            try {
                Claims claims = extractClaims(token);

                String userId    = claims.getSubject();
                String role      = claims.get("role", String.class);
                String email     = claims.get("email", String.class);
                String firstName = claims.get("firstName",
                                             String.class);
                String lastName  = claims.get("lastName",
                                             String.class);

                String fullName = buildFullName(firstName, lastName);

                // Step 4 — Remove JWT, inject user headers
                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id",        userId)
                        .header("X-User-Role",       role)
                        .header("X-User-Email",      email)
                        .header("X-User-FirstName",
                                firstName != null ? firstName : "")
                        .header("X-User-LastName",
                                lastName  != null ? lastName  : "")
                        .header("X-User-FullName",   fullName)
                        .headers(h -> h.remove(
                                HttpHeaders.AUTHORIZATION))
                        .build();

                log.debug("JWT valid — userId: {} role: {} path: {}",
                        userId, role, path);

                return chain.filter(
                        exchange.mutate()
                                .request(mutatedRequest)
                                .build());

            } catch (ExpiredJwtException e) {
                log.warn("Expired JWT for: {} {}", method, path);
                return sendError(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Token has expired. Please login again.");

            } catch (MalformedJwtException | SecurityException e) {
                log.warn("Invalid JWT for: {} {}", method, path);
                return sendError(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Invalid token.");

            } catch (Exception e) {
                log.error("JWT error for {} {}: {}",
                        method, path, e.getMessage());
                return sendError(exchange,
                        HttpStatus.UNAUTHORIZED,
                        "Token validation failed.");
            }
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private boolean isPublicPath(String path, String method) {

        // Check exact matches
        if (PUBLIC_EXACT.contains(path)) {
            return true;
        }

        // Check prefix matches
        boolean prefixMatch = PUBLIC_PREFIXES.stream()
                .anyMatch(path::startsWith);
        if (prefixMatch) {
            return true;
        }

        // Check regex patterns
        boolean patternMatch = PUBLIC_PATTERNS.stream()
                .anyMatch(p -> p.matcher(path).matches());
        if (patternMatch) {
            return true;
        }

        // GET /api/jobs — public job listing
        if ("GET".equals(method) && "/api/jobs".equals(path)) {
            return true;
        }

        return false;
    }

    private String buildFullName(String firstName, String lastName) {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        }
        return "";
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

    private Mono<Void> sendError(ServerWebExchange exchange,
                                  HttpStatus status,
                                  String message) {
        ServerHttpResponse response = exchange.getResponse();

        String origin = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.ORIGIN);

        if (origin != null) {
            response.getHeaders().set(
                    HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                    origin);
            response.getHeaders().set(
                    HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS,
                    "true");
        }

        response.setStatusCode(status);
        response.getHeaders()
                .setContentType(MediaType.APPLICATION_JSON);

        String body = """
                {
                  "status": %d,
                  "message": "%s",
                  "timestamp": "%s"
                }
                """.formatted(
                        status.value(),
                        message,
                        java.time.LocalDateTime.now());

        DataBuffer buffer = response.bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));

        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {}
}