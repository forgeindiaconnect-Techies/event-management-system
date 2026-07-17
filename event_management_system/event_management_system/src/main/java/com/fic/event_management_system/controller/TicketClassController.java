package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.TicketClass;
import com.fic.event_management_system.service.TicketClassService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ticket-classes")
public class TicketClassController {

    private final TicketClassService ticketClassService;

    public TicketClassController(TicketClassService ticketClassService) {
        this.ticketClassService = ticketClassService;
    }

    @GetMapping("/event/{eventId}")
    public List<TicketClass> getTicketClassesByEvent(@PathVariable Long eventId) {
        return ticketClassService.getTicketClassesByEvent(eventId);
    }

    @PostMapping("/event/{eventId}")
    public TicketClass createTicketClass(
            @PathVariable Long eventId,
            @RequestBody TicketClass ticketClass) {
        return ticketClassService.createTicketClass(eventId, ticketClass);
    }

    @PutMapping("/{id}")
    public TicketClass updateTicketClass(
            @PathVariable Long id,
            @RequestBody TicketClass ticketClass) {
        return ticketClassService.updateTicketClass(id, ticketClass);
    }

    @DeleteMapping("/{id}")
    public void deleteTicketClass(@PathVariable Long id) {
        ticketClassService.deleteTicketClass(id);
    }
}
