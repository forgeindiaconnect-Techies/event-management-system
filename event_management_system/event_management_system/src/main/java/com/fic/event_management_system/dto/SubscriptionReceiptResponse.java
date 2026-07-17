package com.fic.event_management_system.dto;

import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionPlanCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SubscriptionReceiptResponse {

    private String invoiceNumber;
    private LocalDateTime invoiceIssuedAt;

    private Long paymentId;
    private String paymentReference;
    private String gatewayOrderId;
    private String gatewayPaymentId;

    private Long portalId;
    private String portalName;
    private String portalCode;
    private String ownerName;
    private String ownerEmail;

    private SubscriptionPlanCode planCode;
    private String planName;
    private BillingCycle billingCycle;

    private BigDecimal amount;
    private String currency;
    private SubscriptionPaymentStatus paymentStatus;
    private LocalDateTime paidAt;

    private LocalDateTime subscriptionStartDate;
    private LocalDateTime subscriptionEndDate;

    public static SubscriptionReceiptResponse from(
            SubscriptionPayment payment
    ) {
        if (payment == null) {
            return null;
        }

        SubscriptionReceiptResponse response =
                new SubscriptionReceiptResponse();

        response.invoiceNumber = payment.getInvoiceNumber();
        response.invoiceIssuedAt = payment.getInvoiceIssuedAt();

        response.paymentId = payment.getId();
        response.paymentReference = payment.getPaymentReference();
        response.gatewayOrderId = payment.getGatewayOrderId();
        response.gatewayPaymentId = payment.getGatewayPaymentId();

        Portal portal = payment.getPortal();

        if (portal != null) {
            response.portalId = portal.getId();
            response.portalName = portal.getPortalName();
            response.portalCode = portal.getPortalCode();

            if (portal.getAdmin() != null) {
                response.ownerEmail = portal.getAdmin().getEmail();

                String firstName =
                        portal.getAdmin().getFirstName() == null
                                ? ""
                                : portal.getAdmin()
                                        .getFirstName()
                                        .trim();

                String lastName =
                        portal.getAdmin().getLastName() == null
                                ? ""
                                : portal.getAdmin()
                                        .getLastName()
                                        .trim();

                String fullName =
                        (firstName + " " + lastName).trim();

                response.ownerName = fullName.isBlank()
                        ? response.ownerEmail
                        : fullName;
            }
        }

        SubscriptionPlan plan = payment.getPlan();

        if (plan != null) {
            response.planCode = plan.getCode();
            response.planName = plan.getDisplayName();
        }

        response.billingCycle = payment.getBillingCycle();
        response.amount = payment.getAmount();
        response.currency = payment.getCurrency();
        response.paymentStatus = payment.getStatus();
        response.paidAt = payment.getPaidAt();

        PortalSubscription subscription =
                payment.getSubscription();

        if (subscription != null) {
            response.subscriptionStartDate =
                    subscription.getStartDate();
            response.subscriptionEndDate =
                    subscription.getEndDate();
        }

        return response;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDateTime getInvoiceIssuedAt() {
        return invoiceIssuedAt;
    }

    public Long getPaymentId() {
        return paymentId;
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

    public Long getPortalId() {
        return portalId;
    }

    public String getPortalName() {
        return portalName;
    }

    public String getPortalCode() {
        return portalCode;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
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

    public SubscriptionPaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public LocalDateTime getSubscriptionStartDate() {
        return subscriptionStartDate;
    }

    public LocalDateTime getSubscriptionEndDate() {
        return subscriptionEndDate;
    }
}
