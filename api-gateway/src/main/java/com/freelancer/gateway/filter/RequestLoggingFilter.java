package com.freelancer.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
public class RequestLoggingFilter
        implements GlobalFilter, Ordered {

    // Runs after CorsFilter but before JwtAuthFilter
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                              GatewayFilterChain chain) {

        ServerHttpRequest request  = exchange.getRequest();
        LocalDateTime     start    = LocalDateTime.now();

        String method = request.getMethod().name();
        String path   = request.getURI().getPath();
        String query  = request.getURI().getQuery();
        String from   = request.getRemoteAddress() != null
                ? request.getRemoteAddress().getAddress()
                         .getHostAddress()
                : "unknown";

        log.info("→ {} {} {} from {}",
                method, path,
                query != null ? "?" + query : "",
                from);

        return chain.filter(exchange)
                .doFinally(signal -> {
                    long ms = ChronoUnit.MILLIS.between(
                            start, LocalDateTime.now());

                    int status = exchange.getResponse()
                            .getStatusCode() != null
                            ? exchange.getResponse()
                                      .getStatusCode().value()
                            : 0;

                    // Color code by status
                    if (status >= 500) {
                        log.error("← {} {} {}ms [{}]",
                                status, path, ms, signal);
                    } else if (status >= 400) {
                        log.warn("← {} {} {}ms [{}]",
                                status, path, ms, signal);
                    } else {
                        log.info("← {} {} {}ms",
                                status, path, ms);
                    }
                });
    }
}