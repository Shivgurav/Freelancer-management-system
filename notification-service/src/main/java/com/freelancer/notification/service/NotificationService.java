package com.freelancer.notification.service;

import com.freelancer.notification.dto.request.NotificationRequest;
import com.freelancer.notification.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {

    // Main method — called by all other services
    NotificationResponse send(NotificationRequest request);

    // Get all notifications for an email
    List<NotificationResponse> getNotificationsForEmail(String email);

    // Retry all failed notifications
    void retryFailed();
}