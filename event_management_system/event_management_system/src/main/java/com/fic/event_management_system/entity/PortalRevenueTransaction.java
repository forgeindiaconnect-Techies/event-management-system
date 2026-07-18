package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.PaymentStatus;
import com.fic.event_management_system.enums.RevenuePayoutStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "portal_revenue_transactions", uniqueConstraints = @UniqueConstraint(name = "uk_revenue_registration", columnNames = "registration_id"))
public class PortalRevenueTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false) @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;
    @ManyToOne(optional = false) @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    @ManyToOne(optional = false) @JoinColumn(name = "portal_id", nullable = false)
    private Portal portal;
    @ManyToOne(optional = false) @JoinColumn(name = "payout_account_id", nullable = false)
    private PortalPayoutAccount payoutAccount;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal grossAmount;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal platformFee;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal portalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private PaymentStatus paymentStatus;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private RevenuePayoutStatus payoutStatus;
    private String paymentReference;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist public void onCreate(){createdAt=LocalDateTime.now();updatedAt=createdAt;}
    @PreUpdate public void onUpdate(){updatedAt=LocalDateTime.now();}
    public Long getId(){return id;} public Registration getRegistration(){return registration;} public void setRegistration(Registration v){registration=v;}
    public Event getEvent(){return event;} public void setEvent(Event v){event=v;} public Portal getPortal(){return portal;} public void setPortal(Portal v){portal=v;}
    public PortalPayoutAccount getPayoutAccount(){return payoutAccount;} public void setPayoutAccount(PortalPayoutAccount v){payoutAccount=v;}
    public BigDecimal getGrossAmount(){return grossAmount;} public void setGrossAmount(BigDecimal v){grossAmount=v;} public BigDecimal getPlatformFee(){return platformFee;} public void setPlatformFee(BigDecimal v){platformFee=v;}
    public BigDecimal getPortalAmount(){return portalAmount;} public void setPortalAmount(BigDecimal v){portalAmount=v;} public PaymentStatus getPaymentStatus(){return paymentStatus;} public void setPaymentStatus(PaymentStatus v){paymentStatus=v;}
    public RevenuePayoutStatus getPayoutStatus(){return payoutStatus;} public void setPayoutStatus(RevenuePayoutStatus v){payoutStatus=v;} public String getPaymentReference(){return paymentReference;} public void setPaymentReference(String v){paymentReference=v;}
    public LocalDateTime getPaidAt(){return paidAt;} public void setPaidAt(LocalDateTime v){paidAt=v;} public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
