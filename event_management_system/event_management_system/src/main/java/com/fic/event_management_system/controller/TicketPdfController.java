package com.fic.event_management_system.controller;

import com.fic.event_management_system.service.TicketPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
public class TicketPdfController {

    private final TicketPdfService ticketPdfService;

    public TicketPdfController(TicketPdfService ticketPdfService) {
        this.ticketPdfService = ticketPdfService;
    }

    @GetMapping("/{ticketId}/download")
    public ResponseEntity<byte[]> downloadTicket(
            @PathVariable Long ticketId) {

        byte[] pdf = ticketPdfService.generateTicketPdf(ticketId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=ticket.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
