package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.TheaterNotification;
import com.fic.event_management_system.service.TheaterNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/theaters/notifications")
public class TheaterNotificationController {

    @Autowired
    private TheaterNotificationService theaterNotificationService;

    @GetMapping
    public ResponseEntity<List<TheaterNotification>> getMyNotifications(
            Authentication authentication,
            @RequestParam(required = false) Long portalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String username = authentication != null ? authentication.getName() : null;
        List<TheaterNotification> list = theaterNotificationService.getNotificationsForUser(username, portalId, page, size);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            Authentication authentication,
            @RequestParam(required = false) Long portalId) {

        String username = authentication != null ? authentication.getName() : null;
        long count = theaterNotificationService.getUnreadCount(username, portalId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<TheaterNotification> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        String username = authentication != null ? authentication.getName() : null;
        TheaterNotification notif = theaterNotificationService.markAsRead(id, username);
        return ResponseEntity.ok(notif);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            Authentication authentication,
            @RequestParam(required = false) Long portalId) {

        String username = authentication != null ? authentication.getName() : null;
        int updated = theaterNotificationService.markAllAsRead(username, portalId);
        return ResponseEntity.ok(Map.of("success", true, "updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        String username = authentication != null ? authentication.getName() : null;
        theaterNotificationService.deleteNotification(id, username);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
