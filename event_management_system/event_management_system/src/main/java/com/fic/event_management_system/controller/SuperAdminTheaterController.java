package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.*;
import com.fic.event_management_system.service.SuperAdminTheaterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin/theaters")
public class SuperAdminTheaterController {

    @Autowired
    private SuperAdminTheaterService superAdminTheaterService;

    @Autowired
    private com.fic.event_management_system.service.TheaterEmailService theaterEmailService;

    @GetMapping("/dashboard")
    public SuperAdminTheaterDashboardResponse getDashboardOverview() {
        return superAdminTheaterService.getDashboardOverview();
    }

    @GetMapping("/portals")
    public List<TheaterDirectoryResponse> getTheaterPortals() {
        return superAdminTheaterService.getTheaterPortals();
    }

    @GetMapping("/users")
    public List<TheaterPortalUserResponse> getTheaterUsers() {
        return superAdminTheaterService.getTheaterUsers();
    }

    @GetMapping("/payouts")
    public List<TheaterPayoutLedgerResponse> getTheaterPayouts() {
        return superAdminTheaterService.getTheaterPayouts();
    }

    @GetMapping("/emails/stats")
    public TheaterEmailStatsResponse getTheaterEmailStats() {
        return superAdminTheaterService.getTheaterEmailStats();
    }

    @Autowired
    private com.fic.event_management_system.service.TheaterNotificationService theaterNotificationService;

    @GetMapping("/emails/logs")
    public List<TheaterEmailLogResponse> getTheaterEmailLogs() {
        return superAdminTheaterService.getTheaterEmailLogs();
    }

    @org.springframework.web.bind.annotation.PostMapping("/emails/send")
    public org.springframework.http.ResponseEntity<?> sendTheaterEmail(
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> req) {
        String recipient = (String) req.get("recipient");
        String subject = (String) req.get("subject");
        String body = (String) req.get("body");
        String type = (String) req.get("type");
        String theaterName = (String) req.get("theaterName");
        Long portalId = null;
        if (req.get("portalId") != null) {
            try {
                portalId = Long.parseLong(String.valueOf(req.get("portalId")));
            } catch (Exception ignored) {}
        }
        theaterEmailService.sendManualSuperAdminEmail(recipient, subject, body, type, theaterName, portalId);
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("success", true, "message", "Email dispatched successfully"));
    }

    @GetMapping("/notifications")
    public org.springframework.http.ResponseEntity<?> getNotifications(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "50") int size) {
        return org.springframework.http.ResponseEntity.ok(
                theaterNotificationService.getAllNotificationsForSuperAdmin(page, size)
        );
    }

    @org.springframework.web.bind.annotation.PostMapping("/notifications/broadcast")
    public org.springframework.http.ResponseEntity<?> broadcastNotification(
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> req) {
        Long portalId = null;
        if (req.get("portalId") != null && !String.valueOf(req.get("portalId")).isBlank()) {
            try {
                portalId = Long.parseLong(String.valueOf(req.get("portalId")));
            } catch (Exception ignored) {}
        }
        String targetRole = (String) req.get("targetRole");
        String type = (String) req.get("type");
        String title = (String) req.get("title");
        String message = (String) req.get("message");
        String actionUrl = (String) req.get("actionUrl");

        List<com.fic.event_management_system.entity.TheaterNotification> created =
                theaterNotificationService.broadcastNotification(portalId, targetRole, type, title, message, actionUrl);

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "count", created.size(),
                "message", "Broadcast dispatched to " + created.size() + " portal destination(s)."
        ));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/notifications/{id}")
    public org.springframework.http.ResponseEntity<?> deleteNotification(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        theaterNotificationService.deleteNotificationBySuperAdmin(id);
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @GetMapping("/revenue-settings")
    public org.springframework.http.ResponseEntity<?> getRevenueSettings() {
        return org.springframework.http.ResponseEntity.ok(superAdminTheaterService.getRevenueSettings());
    }

    @org.springframework.web.bind.annotation.PostMapping("/revenue-settings/unlock")
    public org.springframework.http.ResponseEntity<?> unlockCommission(
            @org.springframework.web.bind.annotation.RequestBody com.fic.event_management_system.dto.UnlockCommissionRequest request) {
        return org.springframework.http.ResponseEntity.ok(superAdminTheaterService.unlockCommission(request));
    }

    @org.springframework.web.bind.annotation.PostMapping("/revenue-settings/lock")
    public org.springframework.http.ResponseEntity<?> lockCommission(
            @org.springframework.web.bind.annotation.RequestBody com.fic.event_management_system.dto.LockCommissionRequest request) {
        return org.springframework.http.ResponseEntity.ok(superAdminTheaterService.lockCommission(request));
    }

    @org.springframework.web.bind.annotation.PutMapping("/revenue-settings")
    public org.springframework.http.ResponseEntity<?> updateRevenueSettings(
            @org.springframework.web.bind.annotation.RequestBody com.fic.event_management_system.dto.PlatformRevenueConfigDTO request) {
        return org.springframework.http.ResponseEntity.ok(superAdminTheaterService.updateRevenueSettings(request));
    }
}

