package com.fic.event_management_system.dto;

import java.time.LocalDateTime;

public class PlatformRevenueConfigDTO {
    private Long id;
    private Boolean commissionLocked;
    private Double commissionPercentage;
    private Double convenienceFeePercentage;
    private LocalDateTime lastUnlockedAt;
    private LocalDateTime lastLockedAt;
    private String lastBroadcastSubject;
    private String lastBroadcastNotes;
    private String activeStrategy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getCommissionLocked() {
        return commissionLocked;
    }

    public void setCommissionLocked(Boolean commissionLocked) {
        this.commissionLocked = commissionLocked;
    }

    public Double getCommissionPercentage() {
        return commissionPercentage;
    }

    public void setCommissionPercentage(Double commissionPercentage) {
        this.commissionPercentage = commissionPercentage;
    }

    public Double getConvenienceFeePercentage() {
        return convenienceFeePercentage;
    }

    public void setConvenienceFeePercentage(Double convenienceFeePercentage) {
        this.convenienceFeePercentage = convenienceFeePercentage;
    }

    public LocalDateTime getLastUnlockedAt() {
        return lastUnlockedAt;
    }

    public void setLastUnlockedAt(LocalDateTime lastUnlockedAt) {
        this.lastUnlockedAt = lastUnlockedAt;
    }

    public LocalDateTime getLastLockedAt() {
        return lastLockedAt;
    }

    public void setLastLockedAt(LocalDateTime lastLockedAt) {
        this.lastLockedAt = lastLockedAt;
    }

    public String getLastBroadcastSubject() {
        return lastBroadcastSubject;
    }

    public void setLastBroadcastSubject(String lastBroadcastSubject) {
        this.lastBroadcastSubject = lastBroadcastSubject;
    }

    public String getLastBroadcastNotes() {
        return lastBroadcastNotes;
    }

    public void setLastBroadcastNotes(String lastBroadcastNotes) {
        this.lastBroadcastNotes = lastBroadcastNotes;
    }

    public String getActiveStrategy() {
        return activeStrategy;
    }

    public void setActiveStrategy(String activeStrategy) {
        this.activeStrategy = activeStrategy;
    }
}
