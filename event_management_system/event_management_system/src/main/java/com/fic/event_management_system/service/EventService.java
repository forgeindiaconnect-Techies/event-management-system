package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.EventDashboardResponse;
import com.fic.event_management_system.entity.Event;
import java.util.List;

public interface EventService {

    Event createEvent(Event event);

    Event getEventById(Long id);

    Event getPublicEventById(Long id);

    List<Event> getAllEvents();

    Event updateEvent(Long id, Event event);

    Event publishEvent(Long id);

    Event cancelEvent(Long id);

    Event trashEvent(Long id);

    List<Event> getDraftEvents();

    List<Event> getCancelledEvents();

    List<Event> getTrashedEvents();

    List<Event> getUpcomingEvents();

    List<Event> getRunningEvents();

    List<Event> getPastEvents();

    List<Event> searchEventsByName(String eventName);

    List<Event> getEventsByType(String eventType);

    List<Event> getEventsByStatus(String status);

    List<Event> getPublicEventsByStatus(String status);

    EventDashboardResponse getDashboard(Long eventId);

    Event completeEvent(Long id);

    List<Event> getEventsByPortal(Long portalId);

    Event assignOrganizer(Long eventId, Long organizerId);

    List<Event> getEventsByOrganizer(Long organizerId);
}