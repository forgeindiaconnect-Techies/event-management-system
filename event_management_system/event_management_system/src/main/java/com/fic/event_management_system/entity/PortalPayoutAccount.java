package com.fic.event_management_system.entity;

import com.fic.event_management_system.enums.GatewayProvider;
import com.fic.event_management_system.enums.PayoutStatus;
import com.fic.event_management_system.enums.PayoutVerificationStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "portal_payout_accounts",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_payout_account_portal",
            columnNames = "portal_id"
        ),
        @UniqueConstraint(
            name = "uk_payout_gateway_account",
            columnNames = {"gateway_provider", "gateway_account_id"}
        )
    }
)
public class PortalPayoutAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "portal_id", nullable = false)
    private Portal portal;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway_provider", nullable = false)
    private GatewayProvider gatewayProvider;

    @Column(name = "gateway_account_id", nullable = false)
    private String gatewayAccountId;

    private String accountHolderName;
    private String bankName;
    private String maskedAccountNumber;
    private String maskedIfsc;
    private String maskedUpiId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutVerificationStatus verificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus payoutStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime verifiedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (verificationStatus == null) {
            verificationStatus =
                    PayoutVerificationStatus.NOT_STARTED;
        }

        if (payoutStatus == null) {
            payoutStatus = PayoutStatus.DISABLED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Portal getPortal() {
        return portal;
    }

    public void setPortal(Portal portal) {
        this.portal = portal;
    }

    public GatewayProvider getGatewayProvider() {
        return gatewayProvider;
    }

    public void setGatewayProvider(
            GatewayProvider gatewayProvider) {
        this.gatewayProvider = gatewayProvider;
    }

    public String getGatewayAccountId() {
        return gatewayAccountId;
    }

    public void setGatewayAccountId(
            String gatewayAccountId) {
        this.gatewayAccountId = gatewayAccountId;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(
            String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getMaskedAccountNumber() {
        return maskedAccountNumber;
    }

    public void setMaskedAccountNumber(
            String maskedAccountNumber) {
        this.maskedAccountNumber = maskedAccountNumber;
    }

    public String getMaskedIfsc() {
        return maskedIfsc;
    }

    public void setMaskedIfsc(String maskedIfsc) {
        this.maskedIfsc = maskedIfsc;
    }

    public String getMaskedUpiId() {
        return maskedUpiId;
    }

    public void setMaskedUpiId(String maskedUpiId) {
        this.maskedUpiId = maskedUpiId;
    }

    public PayoutVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(
            PayoutVerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public PayoutStatus getPayoutStatus() {
        return payoutStatus;
    }

    public void setPayoutStatus(
            PayoutStatus payoutStatus) {
        this.payoutStatus = payoutStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
