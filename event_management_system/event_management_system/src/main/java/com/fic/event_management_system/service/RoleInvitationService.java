package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.AcceptRoleInvitationRequest;
import com.fic.event_management_system.dto.InviteRoleRequest;
import com.fic.event_management_system.entity.RoleInvitation;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;

import java.util.List;

public interface RoleInvitationService {

    RoleInvitation inviteRoleUser(InviteRoleRequest request);

    User addRoleUserManually(InviteRoleRequest request);

    User acceptInvitation(String token, AcceptRoleInvitationRequest request);

    String rejectInvitation(String token);

    RoleInvitation getInvitationByToken(String token);

    List<RoleInvitation> getAllInvitations();
    
    List<RoleInvitation> getInvitationsByOrganizer(Long organizerId);

    List<RoleInvitation> getInvitationsByEventAndRole(Long eventId, RoleName roleName);
}
