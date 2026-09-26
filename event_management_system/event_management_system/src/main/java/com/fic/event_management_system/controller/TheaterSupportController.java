package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.CreatePublicBookingSupportRequest;
import com.fic.event_management_system.dto.CreateTheaterSupportRequest;
import com.fic.event_management_system.dto.UpdatePublicBookingSupportRequest;
import com.fic.event_management_system.dto.UpdateTheaterSupportRequest;
import com.fic.event_management_system.entity.PublicBookingSupportRequest;
import com.fic.event_management_system.entity.TheaterSupportRequest;
import com.fic.event_management_system.service.PublicBookingSupportService;
import com.fic.event_management_system.service.TheaterSupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TheaterSupportController {

    @Autowired
    private TheaterSupportService theaterSupportService;

    @Autowired
    private PublicBookingSupportService publicBookingSupportService;

    // --- 1. THEATER B2B PARTNER SUPPORT ---

    @PostMapping("/theaters/support")
    public ResponseEntity<TheaterSupportRequest> createTheaterRequest(
            @RequestBody CreateTheaterSupportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(theaterSupportService.createRequest(request));
    }

    @GetMapping("/theaters/support/mine")
    public List<TheaterSupportRequest> getMyTheaterRequests(
            @RequestParam(required = false) Long theaterPortalId) {
        return theaterSupportService.getMyTheaterRequests(theaterPortalId);
    }

    @GetMapping("/super-admin/theaters/support")
    public List<TheaterSupportRequest> getTheaterRequestsForSuperAdmin() {
        return theaterSupportService.getAllRequestsForSuperAdmin();
    }

    @PatchMapping("/super-admin/theaters/support/{id}")
    public TheaterSupportRequest updateTheaterRequest(
            @PathVariable Long id,
            @RequestBody UpdateTheaterSupportRequest request) {
        return theaterSupportService.updateRequest(id, request);
    }

    // --- 2. PUBLIC TICKET BUYER SUPPORT (MOVIES & GENERAL) ---

    @PostMapping("/public/support")
    public ResponseEntity<PublicBookingSupportRequest> createPublicTicketRequest(
            @RequestBody CreatePublicBookingSupportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(publicBookingSupportService.createRequest(request));
    }

    @GetMapping("/super-admin/theaters/public-support")
    public List<PublicBookingSupportRequest> getPublicMovieRequestsForSuperAdmin(
            @RequestParam(defaultValue = "MOVIE") String bookingType) {
        return publicBookingSupportService.getRequestsByBookingType(bookingType);
    }

    @PatchMapping("/super-admin/theaters/public-support/{id}")
    public PublicBookingSupportRequest updatePublicTicketRequest(
            @PathVariable Long id,
            @RequestBody UpdatePublicBookingSupportRequest request) {
        return publicBookingSupportService.updateRequest(id, request);
    }
}
