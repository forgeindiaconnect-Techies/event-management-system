package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.CreateSupportRequestRequest;
import com.fic.event_management_system.dto.UpdateSupportRequestRequest;
import com.fic.event_management_system.entity.SupportRequest;
import com.fic.event_management_system.service.SupportRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support-requests")
public class SupportRequestController {

    private final SupportRequestService supportRequestService;

    public SupportRequestController(
            SupportRequestService supportRequestService) {

        this.supportRequestService = supportRequestService;
    }

    @PostMapping
    public ResponseEntity<SupportRequest> createRequest(
            @RequestBody CreateSupportRequestRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        supportRequestService
                                .createRequest(request)
                );
    }

    @GetMapping("/mine")
    public List<SupportRequest> getMyRequests() {
        return supportRequestService.getMyRequests();
    }

    @GetMapping
    public List<SupportRequest> getAllRequests() {
        return supportRequestService.getAllRequests();
    }

    @GetMapping("/{requestId}")
    public SupportRequest getRequestById(
            @PathVariable Long requestId) {

        return supportRequestService
                .getRequestById(requestId);
    }

    @PatchMapping("/{requestId}")
    public SupportRequest updateRequest(
            @PathVariable Long requestId,
            @RequestBody UpdateSupportRequestRequest request) {

        return supportRequestService
                .updateRequest(requestId, request);
    }
}