package com.fic.event_management_system.serviceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fic.event_management_system.entity.EmailDelivery;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.EmailDeliveryStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.EmailDeliveryRepository;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;

@Service
@Transactional
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailDeliveryRepository emailDeliveryRepository;
    private final NotificationService notificationService;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailServiceImpl(
            JavaMailSender mailSender,
            EmailDeliveryRepository emailDeliveryRepository,
            NotificationService notificationService) {
        this.mailSender = mailSender;
        this.emailDeliveryRepository = emailDeliveryRepository;
        this.notificationService = notificationService;
    }

    /**
     * Compatibility method for existing registration and invitation services.
     * These emails are now queued instead of being sent inside the main request.
     */
    @Override
    public void sendEmail(
            String to,
            String subject,
            String body) {

        queueEmail(
                to,
                subject,
                body,
                NotificationType.SYSTEM_ALERT,
                null,
                null,
                null,
                null,
                LocalDateTime.now()
        );
    }

    @Override
    public EmailDelivery queueEmail(
            String to,
            String subject,
            String body,
            NotificationType notificationType,
            User recipientUser,
            Portal portal,
            Event event,
            String deduplicationKey,
            LocalDateTime scheduledAt) {

        validateEmailRequest(to, subject, body);

        String normalizedKey = normalizeOptional(deduplicationKey);

        if (normalizedKey != null) {
            EmailDelivery existing = emailDeliveryRepository
                    .findByDeduplicationKey(normalizedKey)
                    .orElse(null);

            if (existing != null) {
                return existing;
            }
        }

        EmailDelivery delivery = new EmailDelivery();
        delivery.setRecipientEmail(to.trim());
        delivery.setSubject(subject.trim());
        delivery.setBody(body);
        delivery.setNotificationType(
                notificationType == null
                        ? NotificationType.SYSTEM_ALERT
                        : notificationType
        );
        delivery.setRecipientUser(recipientUser);
        delivery.setPortal(portal);
        delivery.setEvent(event);
        delivery.setDeduplicationKey(normalizedKey);
        delivery.setStatus(EmailDeliveryStatus.PENDING);
        delivery.setRetryCount(0);
        delivery.setMaxRetries(3);
        delivery.setScheduledAt(
                scheduledAt == null
                        ? LocalDateTime.now()
                        : scheduledAt
        );

        return emailDeliveryRepository.save(delivery);
    }

    @Override
    public void processPendingEmails() {
        LocalDateTime now = LocalDateTime.now();

        emailDeliveryRepository.recoverStaleProcessingDeliveries(
                EmailDeliveryStatus.PROCESSING,
                EmailDeliveryStatus.FAILED,
                now.minusMinutes(5),
                now,
                "Recovered after email worker interruption"
        );

        List<EmailDelivery> deliveries = emailDeliveryRepository
                .findTop50ByStatusInAndScheduledAtLessThanEqualOrderByCreatedAtAsc(
                        List.of(
                                EmailDeliveryStatus.PENDING,
                                EmailDeliveryStatus.FAILED
                        ),
                        now
                );

        for (EmailDelivery delivery : deliveries) {
            if (EmailDeliveryStatus.FAILED.equals(delivery.getStatus())
                    && delivery.getRetryCount() >= delivery.getMaxRetries()) {
                continue;
            }

            processDelivery(delivery);
        }
    }

    @Override
    public EmailDelivery retryEmail(Long emailDeliveryId) {
        EmailDelivery delivery = emailDeliveryRepository
                .findById(emailDeliveryId)
                .orElseThrow(() ->
                        new RuntimeException("Email delivery not found")
                );

        if (EmailDeliveryStatus.SENT.equals(delivery.getStatus())) {
            throw new IllegalStateException(
                    "A successfully sent email cannot be retried"
            );
        }

        delivery.setStatus(EmailDeliveryStatus.PENDING);
        delivery.setRetryCount(0);
        delivery.setFailureReason(null);
        delivery.setScheduledAt(LocalDateTime.now());

        return emailDeliveryRepository.save(delivery);
    }

    private void processDelivery(EmailDelivery delivery) {
        delivery.setStatus(EmailDeliveryStatus.PROCESSING);
        delivery.setLastAttemptAt(LocalDateTime.now());
        emailDeliveryRepository.save(delivery);

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }

            message.setTo(delivery.getRecipientEmail());
            message.setSubject(delivery.getSubject());
            message.setText(delivery.getBody());

            mailSender.send(message);

            delivery.setStatus(EmailDeliveryStatus.SENT);
            delivery.setSentAt(LocalDateTime.now());
            delivery.setFailureReason(null);
        } catch (Exception exception) {
            int nextRetryCount = delivery.getRetryCount() + 1;

            delivery.setRetryCount(nextRetryCount);
            delivery.setStatus(EmailDeliveryStatus.FAILED);
            delivery.setFailureReason(limitFailureReason(exception));

            if (nextRetryCount < delivery.getMaxRetries()) {
                delivery.setScheduledAt(
                        LocalDateTime.now().plusMinutes(
                                calculateRetryDelayMinutes(nextRetryCount)
                        )
                );
            } else if (delivery.getRecipientUser() != null) {
                notificationService.createNotification(
                        delivery.getRecipientUser(),
                        delivery.getPortal(),
                        delivery.getEvent(),
                        NotificationType.EMAIL_DELIVERY_FAILED,
                        "Email delivery failed",
                        "We could not deliver ‘" + delivery.getSubject()
                                + "’ after " + delivery.getMaxRetries() + " attempts.",
                        null,
                        "EMAIL_DELIVERY_FAILED_" + delivery.getId()
                );
            }
        }

        emailDeliveryRepository.save(delivery);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmailDelivery> getDeliveries(
            EmailDeliveryStatus status,
            Long portalId,
            String recipientEmail,
            Pageable pageable) {
        if (portalId != null) {
            return emailDeliveryRepository.findByPortalIdOrderByCreatedAtDesc(
                    portalId, pageable);
        }
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            return emailDeliveryRepository
                    .findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(
                            recipientEmail.trim(), pageable);
        }
        if (status != null) {
            return emailDeliveryRepository.findByStatusOrderByCreatedAtDesc(
                    status, pageable);
        }
        return emailDeliveryRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getDeliveryStatistics() {
        Map<String, Long> statistics = new LinkedHashMap<>();
        for (EmailDeliveryStatus status : EmailDeliveryStatus.values()) {
            statistics.put(status.name(), emailDeliveryRepository.countByStatus(status));
        }
        statistics.put("TOTAL", emailDeliveryRepository.count());
        return statistics;
    }

    private long calculateRetryDelayMinutes(int retryCount) {
        return switch (retryCount) {
            case 1 -> 2;
            case 2 -> 10;
            default -> 30;
        };
    }

    private String limitFailureReason(Exception exception) {
        String message = exception.getMessage();

        if (message == null || message.isBlank()) {
            message = exception.getClass().getSimpleName();
        }

        return message.length() > 1000
                ? message.substring(0, 1000)
                : message;
    }

    private void validateEmailRequest(
            String to,
            String subject,
            String body) {

        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException(
                    "Email recipient is required"
            );
        }

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException(
                    "Email subject is required"
            );
        }

        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException(
                    "Email body is required"
            );
        }
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
