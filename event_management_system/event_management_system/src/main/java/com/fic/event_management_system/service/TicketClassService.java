package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.TicketClass;
import java.util.List;

public interface TicketClassService {
    List<TicketClass> getTicketClassesByEvent(Long eventId);
    TicketClass createTicketClass(Long eventId, TicketClass ticketClass);
    TicketClass updateTicketClass(Long id, TicketClass ticketClass);
    void deleteTicketClass(Long id);
}
