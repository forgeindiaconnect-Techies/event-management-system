package com.fic.event_management_system.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SuperAdminPortalResponse {

    private Long portalId;
    private String portalName;
    private String portalCode;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String plan;
    private String status;
    private LocalDateTime createdAt;
    private long totalEvents;
    private long totalUsers;
    private long totalRegistrations;
    private BigDecimal revenue;

    public SuperAdminPortalResponse() {
    }

    public SuperAdminPortalResponse(
            Long portalId,
            String portalName,
            String portalCode,
            String ownerName,
            String ownerEmail,
            String ownerPhone,
            String plan,
            String status,
            LocalDateTime createdAt,
            long totalEvents,
            long totalUsers,
            long totalRegistrations,
            BigDecimal revenue) {
        this.portalId = portalId;
        this.portalName = portalName;
        this.portalCode = portalCode;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.ownerPhone = ownerPhone;
        this.plan = plan;
        this.status = status;
        this.createdAt = createdAt;
        this.totalEvents = totalEvents;
        this.totalUsers = totalUsers;
        this.totalRegistrations = totalRegistrations;
        this.revenue = revenue;
    }

    public Long getPortalId() {
        return portalId;
    }

    public void setPortalId(Long portalId) {
        this.portalId = portalId;
    }

    public String getPortalName() {
        return portalName;
    }

    public void setPortalName(String portalName) {
        this.portalName = portalName;
    }

    public String getPortalCode() {
        return portalCode;
    }

    public void setPortalCode(String portalCode) {
        this.portalCode = portalCode;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getOwnerPhone() {
        return ownerPhone;
    }

    public void setOwnerPhone(String ownerPhone) {
        this.ownerPhone = ownerPhone;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}