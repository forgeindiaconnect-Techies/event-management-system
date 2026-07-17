package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_classes")
public class TicketClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String name;

    private BigDecimal price = BigDecimal.ZERO;

    private Integer seats = 0;

    private Integer sold = 0;

    private String saleStatus = "Active";

    @Column(length = 1000)
    private String description;

    @Column(length = 1000)
    private String benefits;

    private Integer maxPerBuyer = 1;

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

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
    public Integer getSeats() { return seats; }
    public Integer getSold() { return sold; }
    public String getSaleStatus() { return saleStatus; }
    public String getDescription() { return description; }
    public String getBenefits() { return benefits; }
    public Integer getMaxPerBuyer() { return maxPerBuyer; }
    public Boolean getActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setEvent(Event event) { this.event = event; }
    public void setName(String name) { this.name = name; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setSeats(Integer seats) { this.seats = seats; }
    public void setSold(Integer sold) { this.sold = sold; }
    public void setSaleStatus(String saleStatus) { this.saleStatus = saleStatus; }
    public void setDescription(String description) { this.description = description; }
    public void setBenefits(String benefits) { this.benefits = benefits; }
    public void setMaxPerBuyer(Integer maxPerBuyer) { this.maxPerBuyer = maxPerBuyer; }
    public void setActive(Boolean active) { this.active = active; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
