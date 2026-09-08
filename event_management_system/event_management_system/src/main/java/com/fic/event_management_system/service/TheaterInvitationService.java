package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.AcceptRoleInvitationRequest;
import com.fic.event_management_system.dto.InviteRoleRequest;
import com.fic.event_management_system.entity.TheaterInvitation;
import com.fic.event_management_system.entity.TheaterUser;

import java.util.List;

public interface TheaterInvitationService {

    TheaterInvitation inviteTheaterStaffOrManager(InviteRoleRequest request, String activeOrigin);

    TheaterUser acceptTheaterInvitation(String token, AcceptRoleInvitationRequest request);

    String rejectTheaterInvitation(String token);

    void deleteTheaterInvitation(Long id);

    TheaterInvitation getInvitationByToken(String token);

    List<TheaterInvitation> getInvitationsByPortal(Long portalId);

    String getNextEmpIdForPortal(Long portalId);

    TheaterInvitation directAddTheaterStaff(java.util.Map<String, Object> payload);
}
