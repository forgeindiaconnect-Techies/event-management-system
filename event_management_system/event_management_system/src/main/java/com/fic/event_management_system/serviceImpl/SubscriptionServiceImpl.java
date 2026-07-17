package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.SubscriptionStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.repository.PortalSubscriptionRepository;
import com.fic.event_management_system.repository.SubscriptionPlanRepository;
import com.fic.event_management_system.repository.SubscriptionAuditLogRepository;
import com.fic.event_management_system.repository.SubscriptionPaymentRepository;
import com.fic.event_management_system.entity.SubscriptionAuditLog;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.service.SubscriptionService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Comparator;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    @Value("${subscription.trial-days:30}")
    private int trialDays = 30;

    private static final List<SubscriptionStatus> USABLE_STATUSES =
            List.of(
                    SubscriptionStatus.TRIAL,
                    SubscriptionStatus.ACTIVE
            );

    private final PortalRepository portalRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PortalSubscriptionRepository subscriptionRepository;
    private final SubscriptionAuditLogRepository auditLogRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public SubscriptionServiceImpl(
            PortalRepository portalRepository,
            SubscriptionPlanRepository planRepository,
            PortalSubscriptionRepository subscriptionRepository,
            SubscriptionAuditLogRepository auditLogRepository,
            SubscriptionPaymentRepository paymentRepository,
            NotificationService notificationService,
            EmailService emailService
    ) {
        this.portalRepository = portalRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.auditLogRepository = auditLogRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public PortalSubscription createStandardTrial(Portal portal) {
        if (portal == null || portal.getId() == null) {
            throw new RuntimeException(
                    "Portal must be saved before creating a trial"
            );
        }

        boolean trialAlreadyUsed =
                subscriptionRepository.existsByPortalIdAndTrialTrue(
                        portal.getId()
                );

        if (trialAlreadyUsed) {
            throw new RuntimeException(
                    "This portal has already used its free trial"
            );
        }

        boolean hasActiveAccess = subscriptionRepository
                .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portal.getId(), USABLE_STATUSES
                )
                .isPresent();
        if (hasActiveAccess) {
            throw new RuntimeException(
                    "This portal already has an active subscription"
            );
        }

        if (paymentRepository.existsByPortalIdAndStatus(
                portal.getId(), SubscriptionPaymentStatus.PENDING)) {
            throw new RuntimeException(
                    "Complete or cancel the pending payment before activating the trial"
            );
        }

        SubscriptionPlan standardPlan =
                planRepository.findByCode(
                        SubscriptionPlanCode.STANDARD
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Standard subscription plan not found"
                        )
                );

        LocalDateTime startDate = LocalDateTime.now();

        PortalSubscription subscription =
                new PortalSubscription();

        subscription.setPortal(portal);
        subscription.setPlan(standardPlan);
        subscription.setStatus(SubscriptionStatus.TRIAL);
        subscription.setBillingCycle(BillingCycle.MONTHLY);
        subscription.setTrial(true);
        subscription.setAutoRenew(false);
        subscription.setStartDate(startDate);
        subscription.setEndDate(startDate.plusDays(trialDays));

        subscription = subscriptionRepository.save(subscription);

        notifySubscriptionOwner(
                subscription,
                NotificationType.TRIAL_ACTIVATED,
                "Free trial activated",
                "Your Standard trial is active until " + subscription.getEndDate() + ".",
                "TRIAL_ACTIVATED_" + subscription.getId()
        );

        return subscription;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTrialAvailable(Long portalId) {
        if (portalId == null) {
            return false;
        }
        return !subscriptionRepository.existsByPortalIdAndTrialTrue(portalId)
                && subscriptionRepository
                        .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                                portalId, USABLE_STATUSES
                        ).isEmpty()
                && !paymentRepository.existsByPortalIdAndStatus(
                        portalId, SubscriptionPaymentStatus.PENDING
                );
    }

    @Override
    @Transactional
    public Optional<PortalSubscription> getCurrentSubscription(
            Long portalId
    ) {
        Portal portal = portalRepository.findById(portalId)
                .orElseThrow(() ->
                        new RuntimeException("Portal not found")
                );

        Optional<PortalSubscription> current =
                subscriptionRepository
                        .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                                portal.getId(),
                                USABLE_STATUSES
                        );

        if (current.isEmpty()) {
            PortalSubscription latest = subscriptionRepository
                    .findTopByPortalIdOrderByCreatedAtDesc(portalId)
                    .orElse(null);
            if (latest != null
                    && latest.getStatus() == SubscriptionStatus.CANCELLED
                    && latest.getCancellationReason() != null
                    && latest.getCancellationReason().startsWith("Payment refunded:")) {
                return reconcileSubscriptionAfterRefund(portalId);
            }
            return Optional.empty();
        }

        PortalSubscription subscription = current.get();

        if (subscription.getEndDate().isBefore(LocalDateTime.now())) {
            if (subscription.getNextPlan() != null) {
                activateScheduledPlan(subscription);
                return Optional.of(subscriptionRepository.save(subscription));
            }

            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            notifySubscriptionOwner(
                    subscription,
                    NotificationType.SUBSCRIPTION_EXPIRED,
                    "Subscription expired",
                    "Your " + subscription.getPlan().getDisplayName()
                            + " plan has expired.",
                    "SUBSCRIPTION_EXPIRED_" + subscription.getId()
            );
            return Optional.empty();
        }

        return Optional.of(subscription);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PortalSubscription> getLatestSubscription(Long portalId) {
        return subscriptionRepository.findTopByPortalIdOrderByCreatedAtDesc(portalId);
    }

    @Override
    @Transactional
    public Optional<PortalSubscription> reconcileSubscriptionAfterRefund(Long portalId) {
        List<SubscriptionPayment> successfulPayments = paymentRepository
                .findByPortalIdAndStatusOrderByCreatedAtDesc(
                        portalId,
                        SubscriptionPaymentStatus.SUCCESS
                );
        if (successfulPayments.isEmpty()) {
            return Optional.empty();
        }

        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdOrderByCreatedAtDesc(portalId)
                .orElseThrow(() -> new RuntimeException("No subscription found"));
        SubscriptionPayment supportingPayment = successfulPayments.get(0);
        List<SubscriptionPayment> planPayments = successfulPayments.stream()
                .filter(payment -> payment.getPlan().getCode()
                        == supportingPayment.getPlan().getCode())
                .sorted(Comparator.comparing(this::paymentEffectiveDate))
                .toList();

        LocalDateTime startDate = paymentEffectiveDate(planPayments.get(0));
        LocalDateTime endDate = startDate;
        for (SubscriptionPayment payment : planPayments) {
            LocalDateTime paidAt = paymentEffectiveDate(payment);
            LocalDateTime periodStart = endDate.isAfter(paidAt) ? endDate : paidAt;
            endDate = addBillingPeriod(periodStart, payment.getBillingCycle());
        }

        if (!endDate.isAfter(LocalDateTime.now())) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            return Optional.empty();
        }

        subscription.setPlan(supportingPayment.getPlan());
        subscription.setBillingCycle(supportingPayment.getBillingCycle());
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setTrial(false);
        subscription.setAutoRenew(false);
        subscription.setStartDate(startDate);
        subscription.setEndDate(endDate);
        subscription.setCancelledAt(null);
        subscription.setCancellationReason(null);
        clearScheduledPlan(subscription);
        return Optional.of(subscriptionRepository.save(subscription));
    }

    private LocalDateTime paymentEffectiveDate(SubscriptionPayment payment) {
        return payment.getPaidAt() != null ? payment.getPaidAt() : payment.getCreatedAt();
    }

    @Override
    @Transactional
    public void expireEndedSubscriptions() {
        List<PortalSubscription> expiredSubscriptions =
                subscriptionRepository.findByStatusInAndEndDateBefore(
                        USABLE_STATUSES,
                        LocalDateTime.now()
                );

        expiredSubscriptions.forEach(subscription -> {
            if (subscription.getNextPlan() != null) {
                activateScheduledPlan(subscription);
            } else {
                subscription.setStatus(SubscriptionStatus.EXPIRED);
                subscription.setAutoRenew(false);
                notifySubscriptionOwner(
                        subscription,
                        NotificationType.SUBSCRIPTION_EXPIRED,
                        "Subscription expired",
                        "Your " + subscription.getPlan().getDisplayName()
                                + " plan has expired.",
                        "SUBSCRIPTION_EXPIRED_" + subscription.getId()
                );
            }
        });

        subscriptionRepository.saveAll(expiredSubscriptions);
    }

    @Override
    @Transactional
    public void sendExpiryWarnings() {
        LocalDateTime now = LocalDateTime.now();

        List<PortalSubscription> endingSoon = subscriptionRepository
                .findByStatusInAndEndDateBetween(
                        USABLE_STATUSES,
                        now,
                        now.plusDays(5).plusHours(1)
                );

        for (PortalSubscription subscription : endingSoon) {
            long remainingHours = Math.max(
                    0,
                    ChronoUnit.HOURS.between(
                            now,
                            subscription.getEndDate()
                    )
            );

            int warningDays = remainingHours <= 24
                    ? 1
                    : remainingHours <= 72 ? 3 : 5;

            notifySubscriptionOwner(
                    subscription,
                    NotificationType.SUBSCRIPTION_EXPIRING,
                    "Subscription expires in " + warningDays
                            + (warningDays == 1 ? " day" : " days"),
                    "Your " + subscription.getPlan().getDisplayName()
                            + " plan expires on " + subscription.getEndDate() + ".",
                    "SUBSCRIPTION_EXPIRING_" + subscription.getId()
                            + "_" + warningDays + "D"
            );
        }
    }

    @Override
    @Transactional
    public PortalSubscription activatePaidSubscription(
            Portal portal,
            SubscriptionPlan plan,
            BillingCycle billingCycle
    ) {
        LocalDateTime now = LocalDateTime.now();
        Optional<PortalSubscription> current =
                subscriptionRepository.findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portal.getId(),
                        USABLE_STATUSES
                );

        if (current.isPresent()) {
            PortalSubscription subscription = current.get();
            SubscriptionPlan currentPlan = subscription.getPlan();
            int comparison = Integer.compare(
                    plan.getCode().ordinal(),
                    currentPlan.getCode().ordinal()
            );

            if (comparison < 0) {
                if (subscription.getStatus() == SubscriptionStatus.TRIAL) {
                    throw new RuntimeException(
                            "A trial plan cannot be downgraded. Cancel the trial first."
                    );
                }

                subscription.setNextPlan(plan);
                subscription.setNextBillingCycle(billingCycle);
                subscription.setNextPlanStartsAt(subscription.getEndDate());
                subscription.setAutoRenew(false);
                subscription = subscriptionRepository.save(subscription);

                saveAudit(
                        subscription,
                        "DOWNGRADE_SCHEDULED",
                        currentPlan.getDisplayName(),
                        plan.getDisplayName(),
                        "The paid downgrade will start after the current plan expires"
                );
                notifySubscriptionOwner(
                        subscription,
                        NotificationType.SUBSCRIPTION_ACTIVATED,
                        "Plan change scheduled",
                        plan.getDisplayName() + " will start on "
                                + subscription.getNextPlanStartsAt() + ".",
                        "SUBSCRIPTION_CHANGE_SCHEDULED_" + subscription.getId()
                                + "_" + plan.getCode()
                );
                return subscription;
            }

            if (comparison == 0) {
                LocalDateTime extensionBase = subscription.getEndDate() != null
                        && subscription.getEndDate().isAfter(now)
                        ? subscription.getEndDate()
                        : now;

                subscription.setStatus(SubscriptionStatus.ACTIVE);
                subscription.setBillingCycle(billingCycle);
                subscription.setTrial(false);
                subscription.setAutoRenew(false);
                subscription.setEndDate(addBillingPeriod(extensionBase, billingCycle));
                subscription.setCancelledAt(null);
                subscription.setCancellationReason(null);
                clearScheduledPlan(subscription);
                subscription = subscriptionRepository.save(subscription);

                saveAudit(
                        subscription,
                        "SUBSCRIPTION_EXTENDED",
                        currentPlan.getDisplayName(),
                        plan.getDisplayName(),
                        "A successful payment extended the current plan"
                );
                notifySubscriptionOwner(
                        subscription,
                        NotificationType.SUBSCRIPTION_ACTIVATED,
                        "Subscription extended",
                        "Your " + plan.getDisplayName() + " plan is active until "
                                + subscription.getEndDate() + ".",
                        "SUBSCRIPTION_EXTENDED_" + subscription.getId()
                                + "_" + subscription.getEndDate()
                );
                return subscription;
            }

            subscription.setPlan(plan);
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setBillingCycle(billingCycle);
            subscription.setTrial(false);
            subscription.setAutoRenew(false);
            subscription.setStartDate(now);
            subscription.setEndDate(addBillingPeriod(now, billingCycle));
            subscription.setCancelledAt(null);
            subscription.setCancellationReason(null);
            clearScheduledPlan(subscription);
            subscription = subscriptionRepository.save(subscription);

            saveAudit(
                    subscription,
                    "SUBSCRIPTION_UPGRADED",
                    currentPlan.getDisplayName(),
                    plan.getDisplayName(),
                    "The higher plan was activated immediately after payment"
            );
            notifySubscriptionOwner(
                    subscription,
                    NotificationType.SUBSCRIPTION_UPGRADED,
                    "Subscription upgraded",
                    "Your portal was upgraded to " + plan.getDisplayName() + ".",
                    "SUBSCRIPTION_UPGRADED_" + subscription.getId()
                            + "_" + plan.getCode()
            );
            return subscription;
        }

        PortalSubscription subscription = new PortalSubscription();

        subscription.setPortal(portal);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setBillingCycle(billingCycle);
        subscription.setTrial(false);
        subscription.setAutoRenew(false);
        subscription.setStartDate(now);
        subscription.setEndDate(addBillingPeriod(now, billingCycle));
        subscription.setCancelledAt(null);
        subscription.setCancellationReason(null);

        subscription = subscriptionRepository.save(subscription);
        saveAudit(
                subscription,
                "SUBSCRIPTION_ACTIVATED",
                "No active plan",
                plan.getDisplayName(),
                "The plan was activated after successful payment"
        );
        notifySubscriptionOwner(
                subscription,
                NotificationType.SUBSCRIPTION_ACTIVATED,
                "Subscription activated",
                "Your " + plan.getDisplayName() + " plan is now active.",
                "SUBSCRIPTION_ACTIVATED_" + subscription.getId()
        );
        return subscription;
    }

    @Override
    @Transactional
    public PortalSubscription cancelRenewal(Long portalId, User requestedBy) {
        PortalSubscription subscription = getCurrentSubscription(portalId)
                .orElseThrow(() -> new RuntimeException("No active subscription found"));

        subscription.setAutoRenew(false);
        subscription.setCancellationReason("Renewal cancelled by portal admin");
        subscription = subscriptionRepository.save(subscription);

        SubscriptionAuditLog auditLog = new SubscriptionAuditLog();
        auditLog.setPortal(subscription.getPortal());
        auditLog.setAdmin(requestedBy);
        auditLog.setAction("RENEWAL_CANCELLED");
        auditLog.setPreviousPlan(subscription.getPlan().getDisplayName());
        auditLog.setNewPlan(subscription.getPlan().getDisplayName());
        auditLog.setReason("Access remains active until the subscription expiry date");
        auditLogRepository.save(auditLog);

        notifySubscriptionOwner(
                subscription,
                NotificationType.SUBSCRIPTION_CANCELLED,
                "Subscription renewal cancelled",
                "Automatic renewal is off. Your current plan remains active until "
                        + subscription.getEndDate() + ".",
                "SUBSCRIPTION_RENEWAL_CANCELLED_" + subscription.getId()
                        + "_" + subscription.getEndDate()
        );

        return subscription;
    }

    private void activateScheduledPlan(PortalSubscription subscription) {
        SubscriptionPlan previousPlan = subscription.getPlan();
        SubscriptionPlan scheduledPlan = subscription.getNextPlan();
        BillingCycle scheduledCycle = subscription.getNextBillingCycle();
        LocalDateTime scheduledStart = subscription.getEndDate();

        subscription.setPlan(scheduledPlan);
        subscription.setBillingCycle(scheduledCycle);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setTrial(false);
        subscription.setAutoRenew(false);
        subscription.setStartDate(scheduledStart);
        subscription.setEndDate(addBillingPeriod(scheduledStart, scheduledCycle));
        subscription.setCancelledAt(null);
        subscription.setCancellationReason(null);
        clearScheduledPlan(subscription);

        saveAudit(
                subscription,
                "SCHEDULED_DOWNGRADE_ACTIVATED",
                previousPlan.getDisplayName(),
                scheduledPlan.getDisplayName(),
                "The previous plan expired and the paid downgrade became active"
        );

        notifySubscriptionOwner(
                subscription,
                NotificationType.SUBSCRIPTION_ACTIVATED,
                "Scheduled plan activated",
                scheduledPlan.getDisplayName() + " is now active.",
                "SCHEDULED_PLAN_ACTIVATED_" + subscription.getId()
                        + "_" + scheduledPlan.getCode()
        );
    }

    private LocalDateTime addBillingPeriod(
            LocalDateTime start,
            BillingCycle billingCycle
    ) {
        return billingCycle == BillingCycle.YEARLY
                ? start.plusYears(1)
                : start.plusMonths(1);
    }

    private void clearScheduledPlan(PortalSubscription subscription) {
        subscription.setNextPlan(null);
        subscription.setNextBillingCycle(null);
        subscription.setNextPlanStartsAt(null);
    }

    private void saveAudit(
            PortalSubscription subscription,
            String action,
            String previousPlan,
            String newPlan,
            String reason
    ) {
        if (subscription.getPortal().getAdmin() == null) {
            return;
        }

        SubscriptionAuditLog auditLog = new SubscriptionAuditLog();
        auditLog.setPortal(subscription.getPortal());
        auditLog.setAdmin(subscription.getPortal().getAdmin());
        auditLog.setAction(action);
        auditLog.setPreviousPlan(previousPlan);
        auditLog.setNewPlan(newPlan);
        auditLog.setReason(reason);
        auditLogRepository.save(auditLog);
    }

    private void notifySubscriptionOwner(
            PortalSubscription subscription,
            NotificationType type,
            String title,
            String message,
            String deduplicationKey) {

        Portal portal = subscription.getPortal();
        User owner = portal.getAdmin();

        if (owner == null) {
            return;
        }

        notificationService.createNotification(
                owner,
                portal,
                null,
                type,
                title,
                message,
                "/subscription",
                deduplicationKey
        );

        emailService.queueEmail(
                owner.getEmail(),
                title,
                "Hello " + owner.getFirstName() + ",\n\n"
                        + message + "\n\n"
                        + "Portal: " + portal.getPortalName() + "\n\n"
                        + "Regards,\nFIC BackRooms",
                type,
                owner,
                portal,
                null,
                deduplicationKey,
                LocalDateTime.now()
        );
    }
}
