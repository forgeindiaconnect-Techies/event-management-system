package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.EventDashboardResponse;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.service.EventService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return eventService.createEvent(event);
    }

    @GetMapping
    public List<Event> getAllEvents() {
        return eventService.getAllEvents();
    }

    @GetMapping("/public/{id}")
    public Event getPublicEventById(@PathVariable Long id) {
        return eventService.getPublicEventById(id);
    }

    @GetMapping("/public/status/{status}")
    public List<Event> getPublicEventsByStatus(@PathVariable String status) {
        return eventService.getPublicEventsByStatus(status);
    }

    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    @PutMapping("/{id}")
    public Event updateEvent(
            @PathVariable Long id,
            @RequestBody Event event) {

        return eventService.updateEvent(id, event);
    }

    @PutMapping("/{id}/publish")
    public Event publishEvent(@PathVariable Long id) {
        return eventService.publishEvent(id);
    }

    @PutMapping("/{id}/cancel")
    public Event cancelEvent(@PathVariable Long id) {
        return eventService.cancelEvent(id);
    }

    @PutMapping("/{id}/trash")
    public Event trashEvent(@PathVariable Long id) {
        return eventService.trashEvent(id);
    }

    @GetMapping("/drafts")
    public List<Event> getDraftEvents() {
        return eventService.getDraftEvents();
    }

    @GetMapping("/cancelled")
    public List<Event> getCancelledEvents() {
        return eventService.getCancelledEvents();
    }

    @GetMapping("/trash")
    public List<Event> getTrashedEvents() {
        return eventService.getTrashedEvents();
    }

    @GetMapping("/upcoming")
    public List<Event> getUpcomingEvents() {
        return eventService.getUpcomingEvents();
    }

    @GetMapping("/running")
    public List<Event> getRunningEvents() {
        return eventService.getRunningEvents();
    }

    @GetMapping("/past")
    public List<Event> getPastEvents() {
        return eventService.getPastEvents();
    }
    
    @GetMapping("/search")
    public List<Event> searchEventsByName(
            @RequestParam String name) {

        return eventService.searchEventsByName(name);
    }
    
    @GetMapping("/type/{eventType}")
    public List<Event> getEventsByType(@PathVariable String eventType) {
        return eventService.getEventsByType(eventType);
    }
    @GetMapping("/status/{status}")
    public List<Event> getEventsByStatus(@PathVariable String status) {
        return eventService.getEventsByStatus(status);
    }
    
    @GetMapping("/{eventId}/dashboard")
    public EventDashboardResponse getDashboard(@PathVariable Long eventId) {
        return eventService.getDashboard(eventId);
    }
    
    @PutMapping("/{id}/complete")
    public Event completeEvent(@PathVariable Long id) {
        return eventService.completeEvent(id);
    }
    
    @GetMapping("/portal/{portalId}")
    public List<Event> getEventsByPortal(@PathVariable Long portalId) {
        return eventService.getEventsByPortal(portalId);
    }

    @PutMapping("/{eventId}/assign-organizer/{organizerId}")
    public Event assignOrganizer(
            @PathVariable Long eventId,
            @PathVariable Long organizerId) {

        return eventService.assignOrganizer(eventId, organizerId);
    }

    @GetMapping("/organizer/{organizerId}")
    public List<Event> getEventsByOrganizer(@PathVariable Long organizerId) {
        return eventService.getEventsByOrganizer(organizerId);
    }
}
