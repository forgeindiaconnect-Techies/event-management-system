package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "theater_support_requests")
public class TheaterSupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 50)
    private String referenceCode;

    private Long theaterPortalId;

    @Column(length = 200)
    private String theaterName;

    @Column(length = 100)
    private String city;

    private Long requesterId;

    @Column(length = 150)
    private String requesterName;

    @Column(length = 50)
    private String dutyRole; // THEATER_OWNER, THEATER_MANAGER, CASHIER, USHER, etc.

    @Column(nullable = false, length = 150)
    private String contactEmail;

    @Column(length = 30)
    private String contactPhone;

    @Column(nullable = false, length = 60)
    private String category; // EMERGENCY_SHOW_STOPPER, GATE_SCANNER_HARDWARE, BOX_OFFICE_POS, PAYOUT_FINANCIAL, SEAT_LAYOUT, FOOD_CONCESSIONS, GENERAL

    @Column(nullable = false, length = 30)
    private String priority; // URGENT, HIGH, MEDIUM, LOW

    @Column(nullable = false, length = 30)
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @Column(nullable = false, length = 250)
    private String subject;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(length = 1000)
    private String screenshotUrl;

    @Column(length = 4000)
    private String adminResponse;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    public TheaterSupportRequest() {}

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) status = "OPEN";
        if (priority == null) priority = "MEDIUM";
        if (category == null) category = "GENERAL";
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }

    public Long getTheaterPortalId() { return theaterPortalId; }
    public void setTheaterPortalId(Long theaterPortalId) { this.theaterPortalId = theaterPortalId; }

    public String getTheaterName() { return theaterName; }
    public void setTheaterName(String theaterName) { this.theaterName = theaterName; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getDutyRole() { return dutyRole; }
    public void setDutyRole(String dutyRole) { this.dutyRole = dutyRole; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getScreenshotUrl() { return screenshotUrl; }
    public void setScreenshotUrl(String screenshotUrl) { this.screenshotUrl = screenshotUrl; }

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
