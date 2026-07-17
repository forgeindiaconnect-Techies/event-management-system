package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.SubscriptionPaymentRequest;
import com.fic.event_management_system.dto.SubscriptionPaymentResponse;
import com.fic.event_management_system.dto.SubscriptionPaymentVerificationRequest;
import com.fic.event_management_system.dto.SubscriptionReceiptResponse;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionStatus;
import com.fic.event_management_system.repository.SubscriptionPaymentRepository;
import com.fic.event_management_system.repository.SubscriptionPlanRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;
import com.fic.event_management_system.service.SubscriptionPaymentService;
import com.fic.event_management_system.service.SubscriptionService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DevelopmentSubscriptionPaymentServiceImpl
        implements SubscriptionPaymentService {

    private static final long PAYMENT_EXPIRY_MINUTES = 30;

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final SubscriptionService subscriptionService;
    private final TenantSecurityService tenantSecurityService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${subscription.payments.development-enabled:false}")
    private boolean developmentEnabled;

    @Value("${subscription.payments.development-success-token:}")
    private String developmentSuccessToken;

    public DevelopmentSubscriptionPaymentServiceImpl(
            SubscriptionPlanRepository planRepository,
            SubscriptionPaymentRepository paymentRepository,
            SubscriptionService subscriptionService,
            TenantSecurityService tenantSecurityService,
            NotificationService notificationService,
            EmailService emailService
    ) {
        this.planRepository = planRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionService = subscriptionService;
        this.tenantSecurityService = tenantSecurityService;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public SubscriptionPaymentResponse initiatePayment(
            SubscriptionPaymentRequest request
    ) {
        requireDevelopmentMode();
        requirePortalAdmin();

        if (request == null || request.getPlanCode() == null) {
            throw new RuntimeException("Subscription plan is required");
        }

        if (request.getBillingCycle() == null) {
            throw new RuntimeException("Billing cycle is required");
        }

        Portal portal = tenantSecurityService.getLoggedInPortal();
        expirePendingPayments();

        if (paymentRepository.existsByPortalIdAndStatus(
                portal.getId(),
                SubscriptionPaymentStatus.PENDING
        )) {
            throw new RuntimeException(
                    "A subscription payment is already pending for this portal"
            );
        }

        SubscriptionPlan plan = planRepository
                .findByCode(request.getPlanCode())
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));

        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new RuntimeException("Subscription plan is not available");
        }

        Optional<PortalSubscription> currentSubscription =
                subscriptionService.getCurrentSubscription(portal.getId());
        currentSubscription.ifPresent(current -> {
                    if (current.getNextPlan() != null) {
                        throw new RuntimeException(
                                "A plan change is already scheduled for this portal"
                        );
                    }

                    boolean downgrade = plan.getCode().ordinal()
                            < current.getPlan().getCode().ordinal();
                    if (downgrade
                            && current.getStatus()
                            == SubscriptionStatus.TRIAL) {
                        throw new RuntimeException(
                                "A trial plan cannot be downgraded. Cancel the trial first."
                        );
                    }
                });

        BigDecimal grossAmount = priceFor(plan, request.getBillingCycle());
        BigDecimal creditAmount = BigDecimal.ZERO;
        BigDecimal amount = grossAmount;
        boolean prorated = false;
        LocalDateTime accessStartAt = null;
        LocalDateTime accessEndAt = null;

        if (currentSubscription.isPresent()) {
            PortalSubscription current = currentSubscription.get();
            boolean samePlan = current.getPlan().getCode() == plan.getCode();
            boolean upgrade = plan.getCode().ordinal()
                    > current.getPlan().getCode().ordinal();
            boolean billingCycleChange = current.getBillingCycle()
                    != request.getBillingCycle();

            if (upgrade || (samePlan && billingCycleChange)) {
                LocalDateTime now = LocalDateTime.now();
                accessStartAt = current.getStartDate();
                accessEndAt = addBillingPeriod(
                        accessStartAt,
                        request.getBillingCycle()
                );
                if (!accessEndAt.isAfter(now)) {
                    accessStartAt = now;
                    accessEndAt = addBillingPeriod(now, request.getBillingCycle());
                }

                grossAmount = proratedValue(
                        priceFor(plan, request.getBillingCycle()),
                        now,
                        accessEndAt,
                        accessStartAt,
                        accessEndAt
                );

                if (!Boolean.TRUE.equals(current.getTrial())) {
                    creditAmount = proratedValue(
                            priceFor(current.getPlan(), current.getBillingCycle()),
                            now,
                            current.getEndDate(),
                            current.getStartDate(),
                            current.getEndDate()
                    );
                }

                amount = grossAmount.subtract(creditAmount)
                        .max(BigDecimal.ZERO)
                        .setScale(2, RoundingMode.HALF_UP);
                prorated = true;
            }
        }

        if (amount == null || amount.signum() <= 0) {
            throw new RuntimeException("Subscription plan price is invalid");
        }

        SubscriptionPayment payment = new SubscriptionPayment();
        payment.setPortal(portal);
        payment.setPlan(plan);
        payment.setPaymentReference("SUB-" + UUID.randomUUID().toString().toUpperCase());
        payment.setGatewayOrderId("DEV-ORDER-" + UUID.randomUUID().toString().toUpperCase());
        payment.setAmount(amount);
        payment.setGrossAmount(grossAmount.setScale(2, RoundingMode.HALF_UP));
        payment.setCreditAmount(creditAmount.setScale(2, RoundingMode.HALF_UP));
        payment.setProrated(prorated);
        payment.setAccessStartAt(accessStartAt);
        payment.setAccessEndAt(accessEndAt);
        payment.setCurrency("INR");
        payment.setBillingCycle(request.getBillingCycle());
        payment.setStatus(SubscriptionPaymentStatus.PENDING);
        payment.setExpiresAt(
                LocalDateTime.now().plusMinutes(PAYMENT_EXPIRY_MINUTES)
        );
        payment = paymentRepository.save(payment);

        SubscriptionPaymentResponse response = new SubscriptionPaymentResponse(
                payment.getId(),
                payment.getPaymentReference(),
                payment.getGatewayOrderId(),
                "development",
                plan.getCode(),
                payment.getBillingCycle(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getExpiresAt()
        );
        response.setGrossAmount(payment.getGrossAmount());
        response.setCreditAmount(payment.getCreditAmount());
        response.setProrated(payment.getProrated());
        response.setAccessStartAt(payment.getAccessStartAt());
        response.setAccessEndAt(payment.getAccessEndAt());
        return response;
    }

    @Override
    @Transactional(noRollbackFor = IllegalStateException.class)
    public PortalSubscription verifyAndActivate(
            SubscriptionPaymentVerificationRequest request
    ) {
        requireDevelopmentMode();
        requirePortalAdmin();

        if (request == null || request.getPaymentReference() == null) {
            throw new RuntimeException("Payment reference is required");
        }

        SubscriptionPayment payment = paymentRepository
                .findByPaymentReference(request.getPaymentReference())
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        tenantSecurityService.requireSamePortal(payment.getPortal().getId());

        if (payment.getStatus() == SubscriptionPaymentStatus.SUCCESS
                && payment.getSubscription() != null) {
            return payment.getSubscription();
        }

        if (payment.getStatus() == SubscriptionPaymentStatus.PENDING
                && isExpired(payment, LocalDateTime.now())) {
            expirePayment(payment);
            paymentRepository.save(payment);
            notifyPaymentFailure(payment, true);
            throw new IllegalStateException(
                    "Development payment has expired. Initiate a new payment."
            );
        }

        if (payment.getStatus() != SubscriptionPaymentStatus.PENDING) {
            throw new RuntimeException("Payment is not awaiting verification");
        }

        if (!payment.getGatewayOrderId().equals(request.getGatewayOrderId())) {
            throw new RuntimeException("Development payment order does not match");
        }

        if (developmentSuccessToken == null
                || developmentSuccessToken.isBlank()
                || !developmentSuccessToken.equals(request.getGatewaySignature())) {
            throw new RuntimeException("Invalid development payment confirmation token");
        }

        PortalSubscription subscription = subscriptionService.activatePaidSubscription(
                payment.getPortal(),
                payment.getPlan(),
                payment.getBillingCycle()
        );

        if (Boolean.TRUE.equals(payment.getProrated())
                && payment.getAccessStartAt() != null
                && payment.getAccessEndAt() != null) {
            subscription.setPlan(payment.getPlan());
            subscription.setBillingCycle(payment.getBillingCycle());
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setTrial(false);
            subscription.setAutoRenew(false);
            subscription.setStartDate(payment.getAccessStartAt());
            subscription.setEndDate(payment.getAccessEndAt());
            subscription.setCancelledAt(null);
            subscription.setCancellationReason(null);
            subscription.setNextPlan(null);
            subscription.setNextBillingCycle(null);
            subscription.setNextPlanStartsAt(null);
        }

        payment.setGatewayPaymentId(
                request.getGatewayPaymentId() == null
                        ? "DEV-PAY-" + UUID.randomUUID().toString().toUpperCase()
                        : request.getGatewayPaymentId()
        );
        payment.setStatus(SubscriptionPaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setFailureReason(null);
        payment.setSubscription(subscription);
        issueInvoice(payment);
        paymentRepository.save(payment);
        notifyPaymentSuccess(payment);

        return subscription;
    }

    @Override
    @Transactional
    public void markPaymentFailed(
            String paymentReference,
            String failureReason
    ) {
        requireDevelopmentMode();
        requirePortalAdmin();

        SubscriptionPayment payment = paymentRepository
                .findByPaymentReference(paymentReference)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        tenantSecurityService.requireSamePortal(payment.getPortal().getId());

        if (payment.getStatus() != SubscriptionPaymentStatus.PENDING) {
            throw new RuntimeException(
                    "Only a pending payment can be marked as failed"
            );
        }

        payment.setStatus(SubscriptionPaymentStatus.FAILED);
        payment.setFailureReason(
                failureReason == null || failureReason.isBlank()
                        ? "Development payment failed"
                        : failureReason
        );
        paymentRepository.save(payment);
        notifyPaymentFailure(payment, false);
    }

    @Override
    @Transactional
    public void abandonPendingPayment(String paymentReference) {
        requireDevelopmentMode();
        requirePortalAdmin();

        SubscriptionPayment payment = paymentRepository
                .findByPaymentReference(paymentReference)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));
        tenantSecurityService.requireSamePortal(payment.getPortal().getId());
        if (payment.getStatus() != SubscriptionPaymentStatus.PENDING) {
            throw new RuntimeException("Only a pending payment can be abandoned");
        }
        paymentRepository.delete(payment);
        paymentRepository.flush();
    }

    @Override
    @Transactional
    public void expirePendingPayments() {
        LocalDateTime now = LocalDateTime.now();
        var expiredPayments = paymentRepository
                .findByStatusOrderByCreatedAtDesc(
                        SubscriptionPaymentStatus.PENDING
                )
                .stream()
                .filter(payment -> isExpired(payment, now))
                .toList();

        expiredPayments.forEach(payment -> {
            expirePayment(payment);
            notifyPaymentFailure(payment, true);
        });

        if (!expiredPayments.isEmpty()) {
            paymentRepository.saveAll(expiredPayments);
        }
    }

    @Override
    @Transactional
    public SubscriptionReceiptResponse getReceipt(String paymentReference) {
        if (paymentReference == null || paymentReference.isBlank()) {
            throw new RuntimeException("Payment reference is required");
        }

        SubscriptionPayment payment = paymentRepository
                .findByPaymentReference(paymentReference)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        if (!tenantSecurityService.isSuperAdmin()) {
            requirePortalAdmin();
            tenantSecurityService.requireSamePortal(payment.getPortal().getId());
        }

        if (payment.getStatus() != SubscriptionPaymentStatus.SUCCESS
                && payment.getStatus() != SubscriptionPaymentStatus.REFUNDED) {
            throw new RuntimeException(
                    "A receipt is available only for a completed payment"
            );
        }

        if (payment.getInvoiceNumber() == null
                || payment.getInvoiceIssuedAt() == null) {
            issueInvoice(payment);
            payment = paymentRepository.save(payment);
        }

        return SubscriptionReceiptResponse.from(payment);
    }

    private boolean isExpired(
            SubscriptionPayment payment,
            LocalDateTime now
    ) {
        LocalDateTime expiry = payment.getExpiresAt();
        if (expiry == null && payment.getCreatedAt() != null) {
            expiry = payment.getCreatedAt().plusMinutes(PAYMENT_EXPIRY_MINUTES);
            payment.setExpiresAt(expiry);
        }

        return expiry != null && !expiry.isAfter(now);
    }

    private void expirePayment(SubscriptionPayment payment) {
        payment.setStatus(SubscriptionPaymentStatus.FAILED);
        payment.setFailureReason(
                "Development payment expired after "
                        + PAYMENT_EXPIRY_MINUTES
                        + " minutes"
        );
    }

    private void issueInvoice(SubscriptionPayment payment) {
        if (payment.getInvoiceNumber() != null
                && payment.getInvoiceIssuedAt() != null) {
            return;
        }

        LocalDateTime issuedAt = payment.getPaidAt() == null
                ? LocalDateTime.now()
                : payment.getPaidAt();
        String datePart = issuedAt.toLocalDate()
                .format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomPart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        payment.setInvoiceNumber(
                "INV-" + datePart + "-" + randomPart
        );
        payment.setInvoiceIssuedAt(issuedAt);
    }

    private void notifyPaymentFailure(
            SubscriptionPayment payment,
            boolean expired
    ) {
        Portal portal = payment.getPortal();
        User owner = portal == null ? null : portal.getAdmin();

        if (owner == null) {
            return;
        }

        String title = expired
                ? "Subscription payment expired"
                : "Subscription payment failed";
        String planName = payment.getPlan() == null
                ? "selected subscription"
                : payment.getPlan().getDisplayName();
        String reason = payment.getFailureReason() == null
                || payment.getFailureReason().isBlank()
                ? "The payment could not be completed."
                : payment.getFailureReason();
        String message = "Payment for " + planName + " was not completed. "
                + reason + " You can start a new payment from the subscription page.";
        String deduplicationKey = "SUBSCRIPTION_PAYMENT_FAILED_" + payment.getId();

        notificationService.createNotification(
                owner,
                portal,
                null,
                NotificationType.PAYMENT_FAILED,
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
                        + "Portal: " + portal.getPortalName() + "\n"
                        + "Payment reference: " + payment.getPaymentReference()
                        + "\n\nRegards,\nFIC BackRooms",
                NotificationType.PAYMENT_FAILED,
                owner,
                portal,
                null,
                deduplicationKey,
                LocalDateTime.now()
        );
    }

    private void notifyPaymentSuccess(SubscriptionPayment payment) {
        Portal portal = payment.getPortal();
        User owner = portal == null ? null : portal.getAdmin();
        if (owner == null) {
            return;
        }

        String planName = payment.getPlan() == null
                ? "subscription"
                : payment.getPlan().getDisplayName();
        String title = "Subscription payment successful";
        String message = "Your payment for the " + planName
                + " plan was completed successfully.";
        String key = "SUBSCRIPTION_PAYMENT_SUCCESS_" + payment.getId();

        notificationService.createNotification(
                owner, portal, null, NotificationType.PAYMENT_SUCCESS,
                title, message, "/subscription", key
        );
        emailService.queueEmail(
                owner.getEmail(), title,
                "Hello " + owner.getFirstName() + ",\n\n"
                        + message + "\n\nPortal: " + portal.getPortalName()
                        + "\nPayment reference: " + payment.getPaymentReference()
                        + "\nAmount: " + payment.getCurrency() + " " + payment.getAmount()
                        + "\n\nRegards,\nFIC BackRooms",
                NotificationType.PAYMENT_SUCCESS,
                owner, portal, null, key, LocalDateTime.now()
        );
    }

    private void requirePortalAdmin() {
        if (!tenantSecurityService.isPortalAdmin()) {
            throw new RuntimeException("Only the portal admin can manage subscriptions");
        }
    }

    private void requireDevelopmentMode() {
        if (!developmentEnabled) {
            throw new RuntimeException("Development subscription payments are disabled");
        }
    }

    private BigDecimal priceFor(
            SubscriptionPlan plan,
            BillingCycle billingCycle
    ) {
        BigDecimal price = billingCycle == BillingCycle.YEARLY
                ? plan.getYearlyPrice()
                : plan.getMonthlyPrice();
        if (price == null || price.signum() <= 0) {
            throw new RuntimeException("Subscription plan price is invalid");
        }
        return price;
    }

    private LocalDateTime addBillingPeriod(
            LocalDateTime start,
            BillingCycle billingCycle
    ) {
        return billingCycle == BillingCycle.YEARLY
                ? start.plusYears(1)
                : start.plusMonths(1);
    }

    private BigDecimal proratedValue(
            BigDecimal fullPrice,
            LocalDateTime remainingStart,
            LocalDateTime remainingEnd,
            LocalDateTime fullStart,
            LocalDateTime fullEnd
    ) {
        if (remainingEnd == null || fullStart == null || fullEnd == null
                || !remainingEnd.isAfter(remainingStart)) {
            return BigDecimal.ZERO;
        }
        long fullSeconds = Math.max(1, ChronoUnit.SECONDS.between(fullStart, fullEnd));
        long remainingSeconds = Math.max(
                0,
                ChronoUnit.SECONDS.between(remainingStart, remainingEnd)
        );
        return fullPrice
                .multiply(BigDecimal.valueOf(remainingSeconds))
                .divide(BigDecimal.valueOf(fullSeconds), 2, RoundingMode.HALF_UP);
    }
}
