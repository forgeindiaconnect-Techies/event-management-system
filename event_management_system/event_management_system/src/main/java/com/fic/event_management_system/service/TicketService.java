package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Ticket;
import java.util.List;

public interface TicketService {

    List<Ticket> getAllTickets();

    Ticket getTicketById(Long id);

    Ticket getTicketByRegistration(Long registrationId);

    List<Ticket> getTicketsByRegistration(Long registrationId);

    Ticket markTicketAsUsed(Long ticketId);

    Ticket cancelTicket(Long ticketId);
    
    Ticket verifyTicket(String qrCode, Long staffId);
    
    List<Ticket> getTicketsByEvent(Long eventId);

    List<Ticket> searchPublicTickets(String eventName, String emailOrPhone);
}
