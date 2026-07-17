package com.fic.event_management_system.controller;
import com.fic.event_management_system.dto.InviteOrganizerRequest;
import com.fic.event_management_system.dto.AcceptInvitationRequest;
import com.fic.event_management_system.dto.InviteOrganizerRequest;
import com.fic.event_management_system.entity.OrganizerInvitation;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.service.OrganizerInvitationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
public class OrganizerInvitationController {

    private final OrganizerInvitationService invitationService;

    public OrganizerInvitationController(OrganizerInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/invite")
    public OrganizerInvitation inviteOrganizer(
            @RequestBody InviteOrganizerRequest request) {

        return invitationService.inviteOrganizer(request);
    }

    @GetMapping
    public List<OrganizerInvitation> getAllInvitations() {
        return invitationService.getAllInvitations();
    }

    @GetMapping("/token/{token}")
    public OrganizerInvitation getInvitationByToken(@PathVariable String token) {
        return invitationService.getInvitationByToken(token);
    }
    
    @PostMapping("/accept/{token}")
    public User acceptInvitation(
            @PathVariable String token,
            @RequestBody AcceptInvitationRequest request
    ) {
        return invitationService.acceptInvitation(token, request);
    }

    @PostMapping("/manual")
    public User addOrganizerManually(@RequestBody AcceptInvitationRequest request) {
        return invitationService.addOrganizerManually(request);
    }

    @PostMapping("/reject/{token}")
    public String rejectInvitation(@PathVariable String token) {
        return invitationService.rejectInvitation(token);
    }
}
