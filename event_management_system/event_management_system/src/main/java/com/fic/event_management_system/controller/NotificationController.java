package com.fic.event_management_system.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fic.event_management_system.dto.NotificationResponse;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public Page<NotificationResponse> getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = getAuthenticatedUser(authentication);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(safePage, safeSize);

        return notificationService.getNotificationsForUser(
                user.getId(),
                unreadOnly,
                pageable
        );
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        long unreadCount =
                notificationService.getUnreadCount(user.getId());

        return Map.of("unreadCount", unreadCount);
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return notificationService.markAsRead(
                notificationId,
                user.getId()
        );
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> markAllAsRead(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        int updated =
                notificationService.markAllAsRead(user.getId());

        return Map.of("updated", updated);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        notificationService.deleteNotification(
                notificationId,
                user.getId()
        );

        return ResponseEntity
                .status(HttpStatus.NO_CONTENT)
                .build();
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
