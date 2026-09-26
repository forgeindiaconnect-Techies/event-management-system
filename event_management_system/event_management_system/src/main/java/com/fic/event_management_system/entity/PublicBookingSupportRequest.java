package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "public_booking_support_requests")
public class PublicBookingSupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 50)
    private String referenceCode;

    @Column(nullable = false, length = 20)
    private String bookingType = "MOVIE"; // MOVIE, EVENT

    @Column(length = 100)
    private String bookingReference; // Booking ID, Ticket ID, or Payment Transaction ID

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(nullable = false, length = 150)
    private String customerEmail;

    @Column(length = 30)
    private String customerPhone;

    @Column(length = 200)
    private String titleOrVenueName; // e.g. Movie Title / Theater Name

    @Column(nullable = false, length = 60)
    private String category; // PAYMENT_DEBITED_NO_TICKET, TICKET_NOT_RECEIVED, GATE_SCAN_FAILURE, CANCEL_REFUND_REQUEST, SEAT_ISSUE, GENERAL

    @Column(nullable = false, length = 30)
    private String priority; // URGENT, HIGH, MEDIUM, LOW

    @Column(nullable = false, length = 30)
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @Column(nullable = false, length = 250)
    private String subject;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(length = 4000)
    private String adminResponse;

    private Boolean refundProcessed = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    public PublicBookingSupportRequest() {}

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (bookingType == null) bookingType = "MOVIE";
        if (status == null) status = "OPEN";
        if (priority == null) priority = "MEDIUM";
        if (category == null) category = "GENERAL";
        if (refundProcessed == null) refundProcessed = false;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }

    public String getBookingType() { return bookingType; }
    public void setBookingType(String bookingType) { this.bookingType = bookingType; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getTitleOrVenueName() { return titleOrVenueName; }
    public void setTitleOrVenueName(String titleOrVenueName) { this.titleOrVenueName = titleOrVenueName; }

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

    public String getAdminResponse() { return adminResponse; }
    public void setAdminResponse(String adminResponse) { this.adminResponse = adminResponse; }

    public Boolean getRefundProcessed() { return refundProcessed; }
    public void setRefundProcessed(Boolean refundProcessed) { this.refundProcessed = refundProcessed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
