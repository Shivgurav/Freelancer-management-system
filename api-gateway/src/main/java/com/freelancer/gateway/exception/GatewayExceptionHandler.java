package com.freelancer.gateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Slf4j
@Component
@Order(-1)   // runs before default Spring error handler
public class GatewayExceptionHandler
        implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange,
                              Throwable ex) {

        var response = exchange.getResponse();
        response.getHeaders()
                .setContentType(MediaType.APPLICATION_JSON);

        // Add CORS headers to error responses
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

        HttpStatus status;
        String message;

        if (ex instanceof ResponseStatusException rse) {
            status  = HttpStatus.valueOf(
                    rse.getStatusCode().value());
            message = rse.getReason() != null
                    ? rse.getReason()
                    : "Request failed";

        } else if (ex instanceof java.net.ConnectException) {
            // Service is down — give helpful message
            status  = HttpStatus.SERVICE_UNAVAILABLE;
            message = "Service temporarily unavailable. " +
                      "Please try again later.";
            log.error("Service connection failed: {}",
                    ex.getMessage());

        } else {
            status  = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "An unexpected error occurred";
            log.error("Gateway error: ", ex);
        }

        response.setStatusCode(status);

        String body = """
                {
                  "status": %d,
                  "message": "%s",
                  "timestamp": "%s"
                }
                """.formatted(
                        status.value(),
                        message,
                        LocalDateTime.now());

        DataBuffer buffer = response.bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));

        return response.writeWith(Mono.just(buffer));
    }
}