package com.fic.event_management_system.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.fic.event_management_system.entity.EmailDelivery;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.EmailDeliveryStatus;

public interface EmailService {

    void sendEmail(
            String to,
            String subject,
            String body
    );

    EmailDelivery queueEmail(
            String to,
            String subject,
            String body,
            NotificationType notificationType,
            User recipientUser,
            Portal portal,
            Event event,
            String deduplicationKey,
            LocalDateTime scheduledAt
    );

    void processPendingEmails();

    EmailDelivery retryEmail(Long emailDeliveryId);

    Page<EmailDelivery> getDeliveries(
            EmailDeliveryStatus status,
            Long portalId,
            String recipientEmail,
            Pageable pageable
    );

    Map<String, Long> getDeliveryStatistics();
}
