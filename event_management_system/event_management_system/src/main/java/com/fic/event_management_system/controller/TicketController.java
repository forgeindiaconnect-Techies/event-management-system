package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.Ticket;
import com.fic.event_management_system.service.TicketService;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets();
    }

    @GetMapping("/{id}")
    public Ticket getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id);
    }

    @GetMapping("/registration/{registrationId}")
    public Ticket getTicketByRegistration(@PathVariable Long registrationId) {
        return ticketService.getTicketByRegistration(registrationId);
    }

    @GetMapping("/registration/{registrationId}/all")
    public List<Ticket> getTicketsByRegistration(@PathVariable Long registrationId) {
        return ticketService.getTicketsByRegistration(registrationId);
    }

    @PutMapping("/{ticketId}/used")
    public Ticket markTicketAsUsed(@PathVariable Long ticketId) {
        return ticketService.markTicketAsUsed(ticketId);
    }

    @PutMapping("/{ticketId}/cancel")
    public Ticket cancelTicket(@PathVariable Long ticketId) {
        return ticketService.cancelTicket(ticketId);
    }
    
    @PutMapping("/verify/{qrCode}/staff/{staffId}")
    public Ticket verifyTicket(
            @PathVariable String qrCode,
            @PathVariable Long staffId) {

        return ticketService.verifyTicket(qrCode, staffId);
    }
    
    @GetMapping("/event/{eventId}")
    public List<Ticket> getTicketsByEvent(@PathVariable Long eventId) {
        return ticketService.getTicketsByEvent(eventId);
    }

    @GetMapping("/search")
    public List<Ticket> searchPublicTickets(
            @RequestParam String eventName,
            @RequestParam String emailOrPhone) {

        return ticketService.searchPublicTickets(eventName, emailOrPhone);
    }
}
