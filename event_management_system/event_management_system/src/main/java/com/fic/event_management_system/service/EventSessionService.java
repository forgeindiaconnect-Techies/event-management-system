package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.EventSession;
import java.util.List;

public interface EventSessionService {

    List<EventSession> getSessionsByEvent(Long eventId);

    EventSession createSession(Long eventId, EventSession session);

    EventSession updateSession(Long sessionId, EventSession session);

    void deleteSession(Long sessionId);
}  
