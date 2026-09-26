package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_revenue_configs")
public class PlatformRevenueConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Boolean commissionLocked = true;

    @Column(nullable = false)
    private Double commissionPercentage = 0.0;

    @Column(nullable = false)
    private Double convenienceFeePercentage = 10.0;

    private LocalDateTime lastUnlockedAt;

    private LocalDateTime lastLockedAt;

    @Column(length = 255)
    private String lastBroadcastSubject;

    @Column(length = 4000)
    private String lastBroadcastNotes;

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
