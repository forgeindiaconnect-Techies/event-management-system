package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.AcceptInvitationRequest;
import com.fic.event_management_system.dto.InviteOrganizerRequest;
import com.fic.event_management_system.entity.OrganizerInvitation;
import com.fic.event_management_system.entity.User;

import java.util.List;

public interface OrganizerInvitationService {

    // New method
    OrganizerInvitation inviteOrganizer(InviteOrganizerRequest request);

    // Keep existing methods
    OrganizerInvitation createInvitation(OrganizerInvitation invitation);

    OrganizerInvitation getInvitationByToken(String token);

    List<OrganizerInvitation> getAllInvitations();

    User acceptInvitation(String token, AcceptInvitationRequest request);

    User addOrganizerManually(AcceptInvitationRequest request);

    String rejectInvitation(String token);
}
