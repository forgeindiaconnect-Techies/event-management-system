package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.SubscriptionPaymentRequest;
import com.fic.event_management_system.dto.SubscriptionPaymentResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentVerificationRequest;
import com.fic.event_management_system.dto.SubscriptionDetailsResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentHistoryResponse;
import com.fic.event_management_system.dto.SubscriptionReceiptResponse;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.repository.SubscriptionPaymentRepository;
import com.fic.event_management_system.repository.SubscriptionPlanRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.SubscriptionPaymentService;
import com.fic.event_management_system.service.SubscriptionService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final SubscriptionService subscriptionService;
    private final SubscriptionPaymentService paymentService;
    private final TenantSecurityService tenantSecurityService;

    public SubscriptionController(
            SubscriptionPlanRepository planRepository,
            SubscriptionPaymentRepository paymentRepository,
            SubscriptionService subscriptionService,
            SubscriptionPaymentService paymentService,
            TenantSecurityService tenantSecurityService
    ) {
        this.planRepository = planRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionService = subscriptionService;
        this.paymentService = paymentService;
        this.tenantSecurityService = tenantSecurityService;
    }

    @GetMapping("/plans")
    public List<SubscriptionPlan> getAvailablePlans() {
        return planRepository.findByActiveTrueOrderByMonthlyPriceAsc();
    }

    @GetMapping("/current")
    public SubscriptionDetailsResponse getCurrentSubscription() {
        Long portalId = tenantSecurityService.getLoggedInPortalId();

        return subscriptionService.getCurrentSubscription(portalId)
                .or(() -> subscriptionService.getLatestSubscription(portalId)
                        .filter(subscription ->
                                subscription.getStatus()
                                        == com.fic.event_management_system.enums.SubscriptionStatus.EXPIRED
                        ))
                .map(SubscriptionDetailsResponse::from)
                .orElse(null);
    }

    @GetMapping("/payments")
    public List<SubscriptionPaymentHistoryResponse> getPaymentHistory() {
        Long portalId = tenantSecurityService.getLoggedInPortalId();
        return paymentRepository.findByPortalIdOrderByCreatedAtDesc(portalId)
                .stream()
                .map(SubscriptionPaymentHistoryResponse::from)
                .toList();
    }

    @PostMapping("/trial/activate")
    public SubscriptionDetailsResponse activateFreeTrial() {
        if (!tenantSecurityService.isPortalAdmin()) {
            throw new RuntimeException("Only the portal admin can activate a trial");
        }
        return SubscriptionDetailsResponse.from(
                subscriptionService.createStandardTrial(
                        tenantSecurityService.getLoggedInPortal()
                )
        );
    }

    @GetMapping("/trial/eligibility")
    public Map<String, Boolean> getTrialEligibility() {
        return Map.of(
                "available",
                subscriptionService.isTrialAvailable(
                        tenantSecurityService.getLoggedInPortalId()
                )
        );
    }

    @GetMapping("/payments/{paymentReference}/receipt")
    public SubscriptionReceiptResponse getPaymentReceipt(
            @PathVariable String paymentReference
    ) {
        return paymentService.getReceipt(paymentReference);
    }

    @PostMapping("/payments/initiate")
    public SubscriptionPaymentResponse initiatePayment(
            @RequestBody SubscriptionPaymentRequest request
    ) {
        return paymentService.initiatePayment(request);
    }

    @PostMapping("/payments/verify")
    public SubscriptionDetailsResponse verifyPayment(
            @RequestBody SubscriptionPaymentVerificationRequest request
    ) {
        return SubscriptionDetailsResponse.from(
                paymentService.verifyAndActivate(request)
        );
    }

    @PostMapping("/payments/fail")
    public Map<String, String> markPaymentFailed(
            @RequestBody Map<String, String> request
    ) {
        String paymentReference = request.get("paymentReference");
        String failureReason = request.get("failureReason");

        if (paymentReference == null || paymentReference.isBlank()) {
            throw new RuntimeException("Payment reference is required");
        }

        paymentService.markPaymentFailed(
                paymentReference,
                failureReason
        );

        return Map.of("message", "Payment marked as failed");
    }

    @PostMapping("/payments/abandon")
    public Map<String, String> abandonPayment(
            @RequestBody Map<String, String> request
    ) {
        String paymentReference = request.get("paymentReference");
        if (paymentReference == null || paymentReference.isBlank()) {
            throw new RuntimeException("Payment reference is required");
        }
        paymentService.abandonPendingPayment(paymentReference);
        return Map.of("message", "Pending payment removed");
    }

    @PostMapping("/current/cancel-renewal")
    public SubscriptionDetailsResponse cancelRenewal() {
        if (!tenantSecurityService.isPortalAdmin()) {
            throw new RuntimeException("Only the portal admin can cancel renewal");
        }

        return SubscriptionDetailsResponse.from(
                subscriptionService.cancelRenewal(
                        tenantSecurityService.getLoggedInPortalId(),
                        tenantSecurityService.getLoggedInUser()
                )
        );
    }
}
