package com.fic.event_management_system.dto;

import java.math.BigDecimal;

public class SuperAdminDashboardResponse {

    private long totalPortals;
    private long totalUsers;
    private long totalEvents;
    private long totalRegistrations;
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;
    private long activePortals;
    private long trialPortals;

    public SuperAdminDashboardResponse() {
    }

    public SuperAdminDashboardResponse(
            long totalPortals,
            long totalUsers,
            long totalEvents,
            long totalRegistrations,
            BigDecimal totalRevenue,
            BigDecimal monthlyRevenue,
            long activePortals,
            long trialPortals) {
        this.totalPortals = totalPortals;
        this.totalUsers = totalUsers;
        this.totalEvents = totalEvents;
        this.totalRegistrations = totalRegistrations;
        this.totalRevenue = totalRevenue;
        this.monthlyRevenue = monthlyRevenue;
        this.activePortals = activePortals;
        this.trialPortals = trialPortals;
    }

    public long getTotalPortals() {
        return totalPortals;
    }

    public void setTotalPortals(long totalPortals) {
        this.totalPortals = totalPortals;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(BigDecimal monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public long getActivePortals() {
        return activePortals;
    }

    public void setActivePortals(long activePortals) {
        this.activePortals = activePortals;
    }

    public long getTrialPortals() {
        return trialPortals;
    }

    public void setTrialPortals(long trialPortals) {
        this.trialPortals = trialPortals;
    }
}
