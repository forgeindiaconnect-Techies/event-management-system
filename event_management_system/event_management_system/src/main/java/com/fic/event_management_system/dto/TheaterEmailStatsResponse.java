package com.fic.event_management_system.dto;

import java.util.List;

public class TheaterEmailStatsResponse {
    private long totalSent;
    private double deliveryRate;
    private long bouncedFailed;
    private List<TheaterEmailLogResponse> recentLogs;

    public long getTotalSent() { return totalSent; }
    public void setTotalSent(long totalSent) { this.totalSent = totalSent; }

    public double getDeliveryRate() { return deliveryRate; }
    public void setDeliveryRate(double deliveryRate) { this.deliveryRate = deliveryRate; }

    public long getBouncedFailed() { return bouncedFailed; }
    public void setBouncedFailed(long bouncedFailed) { this.bouncedFailed = bouncedFailed; }

    public List<TheaterEmailLogResponse> getRecentLogs() { return recentLogs; }
    public void setRecentLogs(List<TheaterEmailLogResponse> recentLogs) { this.recentLogs = recentLogs; }
}
