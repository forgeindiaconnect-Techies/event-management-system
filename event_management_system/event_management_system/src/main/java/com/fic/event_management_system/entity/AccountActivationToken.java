package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.AccountActivationPurpose;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "account_activation_tokens")
public class AccountActivationToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private AccountActivationPurpose purpose;
    @Column(nullable = false, unique = true, length = 128)
    private String tokenHash;
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    private LocalDateTime usedAt;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
    public Long getId(){return id;} public User getUser(){return user;} public void setUser(User user){this.user=user;}
    public AccountActivationPurpose getPurpose(){return purpose;} public void setPurpose(AccountActivationPurpose purpose){this.purpose=purpose;}
    public String getTokenHash(){return tokenHash;} public void setTokenHash(String tokenHash){this.tokenHash=tokenHash;}
    public LocalDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(LocalDateTime expiresAt){this.expiresAt=expiresAt;}
    public LocalDateTime getUsedAt(){return usedAt;} public void setUsedAt(LocalDateTime usedAt){this.usedAt=usedAt;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
}
