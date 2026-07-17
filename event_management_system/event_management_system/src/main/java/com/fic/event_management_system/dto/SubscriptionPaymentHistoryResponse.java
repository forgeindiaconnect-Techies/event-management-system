package com.fic.event_management_system.dto;

import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionPlanCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SubscriptionPaymentHistoryResponse {

    private Long paymentId;
    private Long portalId;
    private String portalName;
    private Long subscriptionId;
    private String paymentReference;
    private String gatewayOrderId;
    private String gatewayPaymentId;
    private String invoiceNumber;
    private LocalDateTime invoiceIssuedAt;

    private SubscriptionPlanCode planCode;
    private String planName;

    private BillingCycle billingCycle;
    private BigDecimal amount;
    private String currency;

    private SubscriptionPaymentStatus status;

    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    private String failureReason;

    public static SubscriptionPaymentHistoryResponse from(
            SubscriptionPayment payment
    ) {
        SubscriptionPaymentHistoryResponse response =
                new SubscriptionPaymentHistoryResponse();

        response.paymentId = payment.getId();
        if (payment.getPortal() != null) {
            response.portalId = payment.getPortal().getId();
            response.portalName = payment.getPortal().getPortalName();
        }
        if (payment.getSubscription() != null) {
            response.subscriptionId = payment.getSubscription().getId();
        }
        response.paymentReference =
                payment.getPaymentReference();
        response.gatewayOrderId =
                payment.getGatewayOrderId();
        response.gatewayPaymentId =
                payment.getGatewayPaymentId();
        response.invoiceNumber =
                payment.getInvoiceNumber();
        response.invoiceIssuedAt =
                payment.getInvoiceIssuedAt();

        if (payment.getPlan() != null) {
            response.planCode =
                    payment.getPlan().getCode();
            response.planName =
                    payment.getPlan().getDisplayName();
        }

        response.billingCycle =
                payment.getBillingCycle();
        response.amount = payment.getAmount();
        response.currency = payment.getCurrency();
        response.status = payment.getStatus();
        response.paidAt = payment.getPaidAt();
        response.createdAt = payment.getCreatedAt();
        response.expiresAt = payment.getExpiresAt();
        response.failureReason =
                payment.getFailureReason();

        return response;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public Long getPortalId() {
        return portalId;
    }

    public String getPortalName() {
        return portalName;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public String getGatewayOrderId() {
        return gatewayOrderId;
    }

    public String getGatewayPaymentId() {
        return gatewayPaymentId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDateTime getInvoiceIssuedAt() {
        return invoiceIssuedAt;
    }

    public SubscriptionPlanCode getPlanCode() {
        return planCode;
    }

    public String getPlanName() {
        return planName;
    }

    public BillingCycle getBillingCycle() {
        return billingCycle;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public SubscriptionPaymentStatus getStatus() {
        return status;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public String getFailureReason() {
        return failureReason;
    }
}
