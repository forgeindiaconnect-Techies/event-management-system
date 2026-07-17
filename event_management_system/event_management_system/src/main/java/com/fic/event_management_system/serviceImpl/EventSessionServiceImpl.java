package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.EventSession;
import com.fic.event_management_system.repository.EventSessionRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EventSessionService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EventSessionServiceImpl implements EventSessionService {

    private final EventSessionRepository eventSessionRepository;
    private final TenantSecurityService tenantSecurityService;

    public EventSessionServiceImpl(
            EventSessionRepository eventSessionRepository,
            TenantSecurityService tenantSecurityService) {

        this.eventSessionRepository = eventSessionRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public List<EventSession> getSessionsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return eventSessionRepository.findByEventIdOrderBySessionDateAscStartTimeAscIdAsc(eventId);
    }

    @Override
    public EventSession createSession(Long eventId, EventSession session) {
        Event event = tenantSecurityService.getEventFromLoggedInPortal(eventId);

        session.setEvent(event);
        normalize(session);

        return eventSessionRepository.save(session);
    }

    @Override
    public EventSession updateSession(Long sessionId, EventSession session) {
        EventSession existing = eventSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());

        existing.setTitle(session.getTitle());
        existing.setDescription(session.getDescription());
        existing.setSpeaker(session.getSpeaker());
        existing.setSessionDate(session.getSessionDate());
        existing.setStartTime(session.getStartTime());
        existing.setEndTime(session.getEndTime());
        existing.setVenue(session.getVenue());
        existing.setType(session.getType());
        existing.setCapacity(session.getCapacity());
        existing.setPeriod(session.getPeriod());

        normalize(existing);

        return eventSessionRepository.save(existing);
    }

    @Override
    public void deleteSession(Long sessionId) {
        EventSession existing = eventSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        tenantSecurityService.requireEventInLoggedInPortal(existing.getEvent());
        eventSessionRepository.delete(existing);
    }

    private void normalize(EventSession session) {
        if (session.getCapacity() == null) {
            session.setCapacity(0);
        }

        if (session.getPeriod() == null || session.getPeriod().isBlank()) {
            session.setPeriod(getPeriod(session.getStartTime()));
        }
    }

    private String getPeriod(String startTime) {
        if (startTime == null || startTime.isBlank()) {
            return "morning";
        }

        try {
            int hour = Integer.parseInt(startTime.split(":")[0]);

            if (hour < 12) {
                return "morning";
            }

            if (hour < 16) {
                return "noon";
            }

            return "evening";
        } catch (Exception error) {
            return "morning";
        }
    }
}