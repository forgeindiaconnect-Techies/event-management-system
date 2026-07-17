package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.SubscriptionPaymentRequest;
import com.fic.event_management_system.dto.SubscriptionPaymentResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentVerificationRequest;
import com.fic.event_management_system.dto.SubscriptionReceiptResponse;
import com.fic.event_management_system.entity.PortalSubscription;

public interface SubscriptionPaymentService {

    SubscriptionPaymentResponse initiatePayment(
            SubscriptionPaymentRequest request
    );

    PortalSubscription verifyAndActivate(
            SubscriptionPaymentVerificationRequest request
    );

    void markPaymentFailed(
            String paymentReference,
            String failureReason
    );

    void abandonPendingPayment(String paymentReference);

    void expirePendingPayments();

    SubscriptionReceiptResponse getReceipt(String paymentReference);
}
