package com.fic.event_management_system.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.fic.event_management_system.entity.EmailDelivery;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.EmailDeliveryStatus;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.EmailService;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;
    private final UserRepository userRepository;

    public EmailController(
            EmailService emailService,
            UserRepository userRepository) {
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @PostMapping("/test")
    public Map<String, Object> queueTestEmail(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        EmailDelivery delivery = emailService.queueEmail(
                user.getEmail(),
                "FIC BackRooms email test",
                "Hello " + user.getFirstName() + ",\n\n"
                        + "Your email notification system is working.\n\n"
                        + "Regards,\nFIC BackRooms",
                NotificationType.SYSTEM_ALERT,
                user,
                user.getPortal(),
                null,
                "EMAIL_TEST_" + user.getId() + "_" + LocalDateTime.now(),
                LocalDateTime.now()
        );

        return Map.of(
                "message", "Test email queued successfully",
                "deliveryId", delivery.getId(),
                "status", delivery.getStatus()
        );
    }

    @PostMapping("/deliveries/{deliveryId}/retry")
    public Map<String, Object> retryFailedEmail(
            @PathVariable Long deliveryId) {

        EmailDelivery delivery = emailService.retryEmail(deliveryId);

        return Map.of(
                "message", "Email queued for retry",
                "deliveryId", delivery.getId(),
                "status", delivery.getStatus()
        );
    }

    @GetMapping("/deliveries")
    public Page<Map<String, Object>> getDeliveries(
            @RequestParam(required = false) EmailDeliveryStatus status,
            @RequestParam(required = false) Long portalId,
            @RequestParam(required = false) String recipientEmail,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100)
        );
        return emailService.getDeliveries(
                status, portalId, recipientEmail, pageable
        ).map(this::toDeliveryResponse);
    }

    @GetMapping("/deliveries/statistics")
    public Map<String, Long> getDeliveryStatistics() {
        return emailService.getDeliveryStatistics();
    }

    private Map<String, Object> toDeliveryResponse(EmailDelivery delivery) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", delivery.getId());
        response.put("recipientEmail", delivery.getRecipientEmail());
        response.put("notificationType", delivery.getNotificationType());
        response.put("subject", delivery.getSubject());
        response.put("status", delivery.getStatus());
        response.put("retryCount", delivery.getRetryCount());
        response.put("maxRetries", delivery.getMaxRetries());
        response.put("scheduledAt", delivery.getScheduledAt());
        response.put("lastAttemptAt", delivery.getLastAttemptAt());
        response.put("sentAt", delivery.getSentAt());
        response.put("failureReason", delivery.getFailureReason());
        response.put("createdAt", delivery.getCreatedAt());
        response.put("updatedAt", delivery.getUpdatedAt());
        response.put("portalId", delivery.getPortal() == null
                ? null : delivery.getPortal().getId());
        response.put("eventId", delivery.getEvent() == null
                ? null : delivery.getEvent().getId());
        return response;
    }

    private User getAuthenticatedUser(
            Authentication authentication) {

        if (authentication == null
                || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Authenticated user not found"
                        )
                );
    }
}
