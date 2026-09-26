package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "theater_email_logs",
    indexes = {
        @Index(name = "idx_th_email_status", columnList = "status"),
        @Index(name = "idx_th_email_created_at", columnList = "created_at")
    }
)
public class TheaterEmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String subject;

    @Column(nullable = false, length = 255)
    private String recipient;

    @Column(name = "theater_name", length = 150)
    private String theaterName;

    @Column(name = "theater_portal_id")
    private Long theaterPortalId;

    @Column(length = 60)
    private String type = "Ticket Confirmation"; // Ticket Confirmation, Staff Invitation, Settlement Report, Support Resolution, Alert

    @Column(nullable = false, length = 30)
    private String status = "Delivered"; // Delivered, Failed

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public TheaterEmailLog() {}

    public TheaterEmailLog(String subject, String recipient, String theaterName, Long theaterPortalId, String type, String status, String errorMessage) {
        this.subject = subject;
        this.recipient = recipient;
        this.theaterName = theaterName;
        this.theaterPortalId = theaterPortalId;
        this.type = type;
        this.status = status;
        this.errorMessage = errorMessage;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
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

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getTheaterName() {
        return theaterName;
    }

    public void setTheaterName(String theaterName) {
        this.theaterName = theaterName;
    }

    public Long getTheaterPortalId() {
        return theaterPortalId;
    }

    public void setTheaterPortalId(Long theaterPortalId) {
        this.theaterPortalId = theaterPortalId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
