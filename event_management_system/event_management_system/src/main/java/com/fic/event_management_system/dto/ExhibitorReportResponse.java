package com.fic.event_management_system.dto;

public class ExhibitorReportResponse {

    private Long eventId;

    private long totalExhibitors;

    private long confirmedExhibitors;

    private long pendingExhibitors;

    private long totalBooths;

    private long assignedBooths;

    private long availableBooths;

    private long totalLeads;

    private long convertedLeads;

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public long getTotalExhibitors() {
        return totalExhibitors;
    }

    public void setTotalExhibitors(long totalExhibitors) {
        this.totalExhibitors = totalExhibitors;
    }

    public long getConfirmedExhibitors() {
        return confirmedExhibitors;
    }

    public void setConfirmedExhibitors(long confirmedExhibitors) {
        this.confirmedExhibitors = confirmedExhibitors;
    }

    public long getPendingExhibitors() {
        return pendingExhibitors;
    }

    public void setPendingExhibitors(long pendingExhibitors) {
        this.pendingExhibitors = pendingExhibitors;
    }

    public long getTotalBooths() {
        return totalBooths;
    }

    public void setTotalBooths(long totalBooths) {
        this.totalBooths = totalBooths;
    }

    public long getAssignedBooths() {
        return assignedBooths;
    }

    public void setAssignedBooths(long assignedBooths) {
        this.assignedBooths = assignedBooths;
    }

    public long getAvailableBooths() {
        return availableBooths;
    }

    public void setAvailableBooths(long availableBooths) {
        this.availableBooths = availableBooths;
    }

    public long getTotalLeads() {
        return totalLeads;
    }

    public void setTotalLeads(long totalLeads) {
        this.totalLeads = totalLeads;
    }

    public long getConvertedLeads() {
        return convertedLeads;
    }

    public void setConvertedLeads(long convertedLeads) {
        this.convertedLeads = convertedLeads;
    }
}
