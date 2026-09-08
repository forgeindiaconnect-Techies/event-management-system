package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.AcceptRoleInvitationRequest;
import com.fic.event_management_system.dto.InviteRoleRequest;
import com.fic.event_management_system.entity.TheaterInvitation;
import com.fic.event_management_system.entity.TheaterUser;
import com.fic.event_management_system.service.TheaterInvitationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theater-invitations")
public class TheaterInvitationController {

    private final TheaterInvitationService theaterInvitationService;

    public TheaterInvitationController(TheaterInvitationService theaterInvitationService) {
        this.theaterInvitationService = theaterInvitationService;
    }

    @PostMapping("/invite")
    public TheaterInvitation inviteTheaterUser(
            @RequestBody InviteRoleRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String origin = servletRequest.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            origin = servletRequest.getHeader("Referer");
        }
        if (origin != null && origin.endsWith("/")) {
            origin = origin.substring(0, origin.length() - 1);
        }
        return theaterInvitationService.inviteTheaterStaffOrManager(request, origin);
    }

    @PostMapping("/accept/{token}")
    public TheaterUser acceptTheaterInvitation(
            @PathVariable String token,
            @RequestBody AcceptRoleInvitationRequest request) {
        return theaterInvitationService.acceptTheaterInvitation(token, request);
    }

    @PostMapping("/reject/{token}")
    public String rejectTheaterInvitation(@PathVariable String token) {
        return theaterInvitationService.rejectTheaterInvitation(token);
    }

    @DeleteMapping("/{id}")
    public void deleteTheaterInvitation(@PathVariable Long id) {
        theaterInvitationService.deleteTheaterInvitation(id);
    }

    @GetMapping("/{token}")
    public TheaterInvitation getInvitationByToken(@PathVariable String token) {
        return theaterInvitationService.getInvitationByToken(token);
    }

    @GetMapping("/portal/{portalId}")
    public List<TheaterInvitation> getPortalInvitations(@PathVariable Long portalId) {
        return theaterInvitationService.getInvitationsByPortal(portalId);
    }

    @GetMapping("/next-empid")
    public java.util.Map<String, String> getNextEmpId(@RequestParam(required = false) Long portalId) {
        String nextId = theaterInvitationService.getNextEmpIdForPortal(portalId);
        return java.util.Collections.singletonMap("nextEmpId", nextId);
    }

    @PostMapping("/direct-add")
    public TheaterInvitation directAddStaff(@RequestBody java.util.Map<String, Object> payload) {
        return theaterInvitationService.directAddTheaterStaff(payload);
    }
}
