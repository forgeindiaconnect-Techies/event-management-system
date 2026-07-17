package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.entity.User;

import java.util.Optional;

public interface SubscriptionService {

    PortalSubscription createStandardTrial(Portal portal);

    boolean isTrialAvailable(Long portalId);

    Optional<PortalSubscription> getCurrentSubscription(Long portalId);

    Optional<PortalSubscription> getLatestSubscription(Long portalId);

    Optional<PortalSubscription> reconcileSubscriptionAfterRefund(Long portalId);

    void expireEndedSubscriptions();

    void sendExpiryWarnings();

    PortalSubscription activatePaidSubscription(
            Portal portal,
            SubscriptionPlan plan,
            BillingCycle billingCycle
    );

    PortalSubscription cancelRenewal(Long portalId, User requestedBy);
}
