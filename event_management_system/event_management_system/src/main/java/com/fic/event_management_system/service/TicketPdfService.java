package com.fic.event_management_system.service;

public interface TicketPdfService {

    byte[] generateTicketPdf(Long ticketId);
}
