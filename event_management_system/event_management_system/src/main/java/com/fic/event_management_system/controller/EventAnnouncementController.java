package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.EventAnnouncement;
import com.fic.event_management_system.service.EventAnnouncementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/announcements")
public class EventAnnouncementController {

    private final EventAnnouncementService service;

    public EventAnnouncementController(EventAnnouncementService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventAnnouncement> list(@PathVariable Long eventId) {
        return service.list(eventId);
    }

    @PostMapping
    public EventAnnouncement create(
            @PathVariable Long eventId,
            @RequestBody EventAnnouncement request) {
        return service.create(eventId, request);
    }

    @PostMapping("/{announcementId}/publish")
    public EventAnnouncement publish(
            @PathVariable Long eventId,
            @PathVariable Long announcementId) {
        return service.publish(eventId, announcementId);
    }

    @DeleteMapping("/{announcementId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long eventId,
            @PathVariable Long announcementId) {
        service.delete(eventId, announcementId);
        return ResponseEntity.noContent().build();
    }
}
