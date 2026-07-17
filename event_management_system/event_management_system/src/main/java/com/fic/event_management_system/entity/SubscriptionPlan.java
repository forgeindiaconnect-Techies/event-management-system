package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.SubscriptionPlanCode;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private SubscriptionPlanCode code;

    @Column(nullable = false)
    private String displayName;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal yearlyPrice = BigDecimal.ZERO;

    // Use -1 for unlimited.
    private Integer maxActiveEvents;
    private Integer maxPortalUsers;
    private Integer maxRegistrationsPerEvent;
    private Integer maxTicketClassesPerEvent;
    private Integer maxStaffInvitations;
    private Integer maxSpeakersPerEvent;
    private Integer maxExhibitorsPerEvent;
    private Integer maxCustomRegistrationFields;
    private Integer maxOrganizers;

    private Boolean customBranding = false;
    private Boolean advancedReports = false;
    private Boolean whiteLabel = false;
    private Boolean prioritySupport = false;

    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public SubscriptionPlanCode getCode() {
        return code;
    }

    public void setCode(SubscriptionPlanCode code) {
        this.code = code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public BigDecimal getYearlyPrice() {
        return yearlyPrice;
    }

    public void setYearlyPrice(BigDecimal yearlyPrice) {
        this.yearlyPrice = yearlyPrice;
    }

    public Integer getMaxActiveEvents() {
        return maxActiveEvents;
    }

    public void setMaxActiveEvents(Integer maxActiveEvents) {
        this.maxActiveEvents = maxActiveEvents;
    }

    public Integer getMaxPortalUsers() {
        return maxPortalUsers;
    }

    public void setMaxPortalUsers(Integer maxPortalUsers) {
        this.maxPortalUsers = maxPortalUsers;
    }

    public Integer getMaxRegistrationsPerEvent() {
        return maxRegistrationsPerEvent;
    }

    public void setMaxRegistrationsPerEvent(Integer maxRegistrationsPerEvent) {
        this.maxRegistrationsPerEvent = maxRegistrationsPerEvent;
    }

    public Integer getMaxTicketClassesPerEvent() {
        return maxTicketClassesPerEvent;
    }

    public void setMaxTicketClassesPerEvent(Integer maxTicketClassesPerEvent) {
        this.maxTicketClassesPerEvent = maxTicketClassesPerEvent;
    }

    public Integer getMaxStaffInvitations() {
        return maxStaffInvitations;
    }

    public void setMaxStaffInvitations(Integer maxStaffInvitations) {
        this.maxStaffInvitations = maxStaffInvitations;
    }

    public Integer getMaxSpeakersPerEvent() {
        return maxSpeakersPerEvent;
    }

    public void setMaxSpeakersPerEvent(Integer maxSpeakersPerEvent) {
        this.maxSpeakersPerEvent = maxSpeakersPerEvent;
    }

    public Integer getMaxExhibitorsPerEvent() {
        return maxExhibitorsPerEvent;
    }

    public void setMaxExhibitorsPerEvent(Integer maxExhibitorsPerEvent) {
        this.maxExhibitorsPerEvent = maxExhibitorsPerEvent;
    }

    public Integer getMaxCustomRegistrationFields() {
        return maxCustomRegistrationFields;
    }

    public void setMaxCustomRegistrationFields(Integer value) {
        this.maxCustomRegistrationFields = value;
    }

    public Integer getMaxOrganizers() {
        return maxOrganizers;
    }

    public void setMaxOrganizers(Integer maxOrganizers) {
        this.maxOrganizers = maxOrganizers;
    }

    public Boolean getCustomBranding() {
        return customBranding;
    }

    public void setCustomBranding(Boolean customBranding) {
        this.customBranding = customBranding;
    }

    public Boolean getAdvancedReports() {
        return advancedReports;
    }

    public void setAdvancedReports(Boolean advancedReports) {
        this.advancedReports = advancedReports;
    }

    public Boolean getWhiteLabel() {
        return whiteLabel;
    }

    public void setWhiteLabel(Boolean whiteLabel) {
        this.whiteLabel = whiteLabel;
    }

    public Boolean getPrioritySupport() {
        return prioritySupport;
    }

    public void setPrioritySupport(Boolean prioritySupport) {
        this.prioritySupport = prioritySupport;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
