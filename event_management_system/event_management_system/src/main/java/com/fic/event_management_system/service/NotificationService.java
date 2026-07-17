package com.fic.event_management_system.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.fic.event_management_system.dto.NotificationResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.NotificationType;

public interface NotificationService {

    NotificationResponse createNotification(
            User recipient,
            Portal portal,
            Event event,
            NotificationType type,
            String title,
            String message,
            String actionUrl,
            String deduplicationKey
    );

    Page<NotificationResponse> getNotificationsForUser(
            Long userId,
            boolean unreadOnly,
            Pageable pageable
    );

    long getUnreadCount(Long userId);

    NotificationResponse markAsRead(
            Long notificationId,
            Long userId
    );

    int markAllAsRead(Long userId);

    void deleteNotification(
            Long notificationId,
            Long userId
    );
}
