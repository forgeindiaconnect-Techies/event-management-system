package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.PaymentRequest;
import com.fic.event_management_system.dto.PublicRegistrationRequest;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.service.RegistrationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/event/{eventId}/participant/{participantId}")
    public Registration registerForEvent(
            @PathVariable Long eventId,
            @PathVariable Long participantId,
            @RequestParam String type) {

        return registrationService.registerForEvent(eventId, participantId, type);
    }

    @GetMapping
    public List<Registration> getAllRegistrations() {
        return registrationService.getAllRegistrations();
    }

    @GetMapping("/{id}")
    public Registration getRegistrationById(@PathVariable Long id) {
        return registrationService.getRegistrationById(id);
    }

    @GetMapping("/event/{eventId}")
    public List<Registration> getRegistrationsByEvent(@PathVariable Long eventId) {
        return registrationService.getRegistrationsByEvent(eventId);
    }

    @PutMapping("/{registrationId}/cancel")
    public String cancelRegistration(@PathVariable Long registrationId) {
        return registrationService.cancelRegistration(registrationId);
    }
    
    @GetMapping("/event/{eventId}/type/{type}")
    public List<Registration> getRegistrationsByEventAndType(
            @PathVariable Long eventId,
            @PathVariable String type) {

        return registrationService.getRegistrationsByEventAndType(eventId, type);
    }
    
    @PutMapping("/{registrationId}/mark-paid")
    public Registration markAsPaid(
            @PathVariable Long registrationId,
            @RequestBody PaymentRequest request) {

        return registrationService.markAsPaid(
                registrationId,
                request.getPaymentMethod()
        );
    }

    @PutMapping("/{registrationId}/payment/start")
    public Registration startPayment(
            @PathVariable Long registrationId,
            @RequestBody PaymentRequest request) {

        return registrationService.startPayment(
                registrationId,
                request.getPaymentMethod()
        );
    }
    
    @PutMapping("/{registrationId}/mark-failed")
    public Registration markAsPaymentFailed(@PathVariable Long registrationId) {
        return registrationService.markAsPaymentFailed(registrationId);
    }

    @PutMapping("/{registrationId}/payment/manual-status")
    public Registration updatePaymentStatusManually(
            @PathVariable Long registrationId,
            @RequestParam String status) {

        return registrationService.updatePaymentStatusManually(registrationId, status);
    }
    
    @GetMapping("/event/{eventId}/waitlist")
    public List<Registration> getWaitlistByEvent(@PathVariable Long eventId) {
        return registrationService.getWaitlistByEvent(eventId);
    }
    
    @GetMapping("/portal/{portalId}")
    public List<Registration> getRegistrationsByPortal(@PathVariable Long portalId) {
        return registrationService.getRegistrationsByPortal(portalId);
    }
    
    @PutMapping("/{registrationId}/attendance")
    public Registration markAttendance(@PathVariable Long registrationId) {
        return registrationService.markAttendance(registrationId);
    }
    
    @PostMapping("/public/event/{eventId}")
    public Registration publicRegister(
            @PathVariable Long eventId,
            @RequestBody PublicRegistrationRequest request) {

        return registrationService.publicRegister(eventId, request);
    }
}
