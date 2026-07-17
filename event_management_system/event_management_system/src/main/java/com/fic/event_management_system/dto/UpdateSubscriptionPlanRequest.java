package com.fic.event_management_system.dto;

import java.math.BigDecimal;

public class UpdateSubscriptionPlanRequest {

    private String displayName;
    private String description;

    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;

    private Integer maxActiveEvents;
    private Integer maxPortalUsers;
    private Integer maxRegistrationsPerEvent;
    private Integer maxTicketClassesPerEvent;
    private Integer maxStaffInvitations;
    private Integer maxSpeakersPerEvent;
    private Integer maxExhibitorsPerEvent;
    private Integer maxCustomRegistrationFields;
    private Integer maxOrganizers;

    private Boolean customBranding;
    private Boolean advancedReports;
    private Boolean whiteLabel;
    private Boolean prioritySupport;

    private Boolean active;

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

    public void setMaxRegistrationsPerEvent(
            Integer maxRegistrationsPerEvent
    ) {
        this.maxRegistrationsPerEvent = maxRegistrationsPerEvent;
    }

    public Integer getMaxTicketClassesPerEvent() {
        return maxTicketClassesPerEvent;
    }

    public void setMaxTicketClassesPerEvent(
            Integer maxTicketClassesPerEvent
    ) {
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

    public void setMaxCustomRegistrationFields(
            Integer maxCustomRegistrationFields
    ) {
        this.maxCustomRegistrationFields =
                maxCustomRegistrationFields;
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
}