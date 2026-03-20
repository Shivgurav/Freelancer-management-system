package com.freelancer.notification.controller;

import com.freelancer.notification.dto.request.NotificationRequest;
import com.freelancer.notification.dto.response.NotificationResponse;
import com.freelancer.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * POST /api/notifications/send
     *
     * Internal endpoint — called by other microservices only.
     * Not called by the frontend directly.
     *
     * Any service can call this without a user role
     * because it is an internal service-to-service call.
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> send(
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(notificationService.send(request));
    }

    /**
     * GET /api/notifications/my-notifications
     *
     * User views their own notification history.
     * Frontend can show a notification bell with history.
     */
    @GetMapping("/my-notifications")
    @PreAuthorize("hasRole('CLIENT') or " +
                  "hasRole('FREELANCER') or " +
                  "hasRole('ADMIN')")
    public ResponseEntity<List<NotificationResponse>>
            getMyNotifications(
                    @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(
                notificationService.getNotificationsForEmail(email));
    }

    /**
     * POST /api/notifications/retry-failed
     *
     * Admin can trigger retry of failed notifications.
     */
    @PostMapping("/retry-failed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> retryFailed() {
        notificationService.retryFailed();
        return ResponseEntity.ok().build();
    }
}