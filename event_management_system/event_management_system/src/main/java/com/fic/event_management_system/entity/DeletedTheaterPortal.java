package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deleted_theater_portals")
public class DeletedTheaterPortal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long originalTheaterId;

    @Column(nullable = false)
    private String name;

    private String ownerEmail;

    @Column(length = 1000)
    private String reason;

    private String actionType = "PERMANENT_PURGE"; // PERMANENT_PURGE, DEACTIVATED

    private Integer screensCount = 0;

    private Long ticketsCount = 0L;

    private LocalDateTime deletedAt;

    @PrePersist
    public void onCreate() {
        if (deletedAt == null) {
            deletedAt = LocalDateTime.now();
        }
    }

    public DeletedTheaterPortal() {}

    public DeletedTheaterPortal(Long originalTheaterId, String name, String ownerEmail, String reason, String actionType, Integer screensCount, Long ticketsCount) {
        this.originalTheaterId = originalTheaterId;
        this.name = name;
        this.ownerEmail = ownerEmail;
        this.reason = reason;
        this.actionType = actionType;
        this.screensCount = screensCount;
        this.ticketsCount = ticketsCount;
        this.deletedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOriginalTheaterId() {
        return originalTheaterId;
    }

    public void setOriginalTheaterId(Long originalTheaterId) {
        this.originalTheaterId = originalTheaterId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public Integer getScreensCount() {
        return screensCount;
    }

    public void setScreensCount(Integer screensCount) {
        this.screensCount = screensCount;
    }

    public Long getTicketsCount() {
        return ticketsCount;
    }

    public void setTicketsCount(Long ticketsCount) {
        this.ticketsCount = ticketsCount;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}
