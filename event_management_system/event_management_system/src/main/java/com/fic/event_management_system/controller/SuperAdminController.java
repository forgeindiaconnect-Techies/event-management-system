package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.SuperAdminDashboardResponse;
import com.fic.event_management_system.dto.SuperAdminPortalResponse;
import com.fic.event_management_system.dto.ManualSubscriptionRecoveryRequest;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionAuditLog;
import com.fic.event_management_system.dto.SubscriptionDetailsResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentHistoryResponse;
import com.fic.event_management_system.dto.UpdateSubscriptionPlanRequest;
import com.fic.event_management_system.dto.SubscriptionReceiptResponse;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.SubscriptionStatus;
import com.fic.event_management_system.service.SuperAdminService;
import com.fic.event_management_system.service.SubscriptionPaymentService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/super-admin")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final SubscriptionPaymentService subscriptionPaymentService;

    public SuperAdminController(
            SuperAdminService superAdminService,
            SubscriptionPaymentService subscriptionPaymentService
    ) {
        this.superAdminService = superAdminService;
        this.subscriptionPaymentService = subscriptionPaymentService;
    }

    @GetMapping("/dashboard")
    public SuperAdminDashboardResponse getDashboardOverview() {
        return superAdminService.getDashboardOverview();
    }

    @GetMapping("/portals")
    public List<SuperAdminPortalResponse> getPortalOverview() {
        return superAdminService.getPortalOverview();
    }

    @GetMapping("/subscription-plans")
    public List<SubscriptionPlan> getSubscriptionPlans() {
        return superAdminService.getSubscriptionPlans();
    }

    @PutMapping("/subscription-plans/{planCode}")
    public SubscriptionPlan updateSubscriptionPlan(
            @PathVariable SubscriptionPlanCode planCode,
            @RequestBody UpdateSubscriptionPlanRequest request
    ) {
        return superAdminService.updateSubscriptionPlan(planCode, request);
    }

    @GetMapping("/subscription-plans/{planCode}/audit")
    public List<SubscriptionAuditLog> getSubscriptionPlanAuditHistory(
            @PathVariable SubscriptionPlanCode planCode
    ) {
        return superAdminService.getSubscriptionPlanAuditHistory(planCode);
    }

    @GetMapping("/subscriptions")
    public List<SubscriptionDetailsResponse> getSubscriptions(
            @RequestParam(required = false) SubscriptionStatus status,
            @RequestParam(required = false) SubscriptionPlanCode plan,
            @RequestParam(required = false) Long portalId
    ) {
        return superAdminService.getSubscriptionOverview(status, plan, portalId);
    }

    @GetMapping("/subscriptions/{portalId}")
    public SubscriptionDetailsResponse getPortalSubscription(
            @PathVariable Long portalId
    ) {
        return superAdminService.getPortalSubscription(portalId);
    }

    @GetMapping("/subscriptions/{portalId}/payments")
    public List<SubscriptionPaymentHistoryResponse> getPortalPayments(
            @PathVariable Long portalId,
            @RequestParam(required = false) SubscriptionPaymentStatus status
    ) {
        return superAdminService.getSubscriptionPayments(portalId, status);
    }

    @GetMapping("/subscription-payments")
    public List<SubscriptionPaymentHistoryResponse> getSubscriptionPayments(
            @RequestParam(required = false) Long portalId,
            @RequestParam(required = false) SubscriptionPaymentStatus status
    ) {
        return superAdminService.getSubscriptionPayments(portalId, status);
    }

    @GetMapping("/subscription-payments/{paymentReference}/receipt")
    public SubscriptionReceiptResponse getSubscriptionPaymentReceipt(
            @PathVariable String paymentReference
    ) {
        return subscriptionPaymentService.getReceipt(paymentReference);
    }

    @DeleteMapping("/subscription-payments/{paymentReference}")
    public String deleteSubscriptionPaymentHistory(
            @PathVariable String paymentReference,
            @RequestParam String reason
    ) {
        superAdminService.deleteSubscriptionPaymentHistory(paymentReference, reason);
        return "Subscription payment history deleted";
    }

    @DeleteMapping("/portals/{portalId}")
    public String deleteInactivePortal(@PathVariable Long portalId) {
        superAdminService.deleteInactivePortal(portalId);
        return "Inactive portal deleted and all linked users logged out";
    }

    @PostMapping("/subscriptions/recover")
    public SubscriptionDetailsResponse recoverPaidSubscription(
            @RequestBody ManualSubscriptionRecoveryRequest request
    ) {
        return SubscriptionDetailsResponse.from(
                superAdminService.recoverPaidSubscription(request)
        );
    }

    @GetMapping("/subscriptions/audit/{portalId}")
    public List<SubscriptionAuditLog> getSubscriptionAuditHistory(
            @PathVariable Long portalId
    ) {
        return superAdminService.getSubscriptionAuditHistory(portalId);
    }

    @PostMapping("/subscriptions/cancel")
    public SubscriptionDetailsResponse cancelSubscription(
            @RequestBody Map<String, String> request
    ) {
        Long portalId = parseRequiredLong(request.get("portalId"), "Portal ID");
        return SubscriptionDetailsResponse.from(
                superAdminService.cancelSubscriptionImmediately(
                        portalId,
                        request.get("reason")
                )
        );
    }

    @PostMapping("/subscriptions/cancel-scheduled-plan")
    public SubscriptionDetailsResponse cancelScheduledPlanChange(
            @RequestBody Map<String, String> request
    ) {
        Long portalId = parseRequiredLong(request.get("portalId"), "Portal ID");
        return SubscriptionDetailsResponse.from(
                superAdminService.cancelScheduledPlanChange(
                        portalId,
                        request.get("reason")
                )
        );
    }

    @PostMapping("/subscriptions/extend")
    public SubscriptionDetailsResponse extendSubscription(
            @RequestBody Map<String, String> request
    ) {
        Long portalId = parseRequiredLong(request.get("portalId"), "Portal ID");
        int days = parseRequiredInt(request.get("days"), "Extension days");
        return SubscriptionDetailsResponse.from(
                superAdminService.extendSubscription(
                        portalId,
                        days,
                        request.get("reason")
                )
        );
    }

    @PostMapping("/subscriptions/reduce-days")
    public SubscriptionDetailsResponse reduceSubscriptionDays(
            @RequestBody Map<String, String> request
    ) {
        Long portalId = parseRequiredLong(request.get("portalId"), "Portal ID");
        int days = parseRequiredInt(request.get("days"), "Reduction days");
        return SubscriptionDetailsResponse.from(
                superAdminService.reduceSubscriptionDays(
                        portalId,
                        days,
                        request.get("reason")
                )
        );
    }

    @PostMapping("/subscriptions/change-plan")
    public SubscriptionDetailsResponse changeCurrentPlan(
            @RequestBody Map<String, String> request
    ) {
        Long portalId = parseRequiredLong(request.get("portalId"), "Portal ID");
        String planCode = request.get("planCode");
        if (planCode == null || planCode.isBlank()) {
            throw new RuntimeException("Plan code is required");
        }
        try {
            return SubscriptionDetailsResponse.from(
                    superAdminService.changeCurrentPlan(
                            portalId,
                            SubscriptionPlanCode.valueOf(planCode.trim().toUpperCase()),
                            request.get("reason")
                    )
            );
        } catch (IllegalArgumentException error) {
            throw new RuntimeException("Plan code is invalid");
        }
    }

    @PostMapping("/subscriptions/refund")
    public SubscriptionDetailsResponse refundSubscriptionPayment(
            @RequestBody Map<String, String> request
    ) {
        String paymentReference = request.get("paymentReference");
        if (paymentReference == null || paymentReference.isBlank()) {
            throw new RuntimeException("Payment reference is required");
        }

        return SubscriptionDetailsResponse.from(
                superAdminService.refundSubscriptionPayment(
                        paymentReference,
                        request.get("reason")
                )
        );
    }

    private Long parseRequiredLong(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(label + " is required");
        }

        try {
            return Long.valueOf(value);
        } catch (NumberFormatException error) {
            throw new RuntimeException(label + " is invalid");
        }
    }

    private int parseRequiredInt(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(label + " is required");
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException error) {
            throw new RuntimeException(label + " is invalid");
        }
    }
}
