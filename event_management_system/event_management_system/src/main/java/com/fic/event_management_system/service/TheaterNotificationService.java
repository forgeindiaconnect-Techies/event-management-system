package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.MovieBookedTicket;
import com.fic.event_management_system.entity.TheaterNotification;

import java.util.List;

public interface TheaterNotificationService {

    TheaterNotification createNotification(
            Long theaterPortalId,
            Long recipientUserId,
            String targetRole,
            String type,
            String title,
            String message,
            String actionUrl
    );

    void notifyNewBooking(MovieBookedTicket ticket, Long theaterPortalId);

    List<TheaterNotification> getNotificationsForUser(String authEmailOrUsername, Long portalId, int page, int size);

    long getUnreadCount(String authEmailOrUsername, Long portalId);

    TheaterNotification markAsRead(Long notificationId, String authEmailOrUsername);

    int markAllAsRead(String authEmailOrUsername, Long portalId);

    void deleteNotification(Long notificationId, String authEmailOrUsername);

    List<TheaterNotification> getAllNotificationsForSuperAdmin(int page, int size);

    List<TheaterNotification> broadcastNotification(Long portalId, String targetRole, String type, String title, String message, String actionUrl);

    void deleteNotificationBySuperAdmin(Long notificationId);
}
