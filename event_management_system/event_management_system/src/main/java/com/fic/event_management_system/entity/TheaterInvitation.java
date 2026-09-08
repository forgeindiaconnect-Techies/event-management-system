package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.RoleName;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "theater_invitations")
public class TheaterInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    private String name;

    private String username;

    private String dutyRole; // e.g., "Box Office Cashier", "F&B Concession Staff", "Gate Entry Usher", "Branch Manager"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleName roleName;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime expiryDate;

    @ManyToOne
    @JoinColumn(name = "theater_portal_id")
    private TheaterPortal theaterPortal;

    @ManyToOne
    @JoinColumn(name = "invited_by_theater_user_id")
    private TheaterUser invitedByTheaterUser;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = InvitationStatus.PENDING;
        }
        if (this.expiryDate == null) {
            this.expiryDate = LocalDateTime.now().plusDays(2);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public RoleName getRoleName() {
        return roleName;
    }

    public void setRoleName(RoleName roleName) {
        this.roleName = roleName;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public TheaterPortal getTheaterPortal() {
        return theaterPortal;
    }

    public void setTheaterPortal(TheaterPortal theaterPortal) {
        this.theaterPortal = theaterPortal;
    }

    public TheaterUser getInvitedByTheaterUser() {
        return invitedByTheaterUser;
    }

    public void setInvitedByTheaterUser(TheaterUser invitedByTheaterUser) {
        this.invitedByTheaterUser = invitedByTheaterUser;
    }

    public String getDutyRole() {
        return dutyRole;
    }

    public void setDutyRole(String dutyRole) {
        this.dutyRole = dutyRole;
    }
}
