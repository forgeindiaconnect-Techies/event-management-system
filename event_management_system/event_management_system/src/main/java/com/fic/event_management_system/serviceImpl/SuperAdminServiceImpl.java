package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.SuperAdminDashboardResponse;
import com.fic.event_management_system.dto.SuperAdminPortalResponse;
import com.fic.event_management_system.dto.ManualSubscriptionRecoveryRequest;
import com.fic.event_management_system.dto.SubscriptionDetailsResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentHistoryResponse;
import com.fic.event_management_system.dto.UpdateSubscriptionPlanRequest;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.entity.SubscriptionAuditLog;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.PaymentStatus;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.enums.SubscriptionStatus;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.repository.PortalSubscriptionRepository;
import com.fic.event_management_system.repository.SubscriptionPaymentRepository;
import com.fic.event_management_system.repository.SubscriptionAuditLogRepository;
import com.fic.event_management_system.repository.SubscriptionPlanRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.SuperAdminService;
import com.fic.event_management_system.service.SubscriptionService;
import com.fic.event_management_system.service.NotificationService;
import com.fic.event_management_system.service.EmailService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SuperAdminServiceImpl implements SuperAdminService {

    private final PortalRepository portalRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final TenantSecurityService tenantSecurityService;
    private final PortalSubscriptionRepository subscriptionRepository;
    private final SubscriptionPaymentRepository subscriptionPaymentRepository;
    private final SubscriptionAuditLogRepository subscriptionAuditLogRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public SuperAdminServiceImpl(
            PortalRepository portalRepository,
            UserRepository userRepository,
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            TenantSecurityService tenantSecurityService,
            PortalSubscriptionRepository subscriptionRepository,
            SubscriptionPaymentRepository subscriptionPaymentRepository,
            SubscriptionAuditLogRepository subscriptionAuditLogRepository,
            SubscriptionPlanRepository subscriptionPlanRepository,
            SubscriptionService subscriptionService,
            NotificationService notificationService,
            EmailService emailService) {
        this.portalRepository = portalRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionPaymentRepository = subscriptionPaymentRepository;
        this.subscriptionAuditLogRepository = subscriptionAuditLogRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Override
    public SuperAdminDashboardResponse getDashboardOverview() {
        tenantSecurityService.requireSuperAdmin();

        List<Portal> portals = portalRepository.findAll();
        List<Registration> registrations = registrationRepository.findAll().stream()
                .filter(registration -> registration.getEvent() != null)
                .filter(registration -> registration.getEvent().getPortal() != null)
                .filter(registration -> !Boolean.TRUE.equals(registration.getEvent().getPortal().getDeleted()))
                .toList();

        List<SubscriptionPayment> subscriptionPayments =
                subscriptionPaymentRepository.findAllByOrderByCreatedAtDesc();
        BigDecimal totalRevenue = calculateSubscriptionRevenue(subscriptionPayments);
        BigDecimal monthlyRevenue = calculateMonthlySubscriptionRevenue(subscriptionPayments);

        long activePortals = portals.stream()
                .filter(portal -> !Boolean.TRUE.equals(portal.getDeleted()))
                .filter(portal -> isSubscriptionCurrentlyActive(
                        subscriptionRepository
                                .findTopByPortalIdOrderByCreatedAtDesc(portal.getId())
                                .orElse(null)
                ))
                .count();

        long trialPortals = portals.stream()
                .filter(portal -> !Boolean.TRUE.equals(portal.getDeleted()))
                .map(portal -> subscriptionRepository
                        .findTopByPortalIdOrderByCreatedAtDesc(portal.getId())
                        .orElse(null))
                .filter(subscription -> subscription != null)
                .filter(subscription -> subscription.getStatus() == SubscriptionStatus.TRIAL)
                .filter(subscription -> subscription.getEndDate() != null)
                .filter(subscription -> subscription.getEndDate().isAfter(LocalDateTime.now()))
                .count();

        return new SuperAdminDashboardResponse(
                portals.size(),
                userRepository.countByActiveTrue(),
                eventRepository.count(),
                registrations.size(),
                totalRevenue,
                monthlyRevenue,
                activePortals,
                trialPortals
        );
    }

    @Override
    public List<SuperAdminPortalResponse> getPortalOverview() {
        tenantSecurityService.requireSuperAdmin();

        return portalRepository.findAll()
                .stream()
                .map(this::mapPortal)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getSubscriptionPlans() {
        tenantSecurityService.requireSuperAdmin();
        return subscriptionPlanRepository.findAllByOrderByMonthlyPriceAsc();
    }

    @Override
    @Transactional
    public SubscriptionPlan createCustomSubscriptionPlan(
            UpdateSubscriptionPlanRequest request
    ) {
        tenantSecurityService.requireSuperAdmin();
        if (request == null) {
            throw new RuntimeException("Plan configuration is required");
        }
        if (subscriptionPlanRepository.findByCode(SubscriptionPlanCode.CUSTOM).isPresent()) {
            throw new RuntimeException(
                    "An extra plan already exists. Edit or enable the existing extra plan."
            );
        }

        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setCode(SubscriptionPlanCode.CUSTOM);
        plan.setDisplayName("Extra Plan");
        plan.setDescription("");
        plan.setMonthlyPrice(BigDecimal.ZERO);
        plan.setYearlyPrice(BigDecimal.ZERO);
        plan.setMaxActiveEvents(0);
        plan.setMaxPortalUsers(0);
        plan.setMaxRegistrationsPerEvent(0);
        plan.setMaxTicketClassesPerEvent(0);
        plan.setMaxStaffInvitations(0);
        plan.setMaxSpeakersPerEvent(0);
        plan.setMaxExhibitorsPerEvent(0);
        plan.setMaxCustomRegistrationFields(0);
        plan.setMaxOrganizers(0);
        plan.setCustomBranding(false);
        plan.setAdvancedReports(false);
        plan.setWhiteLabel(false);
        plan.setPrioritySupport(false);
        plan.setActive(true);
        subscriptionPlanRepository.save(plan);

        return updateSubscriptionPlan(SubscriptionPlanCode.CUSTOM, request);
    }

    @Override
    @Transactional
    public SubscriptionPlan updateSubscriptionPlan(
            SubscriptionPlanCode planCode,
            UpdateSubscriptionPlanRequest request
    ) {
        tenantSecurityService.requireSuperAdmin();

        if (planCode == null) {
            throw new RuntimeException("Plan code is required");
        }
        if (request == null) {
            throw new RuntimeException("Plan update request is required");
        }

        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(planCode)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));
        String previousSummary = planSummary(plan);
        List<String> changedFields = new ArrayList<>();

        if (request.getDisplayName() != null) {
            if (request.getDisplayName().isBlank()) {
                throw new RuntimeException("Plan display name cannot be blank");
            }
            plan.setDisplayName(request.getDisplayName().trim());
            changedFields.add("displayName");
        }
        if (request.getDescription() != null) {
            plan.setDescription(request.getDescription().trim());
            changedFields.add("description");
        }
        if (request.getMonthlyPrice() != null) {
            validatePrice(request.getMonthlyPrice(), "Monthly price");
            plan.setMonthlyPrice(request.getMonthlyPrice());
            changedFields.add("monthlyPrice");
        }
        if (request.getYearlyPrice() != null) {
            validatePrice(request.getYearlyPrice(), "Yearly price");
            plan.setYearlyPrice(request.getYearlyPrice());
            changedFields.add("yearlyPrice");
        }

        if (request.getMaxActiveEvents() != null) {
            validateLimit(request.getMaxActiveEvents(), "Active event limit");
            plan.setMaxActiveEvents(request.getMaxActiveEvents());
            changedFields.add("maxActiveEvents");
        }
        if (request.getMaxPortalUsers() != null) {
            validateLimit(request.getMaxPortalUsers(), "Portal user limit");
            plan.setMaxPortalUsers(request.getMaxPortalUsers());
            changedFields.add("maxPortalUsers");
        }
        if (request.getMaxRegistrationsPerEvent() != null) {
            validateLimit(
                    request.getMaxRegistrationsPerEvent(),
                    "Registration limit"
            );
            plan.setMaxRegistrationsPerEvent(
                    request.getMaxRegistrationsPerEvent()
            );
            changedFields.add("maxRegistrationsPerEvent");
        }
        if (request.getMaxTicketClassesPerEvent() != null) {
            validateLimit(
                    request.getMaxTicketClassesPerEvent(),
                    "Ticket class limit"
            );
            plan.setMaxTicketClassesPerEvent(
                    request.getMaxTicketClassesPerEvent()
            );
            changedFields.add("maxTicketClassesPerEvent");
        }
        if (request.getMaxStaffInvitations() != null) {
            validateLimit(
                    request.getMaxStaffInvitations(),
                    "Staff invitation limit"
            );
            plan.setMaxStaffInvitations(request.getMaxStaffInvitations());
            changedFields.add("maxStaffInvitations");
        }
        if (request.getMaxSpeakersPerEvent() != null) {
            validateLimit(
                    request.getMaxSpeakersPerEvent(),
                    "Speaker limit"
            );
            plan.setMaxSpeakersPerEvent(request.getMaxSpeakersPerEvent());
            changedFields.add("maxSpeakersPerEvent");
        }
        if (request.getMaxExhibitorsPerEvent() != null) {
            validateLimit(
                    request.getMaxExhibitorsPerEvent(),
                    "Exhibitor limit"
            );
            plan.setMaxExhibitorsPerEvent(request.getMaxExhibitorsPerEvent());
            changedFields.add("maxExhibitorsPerEvent");
        }
        if (request.getMaxCustomRegistrationFields() != null) {
            validateLimit(
                    request.getMaxCustomRegistrationFields(),
                    "Custom registration field limit"
            );
            plan.setMaxCustomRegistrationFields(
                    request.getMaxCustomRegistrationFields()
            );
            changedFields.add("maxCustomRegistrationFields");
        }
        if (request.getMaxOrganizers() != null) {
            validateLimit(request.getMaxOrganizers(), "Organizer limit");
            plan.setMaxOrganizers(request.getMaxOrganizers());
            changedFields.add("maxOrganizers");
        }

        if (request.getCustomBranding() != null) {
            plan.setCustomBranding(request.getCustomBranding());
            changedFields.add("customBranding");
        }
        if (request.getAdvancedReports() != null) {
            plan.setAdvancedReports(request.getAdvancedReports());
            changedFields.add("advancedReports");
        }
        if (request.getWhiteLabel() != null) {
            plan.setWhiteLabel(request.getWhiteLabel());
            changedFields.add("whiteLabel");
        }
        if (request.getPrioritySupport() != null) {
            plan.setPrioritySupport(request.getPrioritySupport());
            changedFields.add("prioritySupport");
        }
        if (request.getActive() != null) {
            if (planCode == SubscriptionPlanCode.STANDARD
                    && !request.getActive()) {
                throw new RuntimeException(
                        "Standard cannot be disabled because it provides the free trial"
                );
            }
            plan.setActive(request.getActive());
            changedFields.add("active");
        }

        if (changedFields.isEmpty()) {
            throw new RuntimeException("At least one plan field must be provided");
        }

        plan = subscriptionPlanRepository.save(plan);

        SubscriptionAuditLog auditLog = new SubscriptionAuditLog();
        auditLog.setSubscriptionPlan(plan);
        auditLog.setAdmin(tenantSecurityService.getLoggedInUser());
        auditLog.setAction("PLAN_CONFIGURATION_UPDATED");
        auditLog.setPreviousPlan(previousSummary);
        auditLog.setNewPlan(planSummary(plan));
        auditLog.setReason("Changed fields: " + String.join(", ", changedFields));
        subscriptionAuditLogRepository.save(auditLog);

        return plan;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionAuditLog> getSubscriptionPlanAuditHistory(
            SubscriptionPlanCode planCode
    ) {
        tenantSecurityService.requireSuperAdmin();

        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(planCode)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));

        return subscriptionAuditLogRepository
                .findBySubscriptionPlanIdOrderByCreatedAtDesc(plan.getId());
    }

    @Override
    @Transactional
    public List<SubscriptionDetailsResponse> getSubscriptionOverview(
            SubscriptionStatus status,
            SubscriptionPlanCode plan,
            Long portalId
    ) {
        tenantSecurityService.requireSuperAdmin();

        if (portalId != null) {
            requirePortal(portalId);
        }

        List<PortalSubscription> allSubscriptions =
                subscriptionRepository.findAllByOrderByCreatedAtDesc();
        allSubscriptions.forEach(this::restoreAfterPartialRefundIfRequired);

        Set<Long> includedPortals = new HashSet<>();

        return allSubscriptions
                .stream()
                .filter(subscription -> subscription.getPortal() != null)
                .filter(subscription -> !Boolean.TRUE.equals(
                        subscription.getPortal().getDeleted()
                ))
                .filter(subscription -> includedPortals.add(
                        subscription.getPortal().getId()
                ))
                .filter(subscription -> portalId == null
                        || portalId.equals(subscription.getPortal().getId()))
                .filter(subscription -> status == null
                        || subscription.getStatus() == status)
                .filter(subscription -> plan == null
                        || subscription.getPlan().getCode() == plan)
                .map(SubscriptionDetailsResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public SubscriptionDetailsResponse getPortalSubscription(Long portalId) {
        tenantSecurityService.requireSuperAdmin();
        requirePortal(portalId);

        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdOrderByCreatedAtDesc(portalId)
                .orElseThrow(() -> new RuntimeException(
                        "No subscription found for this portal"
                ));

        restoreAfterPartialRefundIfRequired(subscription);

        return SubscriptionDetailsResponse.from(subscription);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPaymentHistoryResponse> getSubscriptionPayments(
            Long portalId,
            SubscriptionPaymentStatus status
    ) {
        tenantSecurityService.requireSuperAdmin();

        if (portalId != null) {
            portalRepository.findById(portalId)
                    .orElseThrow(() -> new RuntimeException("Portal not found"));
        }

        List<SubscriptionPayment> payments;
        if (portalId != null && status != null) {
            payments = subscriptionPaymentRepository
                    .findByPortalIdAndStatusOrderByCreatedAtDesc(portalId, status);
        } else if (portalId != null) {
            payments = subscriptionPaymentRepository
                    .findByPortalIdOrderByCreatedAtDesc(portalId);
        } else if (status != null) {
            payments = subscriptionPaymentRepository
                    .findByStatusOrderByCreatedAtDesc(status);
        } else {
            payments = subscriptionPaymentRepository
                    .findAllByOrderByCreatedAtDesc();
        }

        return payments.stream()
                .filter(payment -> payment.getPortal() != null)
                .map(SubscriptionPaymentHistoryResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void deleteInactivePortal(Long portalId, String reason) {
        tenantSecurityService.requireSuperAdmin();

        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.length() < 10) {
            throw new RuntimeException("Deletion reason must contain at least 10 characters");
        }

        Portal portal = portalRepository.findById(portalId)
                .orElseThrow(() -> new RuntimeException("Portal not found"));

        if (Boolean.TRUE.equals(portal.getDeleted())) {
            throw new RuntimeException("Portal has already been deleted");
        }

        List<User> portalUsers = userRepository.findByPortalId(portalId);
        long purgeTime = System.currentTimeMillis();
        portalUsers.forEach(user -> {
            user.setActive(false);
            user.setEmail("deleted-" + user.getId() + "-" + purgeTime + "@backrooms.invalid");
            user.setPassword(java.util.UUID.randomUUID().toString());
            user.setFirstName("Deleted");
            user.setLastName("Account");
            user.setPhoneNumber(null);
        });
        userRepository.saveAll(portalUsers);

        List<Event> portalEvents = eventRepository.findByPortalId(portalId);
        portalEvents.forEach(event -> event.setStatus(EventStatus.TRASHED));
        eventRepository.saveAll(portalEvents);

        portal.setActive(false);
        portal.setDeleted(true);
        portal.setDeletionReason(normalizedReason);
        portal.setDeletedAt(java.time.LocalDateTime.now());
        portal.setPortalCode("DELETED-" + portal.getId() + "-" + purgeTime);
        portal.setDescription(null);
        portal.setLogoUrl(null);
        portalRepository.save(portal);
    }

    @Override
    @Transactional
    public PortalSubscription recoverPaidSubscription(
            ManualSubscriptionRecoveryRequest request
    ) {
        tenantSecurityService.requireSuperAdmin();

        if (request == null || request.getPaymentReference() == null
                || request.getPaymentReference().isBlank()) {
            throw new RuntimeException("Payment reference is required");
        }

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new RuntimeException("A recovery reason is required");
        }

        SubscriptionPayment payment = subscriptionPaymentRepository
                .findByPaymentReference(request.getPaymentReference())
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        if (payment.getStatus() != SubscriptionPaymentStatus.SUCCESS) {
            throw new RuntimeException("Only confirmed successful payments can be recovered");
        }

        if (payment.getGatewayPaymentId() == null
                || !payment.getGatewayPaymentId().equals(request.getGatewayPaymentId())) {
            throw new RuntimeException("Payment ID does not match the confirmed payment");
        }

        if (payment.getSubscription() != null) {
            throw new RuntimeException("This payment has already activated a subscription");
        }

        String previousPlan = subscriptionRepository
                .findTopByPortalIdOrderByCreatedAtDesc(payment.getPortal().getId())
                .map(PortalSubscription::getPlan)
                .map(plan -> plan.getDisplayName())
                .orElse("No plan");

        PortalSubscription subscription = subscriptionService.activatePaidSubscription(
                payment.getPortal(),
                payment.getPlan(),
                payment.getBillingCycle()
        );

        payment.setSubscription(subscription);
        subscriptionPaymentRepository.save(payment);

        SubscriptionAuditLog auditLog = new SubscriptionAuditLog();
        auditLog.setPortal(payment.getPortal());
        auditLog.setAdmin(tenantSecurityService.getLoggedInUser());
        auditLog.setPayment(payment);
        auditLog.setAction("MANUAL_PAYMENT_RECOVERY");
        auditLog.setPreviousPlan(previousPlan);
        auditLog.setNewPlan(payment.getPlan().getDisplayName());
        auditLog.setReason(request.getReason());
        subscriptionAuditLogRepository.save(auditLog);

        return subscription;
    }

    @Override
    public List<SubscriptionAuditLog> getSubscriptionAuditHistory(Long portalId) {
        tenantSecurityService.requireSuperAdmin();
        portalRepository.findById(portalId)
                .orElseThrow(() -> new RuntimeException("Portal not found"));
        return subscriptionAuditLogRepository.findByPortalIdOrderByCreatedAtDesc(portalId);
    }

    @Override
    @Transactional
    public PortalSubscription cancelSubscriptionImmediately(
            Long portalId,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);

        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portalId,
                        List.of(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)
                )
                .orElseThrow(() -> new RuntimeException("No active subscription found"));

        String planName = subscription.getPlan().getDisplayName();
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setAutoRenew(false);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason);
        subscription.setNextPlan(null);
        subscription.setNextBillingCycle(null);
        subscription.setNextPlanStartsAt(null);
        subscription = subscriptionRepository.save(subscription);

        saveSubscriptionAudit(
                subscription,
                null,
                "SUBSCRIPTION_CANCELLED",
                planName,
                "Cancelled",
                reason
        );

        notifyPortalAdmin(
                subscription.getPortal(),
                NotificationType.SUBSCRIPTION_CANCELLED,
                "Subscription cancelled",
                "Your " + planName + " subscription was cancelled by the platform administrator. Reason: " + reason,
                "SUBSCRIPTION_CANCELLED_" + subscription.getId() + "_" + subscription.getCancelledAt()
        );

        return subscription;
    }

    @Override
    @Transactional
    public PortalSubscription cancelScheduledPlanChange(
            Long portalId,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);

        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portalId,
                        List.of(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)
                )
                .orElseThrow(() -> new RuntimeException("No active subscription found"));

        if (subscription.getNextPlan() == null) {
            throw new RuntimeException("No scheduled plan change found");
        }

        String currentPlanName = subscription.getPlan().getDisplayName();
        String scheduledPlanName = subscription.getNextPlan().getDisplayName();
        subscription.setNextPlan(null);
        subscription.setNextBillingCycle(null);
        subscription.setNextPlanStartsAt(null);
        subscription = subscriptionRepository.save(subscription);

        saveSubscriptionAudit(
                subscription,
                null,
                "SCHEDULED_PLAN_CANCELLED",
                scheduledPlanName,
                currentPlanName,
                reason
        );

        return subscription;
    }

    @Override
    @Transactional
    public PortalSubscription extendSubscription(
            Long portalId,
            int days,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);

        if (days < 1 || days > 3650) {
            throw new RuntimeException("Extension days must be between 1 and 3650");
        }

        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portalId,
                        List.of(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)
                )
                .orElseThrow(() -> new RuntimeException("No active subscription found"));

        LocalDateTime previousEndDate = subscription.getEndDate();
        LocalDateTime extensionBase = previousEndDate != null
                && previousEndDate.isAfter(LocalDateTime.now())
                ? previousEndDate
                : LocalDateTime.now();
        subscription.setEndDate(extensionBase.plusDays(days));
        subscription = subscriptionRepository.save(subscription);

        saveSubscriptionAudit(
                subscription,
                null,
                "SUBSCRIPTION_EXTENDED_BY_SUPER_ADMIN",
                subscription.getPlan().getDisplayName(),
                subscription.getPlan().getDisplayName(),
                "Extended by " + days + " days. " + reason
        );

        return subscription;
    }

    @Override
    @Transactional
    public PortalSubscription reduceSubscriptionDays(
            Long portalId,
            int days,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);
        if (days < 1 || days > 3650) {
            throw new RuntimeException("Reduction days must be between 1 and 3650");
        }

        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portalId,
                        List.of(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)
                )
                .orElseThrow(() -> new RuntimeException("No active subscription found"));
        LocalDateTime reducedEndDate = subscription.getEndDate().minusDays(days);
        if (!reducedEndDate.isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "The reduction would expire the plan. Use Cancel immediately instead."
            );
        }
        subscription.setEndDate(reducedEndDate);
        subscription = subscriptionRepository.save(subscription);
        saveSubscriptionAudit(
                subscription,
                null,
                "SUBSCRIPTION_DAYS_REDUCED_BY_SUPER_ADMIN",
                subscription.getPlan().getDisplayName(),
                subscription.getPlan().getDisplayName(),
                "Reduced by " + days + " days. " + reason
        );
        return subscription;
    }

    @Override
    @Transactional
    public PortalSubscription changeCurrentPlan(
            Long portalId,
            SubscriptionPlanCode planCode,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);
        SubscriptionPlan targetPlan = subscriptionPlanRepository.findByCode(planCode)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));
        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdAndStatusInOrderByEndDateDesc(
                        portalId,
                        List.of(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)
                )
                .orElseThrow(() -> new RuntimeException("No active subscription found"));
        String previousPlan = subscription.getPlan().getDisplayName();
        if (subscription.getPlan().getCode() == targetPlan.getCode()) {
            throw new RuntimeException("The portal is already on this plan");
        }
        subscription.setPlan(targetPlan);
        subscription.setTrial(false);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setNextPlan(null);
        subscription.setNextBillingCycle(null);
        subscription.setNextPlanStartsAt(null);
        subscription = subscriptionRepository.save(subscription);
        saveSubscriptionAudit(
                subscription,
                null,
                "PLAN_CHANGED_BY_SUPER_ADMIN",
                previousPlan,
                targetPlan.getDisplayName(),
                reason
        );
        return subscription;
    }

    @Override
    @Transactional
    public void deleteSubscriptionPaymentHistory(
            String paymentReference,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);

        SubscriptionPayment payment = subscriptionPaymentRepository
                .findByPaymentReference(paymentReference)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        List<SubscriptionAuditLog> linkedAuditLogs =
                subscriptionAuditLogRepository.findByPaymentId(payment.getId());
        linkedAuditLogs.forEach(log -> log.setPayment(null));
        subscriptionAuditLogRepository.saveAll(linkedAuditLogs);

        SubscriptionAuditLog deletionAudit = new SubscriptionAuditLog();
        deletionAudit.setPortal(payment.getPortal());
        deletionAudit.setSubscriptionPlan(payment.getPlan());
        deletionAudit.setAdmin(tenantSecurityService.getLoggedInUser());
        deletionAudit.setAction("PAYMENT_HISTORY_DELETED");
        deletionAudit.setPreviousPlan(
                payment.getPlan() == null ? null : payment.getPlan().getDisplayName()
        );
        deletionAudit.setNewPlan("Payment record removed");
        deletionAudit.setReason(
                "Deleted " + payment.getStatus() + " payment "
                        + payment.getPaymentReference() + ". " + reason
        );

        subscriptionPaymentRepository.delete(payment);
        subscriptionPaymentRepository.flush();
        subscriptionAuditLogRepository.save(deletionAudit);
    }

    @Override
    @Transactional
    public PortalSubscription refundSubscriptionPayment(
            String paymentReference,
            String reason
    ) {
        tenantSecurityService.requireSuperAdmin();
        requireReason(reason);

        SubscriptionPayment payment = subscriptionPaymentRepository
                .findByPaymentReference(paymentReference)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        if (payment.getStatus() != SubscriptionPaymentStatus.SUCCESS) {
            throw new RuntimeException("Only a successful payment can be refunded");
        }

        if (payment.getSubscription() == null) {
            throw new RuntimeException("Payment is not linked to a subscription");
        }

        PortalSubscription subscription = payment.getSubscription();
        String planName = subscription.getPlan().getDisplayName();

        payment.setStatus(SubscriptionPaymentStatus.REFUNDED);
        payment.setFailureReason("Refunded: " + reason);
        subscriptionPaymentRepository.save(payment);
        subscriptionPaymentRepository.flush();

        boolean scheduledPlanPayment = subscription.getNextPlan() != null
                && payment.getPlan() != null
                && subscription.getNextPlan().getCode() == payment.getPlan().getCode();

        if (scheduledPlanPayment) {
            String scheduledPlanName = subscription.getNextPlan().getDisplayName();
            subscription.setNextPlan(null);
            subscription.setNextBillingCycle(null);
            subscription.setNextPlanStartsAt(null);
            subscription = subscriptionRepository.save(subscription);

            saveSubscriptionAudit(
                    subscription,
                    payment,
                    "SCHEDULED_DOWNGRADE_REFUNDED",
                    scheduledPlanName,
                    planName,
                    reason
            );
            notifyRefund(payment, "The scheduled " + scheduledPlanName
                    + " plan payment was refunded. " + reason);
            return subscription;
        }

        Optional<PortalSubscription> reconciledSubscription =
                subscriptionService.reconcileSubscriptionAfterRefund(
                        payment.getPortal().getId()
                );

        if (reconciledSubscription.isPresent()) {
            subscription = reconciledSubscription.get();

            saveSubscriptionAudit(
                    subscription,
                    payment,
                    "PAYMENT_PARTIALLY_REFUNDED",
                    planName,
                    subscription.getPlan().getDisplayName(),
                    "Another successful payment remains active. " + reason
            );
            notifyRefund(payment, "Your payment was refunded. Your earlier successful subscription remains active. " + reason);
            return subscription;
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setAutoRenew(false);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason("Payment refunded: " + reason);
        subscription.setNextPlan(null);
        subscription.setNextBillingCycle(null);
        subscription.setNextPlanStartsAt(null);
        subscription = subscriptionRepository.save(subscription);

        saveSubscriptionAudit(
                subscription,
                payment,
                "PAYMENT_REFUNDED",
                planName,
                "Cancelled",
                reason
        );

        notifyRefund(payment, "Your payment was refunded and the related subscription was cancelled. " + reason);

        return subscription;
    }

    private void restoreAfterPartialRefundIfRequired(
            PortalSubscription subscription
    ) {
        if (subscription.getStatus() != SubscriptionStatus.CANCELLED
                || subscription.getCancellationReason() == null
                || !subscription.getCancellationReason().startsWith("Payment refunded:")) {
            return;
        }

        Optional<PortalSubscription> reconciled =
                subscriptionService.reconcileSubscriptionAfterRefund(
                        subscription.getPortal().getId()
                );
        if (reconciled.isEmpty()) return;
        PortalSubscription restored = reconciled.get();
        String cancelledPlan = subscription.getPlan().getDisplayName();
        saveSubscriptionAudit(
                restored,
                null,
                "SUBSCRIPTION_RESTORED_AFTER_PARTIAL_REFUND",
                cancelledPlan,
                restored.getPlan().getDisplayName(),
                "A successful payment still supports this subscription"
        );
    }

    private void requireReason(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("A reason is required");
        }
    }

    private Portal requirePortal(Long portalId) {
        Portal portal = portalRepository.findById(portalId)
                .orElseThrow(() -> new RuntimeException("Portal not found"));

        if (Boolean.TRUE.equals(portal.getDeleted())) {
            throw new RuntimeException("Portal has been deleted");
        }

        return portal;
    }

    private void validatePrice(BigDecimal price, String label) {
        if (price.signum() <= 0) {
            throw new RuntimeException(label + " must be greater than zero");
        }
    }

    private void validateLimit(Integer limit, String label) {
        if (limit < -1) {
            throw new RuntimeException(
                    label + " must be zero, a positive number, or -1 for unlimited"
            );
        }
    }

    private String planSummary(SubscriptionPlan plan) {
        return plan.getCode()
                + " [name=" + plan.getDisplayName()
                + ", monthly=" + plan.getMonthlyPrice()
                + ", yearly=" + plan.getYearlyPrice()
                + ", active=" + plan.getActive()
                + "]";
    }

    private void saveSubscriptionAudit(
            PortalSubscription subscription,
            SubscriptionPayment payment,
            String action,
            String previousPlan,
            String newPlan,
            String reason
    ) {
        SubscriptionAuditLog auditLog = new SubscriptionAuditLog();
        auditLog.setPortal(subscription.getPortal());
        auditLog.setAdmin(tenantSecurityService.getLoggedInUser());
        auditLog.setPayment(payment);
        auditLog.setAction(action);
        auditLog.setPreviousPlan(previousPlan);
        auditLog.setNewPlan(newPlan);
        auditLog.setReason(reason);
        subscriptionAuditLogRepository.save(auditLog);
    }

    private void notifyRefund(SubscriptionPayment payment, String message) {
        notifyPortalAdmin(
                payment.getPortal(),
                NotificationType.PAYMENT_REFUNDED,
                "Subscription payment refunded",
                message + " Payment reference: " + payment.getPaymentReference(),
                "SUBSCRIPTION_PAYMENT_REFUNDED_" + payment.getId()
        );
    }

    private void notifyPortalAdmin(
            Portal portal,
            NotificationType type,
            String title,
            String message,
            String deduplicationKey) {
        User admin = portal == null ? null : portal.getAdmin();
        if (admin == null) {
            return;
        }
        notificationService.createNotification(
                admin, portal, null, type, title, message,
                "/subscription", deduplicationKey
        );
        emailService.queueEmail(
                admin.getEmail(), title,
                "Hello " + admin.getFirstName() + ",\n\n" + message
                        + "\n\nPortal: " + portal.getPortalName()
                        + "\n\nRegards,\nFIC BackRooms",
                type, admin, portal, null, deduplicationKey,
                LocalDateTime.now()
        );
    }

    private SuperAdminPortalResponse mapPortal(Portal portal) {
        List<Registration> registrations =
                registrationRepository.findByEvent_Portal_Id(portal.getId());

        User admin = portal.getAdmin();
        PortalSubscription subscription = subscriptionRepository
                .findTopByPortalIdOrderByCreatedAtDesc(portal.getId())
                .orElse(null);

        String planName = subscription != null && subscription.getPlan() != null
                ? subscription.getPlan().getDisplayName()
                : "No plan";
        String portalStatus = resolvePortalStatus(portal, subscription);

        return new SuperAdminPortalResponse(
                portal.getId(),
                portal.getPortalName(),
                portal.getPortalCode(),
                getOwnerName(admin),
                admin == null ? null : admin.getEmail(),
                admin == null ? null : admin.getPhoneNumber(),
                planName,
                portalStatus,
                portal.getCreatedAt(),
                eventRepository.findByPortalId(portal.getId()).size(),
                userRepository.findByPortalId(portal.getId()).size(),
                registrations.size(),
                calculateRevenue(registrations)
        );
    }

    private String resolvePortalStatus(
            Portal portal,
            PortalSubscription subscription
    ) {
        if (Boolean.TRUE.equals(portal.getDeleted())) {
            return "Deleted";
        }
        if (subscription == null) {
            return "Deactivated";
        }
        if (subscription.getEndDate() != null
                && !subscription.getEndDate().isAfter(LocalDateTime.now())) {
            return "Expired";
        }
        if (subscription.getStatus() == SubscriptionStatus.EXPIRED) {
            return "Expired";
        }

        // A portal keeps access while its current plan period is valid. This also
        // applies to trials and subscriptions cancelled for the next renewal.
        return "Active";
    }

    private boolean isSubscriptionCurrentlyActive(
            PortalSubscription subscription
    ) {
        if (subscription == null) return false;
        if (subscription.getEndDate() != null
                && !subscription.getEndDate().isAfter(LocalDateTime.now())) {
            return false;
        }
        return subscription.getStatus() != SubscriptionStatus.EXPIRED;
    }

    private BigDecimal calculateRevenue(List<Registration> registrations) {
        return registrations.stream()
                .filter(registration -> registration.getPaymentStatus() == PaymentStatus.PAID)
                .map(Registration::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateMonthlyRevenue(List<Registration> registrations) {
        LocalDate today = LocalDate.now();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime nextMonthStart = monthStart.plusMonths(1);

        return registrations.stream()
                .filter(registration -> registration.getPaymentStatus() == PaymentStatus.PAID)
                .filter(registration -> registration.getPaymentDate() != null)
                .filter(registration ->
                        !registration.getPaymentDate().isBefore(monthStart)
                                && registration.getPaymentDate().isBefore(nextMonthStart)
                )
                .map(Registration::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateSubscriptionRevenue(
            List<SubscriptionPayment> payments
    ) {
        return payments.stream()
                .filter(payment -> payment.getStatus() == SubscriptionPaymentStatus.SUCCESS)
                .map(SubscriptionPayment::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateMonthlySubscriptionRevenue(
            List<SubscriptionPayment> payments
    ) {
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime nextMonthStart = monthStart.plusMonths(1);
        return payments.stream()
                .filter(payment -> payment.getStatus() == SubscriptionPaymentStatus.SUCCESS)
                .filter(payment -> payment.getPaidAt() != null)
                .filter(payment -> !payment.getPaidAt().isBefore(monthStart)
                        && payment.getPaidAt().isBefore(nextMonthStart))
                .map(SubscriptionPayment::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String getOwnerName(User admin) {
        if (admin == null) {
            return null;
        }

        String firstName = admin.getFirstName() == null ? "" : admin.getFirstName().trim();
        String lastName = admin.getLastName() == null ? "" : admin.getLastName().trim();

        String fullName = (firstName + " " + lastName).trim();

        return fullName.isBlank() ? admin.getEmail() : fullName;
    }
}
