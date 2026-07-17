package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.RoleName;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "role_invitations")
public class RoleInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private String token;

    @Enumerated(EnumType.STRING)
    private RoleName roleName;

    @Enumerated(EnumType.STRING)
    private InvitationStatus status;

    private LocalDateTime expiryDate;

    private Long eventId;

    private String eventName;

    @Column(length = 1000)
    private String eventDescription;

    private String eventVenue;

    private String eventStartDateTime;

    private String sessionTitle;

    @Column(length = 1000)
    private String sessionDescription;

    private String sessionDate;

    private String sessionTime;

    @ManyToOne
    @JoinColumn(name = "portal_id")
    private Portal portal;

    @ManyToOne
    @JoinColumn(name = "invited_by_id")
    private User invitedBy;

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }

    public RoleName getRoleName() {
        return roleName;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public Portal getPortal() {
        return portal;
    }

    public User getInvitedBy() {
        return invitedBy;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventName() {
        return eventName;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public String getEventVenue() {
        return eventVenue;
    }

    public String getEventStartDateTime() {
        return eventStartDateTime;
    }

    public String getSessionTitle() {
        return sessionTitle;
    }

    public String getSessionDescription() {
        return sessionDescription;
    }

    public String getSessionDate() {
        return sessionDate;
    }

    public String getSessionTime() {
        return sessionTime;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setRoleName(RoleName roleName) {
        this.roleName = roleName;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public void setPortal(Portal portal) {
        this.portal = portal;
    }

    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public void setEventDescription(String eventDescription) {
        this.eventDescription = eventDescription;
    }

    public void setEventVenue(String eventVenue) {
        this.eventVenue = eventVenue;
    }

    public void setEventStartDateTime(String eventStartDateTime) {
        this.eventStartDateTime = eventStartDateTime;
    }

    public void setSessionTitle(String sessionTitle) {
        this.sessionTitle = sessionTitle;
    }

    public void setSessionDescription(String sessionDescription) {
        this.sessionDescription = sessionDescription;
    }

    public void setSessionDate(String sessionDate) {
        this.sessionDate = sessionDate;
    }

    public void setSessionTime(String sessionTime) {
        this.sessionTime = sessionTime;
    }
}
