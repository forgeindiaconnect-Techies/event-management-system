package com.fic.event_management_system.dto;

public class InviteOrganizerRequest {

    private String email;
    private Long portalId;
    private Long invitedById;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getPortalId() {
        return portalId;
    }

    public void setPortalId(Long portalId) {
        this.portalId = portalId;
    }

    public Long getInvitedById() {
        return invitedById;
    }

    public void setInvitedById(Long invitedById) {
        this.invitedById = invitedById;
    }
}