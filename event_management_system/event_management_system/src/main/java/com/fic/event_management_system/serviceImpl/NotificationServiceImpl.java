package com.fic.event_management_system.serviceImpl;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fic.event_management_system.dto.NotificationResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Notification;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.NotificationRepository;
import com.fic.event_management_system.service.NotificationService;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public NotificationResponse createNotification(
            User recipient,
            Portal portal,
            Event event,
            NotificationType type,
            String title,
            String message,
            String actionUrl,
            String deduplicationKey) {

        if (recipient == null) {
            throw new IllegalArgumentException(
                    "Notification recipient is required"
            );
        }

        if (type == null) {
            throw new IllegalArgumentException(
                    "Notification type is required"
            );
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "Notification title is required"
            );
        }

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException(
                    "Notification message is required"
            );
        }

        if (deduplicationKey != null
                && !deduplicationKey.isBlank()
                && notificationRepository.existsByDeduplicationKey(
                        deduplicationKey)) {

            return null;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setPortal(portal);
        notification.setEvent(event);
        notification.setType(type);
        notification.setTitle(title.trim());
        notification.setMessage(message.trim());
        notification.setActionUrl(normalizeOptional(actionUrl));
        notification.setDeduplicationKey(
                normalizeOptional(deduplicationKey)
        );
        notification.setRead(false);

        Notification saved =
                notificationRepository.save(notification);

        return NotificationResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsForUser(
            Long userId,
            boolean unreadOnly,
            Pageable pageable) {

        if (userId == null) {
            throw new IllegalArgumentException("User id is required");
        }

        Page<Notification> notifications;

        if (unreadOnly) {
            notifications =
                    notificationRepository
                            .findByRecipientIdAndReadFalseOrderByCreatedAtDesc(
                                    userId,
                                    pageable
                            );
        } else {
            notifications =
                    notificationRepository
                            .findByRecipientIdOrderByCreatedAtDesc(
                                    userId,
                                    pageable
                            );
        }

        return notifications.map(NotificationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required");
        }

        return notificationRepository
                .countByRecipientIdAndReadFalse(userId);
    }

    @Override
    public NotificationResponse markAsRead(
            Long notificationId,
            Long userId) {

        Notification notification =
                notificationRepository
                        .findByIdAndRecipientId(notificationId, userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Override
    public int markAllAsRead(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required");
        }

        return notificationRepository.markAllAsRead(
                userId,
                LocalDateTime.now()
        );
    }

    @Override
    public void deleteNotification(
            Long notificationId,
            Long userId) {

        long deleted =
                notificationRepository.deleteByIdAndRecipientId(
                        notificationId,
                        userId
                );

        if (deleted == 0) {
            throw new RuntimeException("Notification not found");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
