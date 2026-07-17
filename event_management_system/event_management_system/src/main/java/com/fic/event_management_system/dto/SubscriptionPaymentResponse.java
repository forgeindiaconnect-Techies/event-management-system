package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SubscriptionPaymentResponse {

    private Long paymentId;
    private String paymentReference;
    private String gatewayOrderId;
    private String gatewayKeyId;

    private SubscriptionPlanCode planCode;
    private BillingCycle billingCycle;

    private BigDecimal amount;
    private BigDecimal grossAmount;
    private BigDecimal creditAmount;
    private Boolean prorated;
    private LocalDateTime accessStartAt;
    private LocalDateTime accessEndAt;
    private String currency;

    private SubscriptionPaymentStatus status;
    private LocalDateTime expiresAt;

    public SubscriptionPaymentResponse() {
    }

    public SubscriptionPaymentResponse(
            Long paymentId,
            String paymentReference,
            String gatewayOrderId,
            String gatewayKeyId,
            SubscriptionPlanCode planCode,
            BillingCycle billingCycle,
            BigDecimal amount,
            String currency,
            SubscriptionPaymentStatus status,
            LocalDateTime expiresAt
    ) {
        this.paymentId = paymentId;
        this.paymentReference = paymentReference;
        this.gatewayOrderId = gatewayOrderId;
        this.gatewayKeyId = gatewayKeyId;
        this.planCode = planCode;
        this.billingCycle = billingCycle;
        this.amount = amount;
        this.currency = currency;
        this.status = status;
        this.expiresAt = expiresAt;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getGatewayOrderId() {
        return gatewayOrderId;
    }

    public void setGatewayOrderId(String gatewayOrderId) {
        this.gatewayOrderId = gatewayOrderId;
    }

    public String getGatewayKeyId() {
        return gatewayKeyId;
    }

    public void setGatewayKeyId(String gatewayKeyId) {
        this.gatewayKeyId = gatewayKeyId;
    }

    public SubscriptionPlanCode getPlanCode() {
        return planCode;
    }

    public void setPlanCode(SubscriptionPlanCode planCode) {
        this.planCode = planCode;
    }

    public BillingCycle getBillingCycle() {
        return billingCycle;
    }

    public void setBillingCycle(BillingCycle billingCycle) {
        this.billingCycle = billingCycle;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(BigDecimal grossAmount) {
        this.grossAmount = grossAmount;
    }

    public BigDecimal getCreditAmount() {
        return creditAmount;
    }

    public void setCreditAmount(BigDecimal creditAmount) {
        this.creditAmount = creditAmount;
    }

    public Boolean getProrated() {
        return prorated;
    }

    public void setProrated(Boolean prorated) {
        this.prorated = prorated;
    }

    public LocalDateTime getAccessStartAt() {
        return accessStartAt;
    }

    public void setAccessStartAt(LocalDateTime accessStartAt) {
        this.accessStartAt = accessStartAt;
    }

    public LocalDateTime getAccessEndAt() {
        return accessEndAt;
    }

    public void setAccessEndAt(LocalDateTime accessEndAt) {
        this.accessEndAt = accessEndAt;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public SubscriptionPaymentStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionPaymentStatus status) {
        this.status = status;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
