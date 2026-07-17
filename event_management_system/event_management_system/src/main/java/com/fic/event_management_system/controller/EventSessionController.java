package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.EventSession;
import com.fic.event_management_system.service.EventSessionService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class EventSessionController {

    private final EventSessionService eventSessionService;

    public EventSessionController(EventSessionService eventSessionService) {
        this.eventSessionService = eventSessionService;
    }

    @GetMapping("/events/{eventId}/sessions")
    public List<EventSession> getSessionsByEvent(@PathVariable Long eventId) {
        return eventSessionService.getSessionsByEvent(eventId);
    }

    @PostMapping("/events/{eventId}/sessions")
    public EventSession createSession(
            @PathVariable Long eventId,
            @RequestBody EventSession session) {
        return eventSessionService.createSession(eventId, session);
    }

    @PutMapping("/sessions/{sessionId}")
    public EventSession updateSession(
            @PathVariable Long sessionId,
            @RequestBody EventSession session) {
        return eventSessionService.updateSession(sessionId, session);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public void deleteSession(@PathVariable Long sessionId) {
        eventSessionService.deleteSession(sessionId);
    }
}