package com.freelancer.notification.service;

import com.freelancer.notification.dto.request.NotificationRequest;
import com.freelancer.notification.dto.response.NotificationResponse;
import com.freelancer.notification.entity.NotificationLog;
import com.freelancer.notification.repository.NotificationLogRepository;
import com.freelancer.notification.service.EmailService;
import com.freelancer.notification.service.NotificationService;
import com.freelancer.notification.template.EmailTemplateBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationLogRepository logRepository;
    private final EmailService              emailService;
    private final EmailTemplateBuilder      templateBuilder;

    // ── Send notification ─────────────────────────────────────────
    @Override
    @Transactional
    public NotificationResponse send(NotificationRequest request) {

        // Step 1 — Build subject and HTML body from template
        String subject = templateBuilder.buildSubject(
                request.getEvent(),
                request.getData());

        String htmlBody = templateBuilder.buildBody(
                request.getRecipientName(),
                request.getEvent(),
                request.getData());

        // Step 2 — Create log entry before sending
        // So we have a record even if sending fails
        NotificationLog log_ = NotificationLog.builder()
                .recipientEmail(request.getRecipientEmail())
                .recipientName(request.getRecipientName())
                .event(request.getEvent())
                .subject(subject)
                .sent(false)
                .build();

        logRepository.save(log_);

        // Step 3 — Try to send the email
        try {
            emailService.sendHtmlEmail(
                    request.getRecipientEmail(),
                    request.getRecipientName(),
                    subject,
                    htmlBody);

            // Step 4 — Mark as sent
            log_.setSent(true);
            log_.setSentAt(LocalDateTime.now());
            logRepository.save(log_);

            log.info("Notification sent — event: {} to: {}",
                    request.getEvent(),
                    request.getRecipientEmail());

        } catch (Exception e) {
            // Step 5 — Log failure but do not throw
            // We do not want to fail the caller's transaction
            // because of a notification failure
            log_.setErrorMessage(e.getMessage());
            log_.setRetryCount(log_.getRetryCount() + 1);
            logRepository.save(log_);

            log.error("Failed to send notification — " +
                      "event: {} to: {} error: {}",
                    request.getEvent(),
                    request.getRecipientEmail(),
                    e.getMessage());
        }

        return mapToResponse(log_);
    }

    // ── Get notifications for email ───────────────────────────────
    @Override
    public List<NotificationResponse> getNotificationsForEmail(
            String email) {
        return logRepository
                .findByRecipientEmail(email)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Retry failed notifications ────────────────────────────────
    // Can be called manually or by a scheduler
    @Override
    @Transactional
    public void retryFailed() {
        List<NotificationLog> failed = logRepository.findBySentFalse();

        log.info("Retrying {} failed notifications", failed.size());

        for (NotificationLog entry : failed) {
            // Skip if already tried 3 times
            if (entry.getRetryCount() >= 3) {
                log.warn("Skipping notification {} — " +
                         "max retries reached", entry.getId());
                continue;
            }

            try {
                // We cannot rebuild full HTML without original data
                // So just retry with the subject we already have
                emailService.sendHtmlEmail(
                        entry.getRecipientEmail(),
                        entry.getRecipientName(),
                        entry.getSubject(),
                        "<p>Please visit the platform " +
                        "for details.</p>");

                entry.setSent(true);
                entry.setSentAt(LocalDateTime.now());
                logRepository.save(entry);

                log.info("Retry successful for: {}",
                        entry.getRecipientEmail());

            } catch (Exception e) {
                entry.setRetryCount(entry.getRetryCount() + 1);
                entry.setErrorMessage(e.getMessage());
                logRepository.save(entry);
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────

    private NotificationResponse mapToResponse(NotificationLog n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .recipientEmail(n.getRecipientEmail())
                .recipientName(n.getRecipientName())
                .event(n.getEvent())
                .subject(n.getSubject())
                .sent(n.isSent())
                .errorMessage(n.getErrorMessage())
                .createdAt(n.getCreatedAt())
                .sentAt(n.getSentAt())
                .build();
    }
}