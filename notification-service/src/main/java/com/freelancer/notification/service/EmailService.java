package com.freelancer.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name}")
    private String appName;

    public void sendHtmlEmail(String toEmail,
                               String toName,
                               String subject,
                               String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            // true = multipart message (supports HTML)
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(toEmail);
            helper.setSubject(subject);

            // true = HTML content
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email sent to: {} subject: {}",
                    toEmail, subject);

        } catch (MessagingException e) {
            log.error("Failed to send email to: {} — {}",
                    toEmail, e.getMessage());
            throw new RuntimeException(
                    "Failed to send email: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email: {}",
                    e.getMessage());
            throw new RuntimeException(
                    "Email sending failed: " + e.getMessage());
        }
    }
}