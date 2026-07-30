package com.fic.event_management_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_announcements")
public class EventAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30)
    private String audience;

    @Column(nullable = false, length = 20)
    private String status;

    private LocalDateTime scheduledAt;
    private LocalDateTime publishedAt;

    @Column(nullable = false)
    private Integer recipientCount = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private long sentCount;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getAudience() { return audience; }
    public String getStatus() { return status; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public Integer getRecipientCount() { return recipientCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public long getSentCount() { return sentCount; }

    public void setId(Long id) { this.id = id; }
    public void setEvent(Event event) { this.event = event; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setAudience(String audience) { this.audience = audience; }
    public void setStatus(String status) { this.status = status; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
    public void setRecipientCount(Integer recipientCount) { this.recipientCount = recipientCount; }
    public void setSentCount(long sentCount) { this.sentCount = sentCount; }
}
