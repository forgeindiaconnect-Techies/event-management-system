package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.SuperAdminDashboardResponse;
import com.fic.event_management_system.dto.SuperAdminPortalResponse;
import com.fic.event_management_system.dto.ManualSubscriptionRecoveryRequest;
import com.fic.event_management_system.dto.SubscriptionDetailsResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentHistoryResponse;
import com.fic.event_management_system.dto.UpdateSubscriptionPlanRequest;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionAuditLog;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.SubscriptionStatus;
import java.util.List;

public interface SuperAdminService {

    SuperAdminDashboardResponse getDashboardOverview();

    List<SuperAdminPortalResponse> getPortalOverview();

    List<SubscriptionPlan> getSubscriptionPlans();

    SubscriptionPlan updateSubscriptionPlan(
            SubscriptionPlanCode planCode,
            UpdateSubscriptionPlanRequest request
    );

    List<SubscriptionAuditLog> getSubscriptionPlanAuditHistory(
            SubscriptionPlanCode planCode
    );

    List<SubscriptionDetailsResponse> getSubscriptionOverview(
            SubscriptionStatus status,
            SubscriptionPlanCode plan,
            Long portalId
    );

    SubscriptionDetailsResponse getPortalSubscription(Long portalId);

    List<SubscriptionPaymentHistoryResponse> getSubscriptionPayments(
            Long portalId,
            SubscriptionPaymentStatus status
    );

    void deleteInactivePortal(Long portalId);

    PortalSubscription recoverPaidSubscription(
            ManualSubscriptionRecoveryRequest request
    );

    List<SubscriptionAuditLog> getSubscriptionAuditHistory(Long portalId);

    PortalSubscription cancelSubscriptionImmediately(Long portalId, String reason);

    PortalSubscription cancelScheduledPlanChange(Long portalId, String reason);

    PortalSubscription extendSubscription(Long portalId, int days, String reason);

    PortalSubscription reduceSubscriptionDays(Long portalId, int days, String reason);

    PortalSubscription changeCurrentPlan(
            Long portalId,
            SubscriptionPlanCode planCode,
            String reason
    );

    void deleteSubscriptionPaymentHistory(String paymentReference, String reason);

    PortalSubscription refundSubscriptionPayment(String paymentReference, String reason);
}
