package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.AcceptRoleInvitationRequest;
import com.fic.event_management_system.dto.InviteRoleRequest;
import com.fic.event_management_system.entity.RoleInvitation;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.service.RoleInvitationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/role-invitations")
public class RoleInvitationController {

    private final RoleInvitationService roleInvitationService;

    public RoleInvitationController(RoleInvitationService roleInvitationService) {
        this.roleInvitationService = roleInvitationService;
    }

    @PostMapping("/invite")
    public RoleInvitation inviteRoleUser(@RequestBody InviteRoleRequest request) {
        return roleInvitationService.inviteRoleUser(request);
    }

    @PostMapping("/manual")
    public User addRoleUserManually(@RequestBody InviteRoleRequest request) {
        return roleInvitationService.addRoleUserManually(request);
    }

    @PostMapping("/accept/{token}")
    public User acceptInvitation(
            @PathVariable String token,
            @RequestBody AcceptRoleInvitationRequest request) {

        return roleInvitationService.acceptInvitation(token, request);
    }

    @PostMapping("/reject/{token}")
    public String rejectInvitation(@PathVariable String token) {
        return roleInvitationService.rejectInvitation(token);
    }

    @GetMapping("/{token}")
    public RoleInvitation getInvitationByToken(@PathVariable String token) {
        return roleInvitationService.getInvitationByToken(token);
    }

    @GetMapping
    public List<RoleInvitation> getAllInvitations() {
        return roleInvitationService.getAllInvitations();
    }
    
    @GetMapping("/organizer/{organizerId}")
    public List<RoleInvitation> getOrganizerInvitations(
            @PathVariable Long organizerId) {

        return roleInvitationService.getInvitationsByOrganizer(organizerId);
    }
}
