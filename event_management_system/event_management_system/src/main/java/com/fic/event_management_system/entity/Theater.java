package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fic.event_management_system.enums.TheaterType;

@Entity
@Table(name = "theaters")
public class Theater {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(length = 1000)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TheaterType theaterType = TheaterType.SINGLE_SCREEN;

    private String ownerEmail;

    private Double convenienceFeePerTicket = 25.0;

    @ManyToOne
    @JoinColumn(name = "portal_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"theaters"})
    private Portal portal;

    @ManyToOne
    @JoinColumn(name = "theater_portal_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"adminUser"})
    private TheaterPortal theaterPortal;

    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public TheaterType getTheaterType() {
        return theaterType;
    }

    public void setTheaterType(TheaterType theaterType) {
        this.theaterType = theaterType;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public Double getConvenienceFeePerTicket() {
        return convenienceFeePerTicket;
    }

    public void setConvenienceFeePerTicket(Double convenienceFeePerTicket) {
        this.convenienceFeePerTicket = convenienceFeePerTicket;
    }

    public Portal getPortal() {
        return portal;
    }

    public void setPortal(Portal portal) {
        this.portal = portal;
    }

    public TheaterPortal getTheaterPortal() {
        return theaterPortal;
    }

    public void setTheaterPortal(TheaterPortal theaterPortal) {
        this.theaterPortal = theaterPortal;
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
