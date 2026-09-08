package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fic.event_management_system.enums.PortalType;

@Entity
@Table(name = "partner_invite_tokens")
public class PartnerInviteToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    private String partnerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PortalType portalType = PortalType.THEATER_PORTAL;

    private String city;

    @Column(nullable = false, unique = true)
    private String token;

    private Boolean isUsed = false;

    private LocalDateTime createdAt;
    private LocalDateTime expiryDate;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiryDate == null) {
            expiryDate = createdAt.plusDays(7); // Valid for 7 days
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPartnerName() {
        return partnerName;
    }

    public void setPartnerName(String partnerName) {
        this.partnerName = partnerName;
    }

    public PortalType getPortalType() {
        return portalType;
    }

    public void setPortalType(PortalType portalType) {
        this.portalType = portalType;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Boolean getIsUsed() {
        return isUsed;
    }

    public void setIsUsed(Boolean isUsed) {
        this.isUsed = isUsed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }
}
