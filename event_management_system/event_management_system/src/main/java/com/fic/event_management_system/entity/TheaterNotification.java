package com.fic.event_management_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "theater_notifications",
    indexes = {
        @Index(name = "idx_th_notif_portal_role", columnList = "theater_portal_id, target_role, is_read"),
        @Index(name = "idx_th_notif_created_at", columnList = "created_at")
    }
)
public class TheaterNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "theater_portal_id", nullable = false)
    @JsonIgnoreProperties({"adminUser"})
    private TheaterPortal theaterPortal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_theater_user_id")
    @JsonIgnoreProperties({"password", "theaterPortal"})
    private TheaterUser recipient;

    @Column(name = "target_role", length = 60)
    private String targetRole; // ALL, THEATER_OWNER, THEATER_MANAGER, CASHIER, USHER

    @Column(nullable = false, length = 60)
    private String type = "SYSTEM_ALERT"; // TICKET_BOOKED, SUPPORT_RESOLVED, STAFF_INVITED, SYSTEM_ALERT

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(name = "action_url", length = 500)
    private String actionUrl;

    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public TheaterNotification() {}

    @PrePersist
    public void onCreate() {
        if (read == null) {
            read = false;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TheaterPortal getTheaterPortal() {
        return theaterPortal;
    }

    public void setTheaterPortal(TheaterPortal theaterPortal) {
        this.theaterPortal = theaterPortal;
    }

    public TheaterUser getRecipient() {
        return recipient;
    }

    public void setRecipient(TheaterUser recipient) {
        this.recipient = recipient;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
