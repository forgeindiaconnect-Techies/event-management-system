package com.fic.event_management_system;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fic.event_management_system.dto.SubscriptionPaymentRequest;
import com.fic.event_management_system.dto.SubscriptionPaymentVerificationRequest;
import com.fic.event_management_system.dto.SubscriptionReceiptResponse;
import com.fic.event_management_system.dto.UpdateSubscriptionPlanRequest;
import com.fic.event_management_system.entity.Portal;
import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionAuditLog;
import com.fic.event_management_system.entity.SubscriptionPayment;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPaymentStatus;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.SubscriptionStatus;
import com.fic.event_management_system.repository.PortalRepository;
import com.fic.event_management_system.repository.PortalSubscriptionRepository;
import com.fic.event_management_system.repository.SubscriptionPaymentRepository;
import com.fic.event_management_system.repository.SubscriptionAuditLogRepository;
import com.fic.event_management_system.repository.SubscriptionPlanRepository;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.NotificationService;
import com.fic.event_management_system.service.SubscriptionService;
import com.fic.event_management_system.serviceImpl.DevelopmentSubscriptionPaymentServiceImpl;
import com.fic.event_management_system.serviceImpl.SuperAdminServiceImpl;
import com.fic.event_management_system.serviceImpl.SubscriptionServiceImpl;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;

@SpringBootTest
class EventManagementSystemApplicationTests {

	@Test
	void contextLoads() {
	}

}

class SubscriptionServiceUnitTests {

	@Test
	void createsOneMonthStandardTrialForNewPortal() {
		PortalRepository portalRepository = mock(PortalRepository.class);
		SubscriptionPlanRepository planRepository = mock(SubscriptionPlanRepository.class);
		PortalSubscriptionRepository subscriptionRepository = mock(PortalSubscriptionRepository.class);
		SubscriptionAuditLogRepository auditRepository = mock(SubscriptionAuditLogRepository.class);

		SubscriptionServiceImpl service = new SubscriptionServiceImpl(
				portalRepository,
				planRepository,
				subscriptionRepository,
				auditRepository,
				mock(SubscriptionPaymentRepository.class),
				mock(NotificationService.class),
				mock(EmailService.class)
		);

		Portal portal = new Portal();
		portal.setId(21L);

		SubscriptionPlan standard = new SubscriptionPlan();
		standard.setCode(SubscriptionPlanCode.STANDARD);
		standard.setDisplayName("Standard");

		when(subscriptionRepository.existsByPortalIdAndTrialTrue(21L)).thenReturn(false);
		when(planRepository.findByCode(SubscriptionPlanCode.STANDARD))
				.thenReturn(Optional.of(standard));
		when(subscriptionRepository.save(any(PortalSubscription.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		LocalDateTime beforeCreation = LocalDateTime.now();
		PortalSubscription result = service.createStandardTrial(portal);

		assertEquals(SubscriptionStatus.TRIAL, result.getStatus());
		assertEquals(SubscriptionPlanCode.STANDARD, result.getPlan().getCode());
		assertTrue(Boolean.TRUE.equals(result.getTrial()));
		assertFalse(Boolean.TRUE.equals(result.getAutoRenew()));
		assertTrue(result.getEndDate().isAfter(beforeCreation.plusDays(27)));
		assertTrue(result.getEndDate().isBefore(LocalDateTime.now().plusMonths(1).plusMinutes(1)));
		verify(subscriptionRepository).save(result);
	}

	@Test
	void expiresEndedTrialAndActiveSubscriptions() {
		PortalRepository portalRepository = mock(PortalRepository.class);
		SubscriptionPlanRepository planRepository = mock(SubscriptionPlanRepository.class);
		PortalSubscriptionRepository subscriptionRepository = mock(PortalSubscriptionRepository.class);
		SubscriptionAuditLogRepository auditRepository = mock(SubscriptionAuditLogRepository.class);

		SubscriptionServiceImpl service = new SubscriptionServiceImpl(
				portalRepository,
				planRepository,
				subscriptionRepository,
				auditRepository,
				mock(SubscriptionPaymentRepository.class),
				mock(NotificationService.class),
				mock(EmailService.class)
		);

		PortalSubscription trial = new PortalSubscription();
		trial.setStatus(SubscriptionStatus.TRIAL);
		trial.setAutoRenew(false);
		trial.setEndDate(LocalDateTime.now().minusDays(1));

		PortalSubscription active = new PortalSubscription();
		active.setStatus(SubscriptionStatus.ACTIVE);
		active.setAutoRenew(true);
		active.setEndDate(LocalDateTime.now().minusHours(1));

		when(subscriptionRepository.findByStatusInAndEndDateBefore(
				any(),
				any(LocalDateTime.class)
		)).thenReturn(List.of(trial, active));

		service.expireEndedSubscriptions();

		assertEquals(SubscriptionStatus.EXPIRED, trial.getStatus());
		assertEquals(SubscriptionStatus.EXPIRED, active.getStatus());
		assertFalse(Boolean.TRUE.equals(active.getAutoRenew()));
		verify(subscriptionRepository).saveAll(List.of(trial, active));
	}

	@Test
	void activatesHigherPlanImmediately() {
		PortalRepository portalRepository = mock(PortalRepository.class);
		SubscriptionPlanRepository planRepository = mock(SubscriptionPlanRepository.class);
		PortalSubscriptionRepository subscriptionRepository = mock(PortalSubscriptionRepository.class);
		SubscriptionAuditLogRepository auditRepository = mock(SubscriptionAuditLogRepository.class);
		SubscriptionServiceImpl service = new SubscriptionServiceImpl(
				portalRepository, planRepository, subscriptionRepository, auditRepository,
				mock(SubscriptionPaymentRepository.class),
				mock(NotificationService.class), mock(EmailService.class)
		);

		Portal portal = new Portal();
		portal.setId(30L);
		SubscriptionPlan standard = plan(SubscriptionPlanCode.STANDARD, "Standard");
		SubscriptionPlan professional = plan(
				SubscriptionPlanCode.PROFESSIONAL, "Professional"
		);
		PortalSubscription current = activeSubscription(
				portal, standard, LocalDateTime.now().plusDays(15)
		);

		when(subscriptionRepository.findTopByPortalIdAndStatusInOrderByEndDateDesc(
				any(), any()
		)).thenReturn(Optional.of(current));
		when(subscriptionRepository.save(any(PortalSubscription.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		PortalSubscription result = service.activatePaidSubscription(
				portal, professional, BillingCycle.MONTHLY
		);

		assertEquals(SubscriptionPlanCode.PROFESSIONAL, result.getPlan().getCode());
		assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
		assertNull(result.getNextPlan());
		assertTrue(result.getEndDate().isAfter(LocalDateTime.now().plusDays(27)));
	}

	@Test
	void schedulesLowerPlanAfterCurrentPlanExpiry() {
		PortalRepository portalRepository = mock(PortalRepository.class);
		SubscriptionPlanRepository planRepository = mock(SubscriptionPlanRepository.class);
		PortalSubscriptionRepository subscriptionRepository = mock(PortalSubscriptionRepository.class);
		SubscriptionAuditLogRepository auditRepository = mock(SubscriptionAuditLogRepository.class);
		SubscriptionServiceImpl service = new SubscriptionServiceImpl(
				portalRepository, planRepository, subscriptionRepository, auditRepository,
				mock(SubscriptionPaymentRepository.class),
				mock(NotificationService.class), mock(EmailService.class)
		);

		Portal portal = new Portal();
		portal.setId(31L);
		SubscriptionPlan enterprise = plan(
				SubscriptionPlanCode.ENTERPRISE, "Enterprise"
		);
		SubscriptionPlan standard = plan(SubscriptionPlanCode.STANDARD, "Standard");
		LocalDateTime currentEnd = LocalDateTime.now().plusDays(20);
		PortalSubscription current = activeSubscription(portal, enterprise, currentEnd);

		when(subscriptionRepository.findTopByPortalIdAndStatusInOrderByEndDateDesc(
				any(), any()
		)).thenReturn(Optional.of(current));
		when(subscriptionRepository.save(any(PortalSubscription.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		PortalSubscription result = service.activatePaidSubscription(
				portal, standard, BillingCycle.YEARLY
		);

		assertEquals(SubscriptionPlanCode.ENTERPRISE, result.getPlan().getCode());
		assertEquals(SubscriptionPlanCode.STANDARD, result.getNextPlan().getCode());
		assertEquals(BillingCycle.YEARLY, result.getNextBillingCycle());
		assertEquals(currentEnd, result.getNextPlanStartsAt());
		assertEquals(currentEnd, result.getEndDate());
	}

	@Test
	void samePlanPaymentExtendsExistingExpiry() {
		PortalRepository portalRepository = mock(PortalRepository.class);
		SubscriptionPlanRepository planRepository = mock(SubscriptionPlanRepository.class);
		PortalSubscriptionRepository subscriptionRepository = mock(PortalSubscriptionRepository.class);
		SubscriptionAuditLogRepository auditRepository = mock(SubscriptionAuditLogRepository.class);
		SubscriptionServiceImpl service = new SubscriptionServiceImpl(
				portalRepository, planRepository, subscriptionRepository, auditRepository,
				mock(SubscriptionPaymentRepository.class),
				mock(NotificationService.class), mock(EmailService.class)
		);

		Portal portal = new Portal();
		portal.setId(32L);
		SubscriptionPlan standard = plan(SubscriptionPlanCode.STANDARD, "Standard");
		LocalDateTime currentEnd = LocalDateTime.now().plusDays(10);
		PortalSubscription current = activeSubscription(portal, standard, currentEnd);

		when(subscriptionRepository.findTopByPortalIdAndStatusInOrderByEndDateDesc(
				any(), any()
		)).thenReturn(Optional.of(current));
		when(subscriptionRepository.save(any(PortalSubscription.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		PortalSubscription result = service.activatePaidSubscription(
				portal, standard, BillingCycle.YEARLY
		);

		assertEquals(currentEnd.plusYears(1), result.getEndDate());
		assertEquals(BillingCycle.YEARLY, result.getBillingCycle());
	}

	private SubscriptionPlan plan(SubscriptionPlanCode code, String name) {
		SubscriptionPlan plan = new SubscriptionPlan();
		plan.setCode(code);
		plan.setDisplayName(name);
		return plan;
	}

	private PortalSubscription activeSubscription(
			Portal portal,
			SubscriptionPlan plan,
			LocalDateTime endDate
	) {
		PortalSubscription subscription = new PortalSubscription();
		subscription.setPortal(portal);
		subscription.setPlan(plan);
		subscription.setStatus(SubscriptionStatus.ACTIVE);
		subscription.setBillingCycle(BillingCycle.MONTHLY);
		subscription.setTrial(false);
		subscription.setAutoRenew(false);
		subscription.setStartDate(LocalDateTime.now().minusDays(5));
		subscription.setEndDate(endDate);
		return subscription;
	}
}

class DevelopmentSubscriptionPaymentServiceUnitTests {

	@Test
	void expiresPendingPaymentAfterThirtyMinutes() {
		SubscriptionPaymentRepository paymentRepository =
				mock(SubscriptionPaymentRepository.class);
		DevelopmentSubscriptionPaymentServiceImpl service =
				paymentService(paymentRepository, mock(SubscriptionService.class),
						mock(TenantSecurityService.class));

		SubscriptionPayment payment = new SubscriptionPayment();
		payment.setStatus(SubscriptionPaymentStatus.PENDING);
		payment.setExpiresAt(LocalDateTime.now().minusMinutes(1));

		when(paymentRepository.findByStatusOrderByCreatedAtDesc(
				SubscriptionPaymentStatus.PENDING
		)).thenReturn(List.of(payment));

		service.expirePendingPayments();

		assertEquals(SubscriptionPaymentStatus.FAILED, payment.getStatus());
		assertTrue(payment.getFailureReason().contains("30 minutes"));
		verify(paymentRepository).saveAll(List.of(payment));
	}

	@Test
	void rejectsVerificationAfterPaymentExpiry() {
		SubscriptionPaymentRepository paymentRepository =
				mock(SubscriptionPaymentRepository.class);
		TenantSecurityService securityService =
				mock(TenantSecurityService.class);
		DevelopmentSubscriptionPaymentServiceImpl service =
				paymentService(paymentRepository, mock(SubscriptionService.class),
						securityService);

		Portal portal = portal(40L);
		SubscriptionPayment payment = pendingPayment(portal);
		payment.setExpiresAt(LocalDateTime.now().minusSeconds(1));

		when(securityService.isPortalAdmin()).thenReturn(true);
		when(paymentRepository.findByPaymentReference("SUB-EXPIRED"))
				.thenReturn(Optional.of(payment));
		when(paymentRepository.save(any(SubscriptionPayment.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		SubscriptionPaymentVerificationRequest request =
				verificationRequest("SUB-EXPIRED");

		assertThrows(
				IllegalStateException.class,
				() -> service.verifyAndActivate(request)
		);
		assertEquals(SubscriptionPaymentStatus.FAILED, payment.getStatus());
		verify(paymentRepository).save(payment);
	}

	@Test
	void preventsDuplicatePendingPaymentForPortal() {
		SubscriptionPaymentRepository paymentRepository =
				mock(SubscriptionPaymentRepository.class);
		TenantSecurityService securityService =
				mock(TenantSecurityService.class);
		DevelopmentSubscriptionPaymentServiceImpl service =
				paymentService(paymentRepository, mock(SubscriptionService.class),
						securityService);

		Portal portal = portal(41L);
		when(securityService.isPortalAdmin()).thenReturn(true);
		when(securityService.getLoggedInPortal()).thenReturn(portal);
		when(paymentRepository.findByStatusOrderByCreatedAtDesc(
				SubscriptionPaymentStatus.PENDING
		)).thenReturn(List.of());
		when(paymentRepository.existsByPortalIdAndStatus(
				41L, SubscriptionPaymentStatus.PENDING
		)).thenReturn(true);

		SubscriptionPaymentRequest request = new SubscriptionPaymentRequest();
		request.setPlanCode(SubscriptionPlanCode.STANDARD);
		request.setBillingCycle(BillingCycle.MONTHLY);

		assertThrows(
				RuntimeException.class,
				() -> service.initiatePayment(request)
		);
	}

	@Test
	void successfulPaymentGeneratesInvoice() {
		SubscriptionPaymentRepository paymentRepository =
				mock(SubscriptionPaymentRepository.class);
		SubscriptionService subscriptionService =
				mock(SubscriptionService.class);
		TenantSecurityService securityService =
				mock(TenantSecurityService.class);
		DevelopmentSubscriptionPaymentServiceImpl service =
				paymentService(paymentRepository, subscriptionService, securityService);

		Portal portal = portal(42L);
		SubscriptionPayment payment = pendingPayment(portal);
		PortalSubscription subscription = new PortalSubscription();
		subscription.setPortal(portal);
		subscription.setPlan(payment.getPlan());
		subscription.setStartDate(LocalDateTime.now());
		subscription.setEndDate(LocalDateTime.now().plusMonths(1));

		when(securityService.isPortalAdmin()).thenReturn(true);
		when(paymentRepository.findByPaymentReference("SUB-TEST"))
				.thenReturn(Optional.of(payment));
		when(subscriptionService.activatePaidSubscription(
				portal, payment.getPlan(), BillingCycle.MONTHLY
		)).thenReturn(subscription);
		when(paymentRepository.save(any(SubscriptionPayment.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		service.verifyAndActivate(verificationRequest("SUB-TEST"));

		assertEquals(SubscriptionPaymentStatus.SUCCESS, payment.getStatus());
		assertNotNull(payment.getInvoiceNumber());
		assertTrue(payment.getInvoiceNumber().startsWith("INV-"));
		assertNotNull(payment.getInvoiceIssuedAt());
	}

	@Test
	void portalReceiptChecksPaymentPortalOwnership() {
		SubscriptionPaymentRepository paymentRepository =
				mock(SubscriptionPaymentRepository.class);
		TenantSecurityService securityService =
				mock(TenantSecurityService.class);
		DevelopmentSubscriptionPaymentServiceImpl service =
				paymentService(paymentRepository, mock(SubscriptionService.class),
						securityService);

		SubscriptionPayment payment = completedPayment(portal(43L));
		when(securityService.isSuperAdmin()).thenReturn(false);
		when(securityService.isPortalAdmin()).thenReturn(true);
		when(paymentRepository.findByPaymentReference("SUB-RECEIPT"))
				.thenReturn(Optional.of(payment));

		SubscriptionReceiptResponse receipt =
				service.getReceipt("SUB-RECEIPT");

		assertEquals(payment.getInvoiceNumber(), receipt.getInvoiceNumber());
		verify(securityService).requireSamePortal(43L);
	}

	@Test
	void superAdminCanReadAnyPortalReceipt() {
		SubscriptionPaymentRepository paymentRepository =
				mock(SubscriptionPaymentRepository.class);
		TenantSecurityService securityService =
				mock(TenantSecurityService.class);
		DevelopmentSubscriptionPaymentServiceImpl service =
				paymentService(paymentRepository, mock(SubscriptionService.class),
						securityService);

		SubscriptionPayment payment = completedPayment(portal(44L));
		when(securityService.isSuperAdmin()).thenReturn(true);
		when(paymentRepository.findByPaymentReference("SUB-SUPER"))
				.thenReturn(Optional.of(payment));

		SubscriptionReceiptResponse receipt =
				service.getReceipt("SUB-SUPER");

		assertNotNull(receipt);
		verify(securityService, never()).requireSamePortal(44L);
	}

	private DevelopmentSubscriptionPaymentServiceImpl paymentService(
			SubscriptionPaymentRepository paymentRepository,
			SubscriptionService subscriptionService,
			TenantSecurityService securityService
	) {
		DevelopmentSubscriptionPaymentServiceImpl service =
				new DevelopmentSubscriptionPaymentServiceImpl(
						mock(SubscriptionPlanRepository.class),
						paymentRepository,
						subscriptionService,
						securityService,
						mock(NotificationService.class),
						mock(EmailService.class)
				);
		ReflectionTestUtils.setField(service, "developmentEnabled", true);
		ReflectionTestUtils.setField(
				service,
				"developmentSuccessToken",
				"BACKROOMS-DEV-PAYMENT-SUCCESS"
		);
		return service;
	}

	private Portal portal(Long id) {
		Portal portal = new Portal();
		portal.setId(id);
		portal.setPortalName("Portal " + id);
		portal.setPortalCode("PORTAL-" + id);
		return portal;
	}

	private SubscriptionPayment pendingPayment(Portal portal) {
		SubscriptionPlan plan = new SubscriptionPlan();
		plan.setCode(SubscriptionPlanCode.STANDARD);
		plan.setDisplayName("Standard");

		SubscriptionPayment payment = new SubscriptionPayment();
		payment.setPortal(portal);
		payment.setPlan(plan);
		payment.setPaymentReference(
				portal.getId().equals(40L) ? "SUB-EXPIRED" : "SUB-TEST"
		);
		payment.setGatewayOrderId("DEV-ORDER-TEST");
		payment.setBillingCycle(BillingCycle.MONTHLY);
		payment.setAmount(new BigDecimal("999.00"));
		payment.setStatus(SubscriptionPaymentStatus.PENDING);
		payment.setExpiresAt(LocalDateTime.now().plusMinutes(30));
		return payment;
	}

	private SubscriptionPayment completedPayment(Portal portal) {
		SubscriptionPayment payment = pendingPayment(portal);
		payment.setStatus(SubscriptionPaymentStatus.SUCCESS);
		payment.setPaidAt(LocalDateTime.now());
		payment.setInvoiceNumber("INV-20260713-TEST" + portal.getId());
		payment.setInvoiceIssuedAt(LocalDateTime.now());
		return payment;
	}

	private SubscriptionPaymentVerificationRequest verificationRequest(
			String paymentReference
	) {
		SubscriptionPaymentVerificationRequest request =
				new SubscriptionPaymentVerificationRequest();
		request.setPaymentReference(paymentReference);
		request.setGatewayOrderId("DEV-ORDER-TEST");
		request.setGatewayPaymentId("DEV-PAY-TEST");
		request.setGatewaySignature("BACKROOMS-DEV-PAYMENT-SUCCESS");
		return request;
	}
}

class SuperAdminPlanManagementUnitTests {

	@Test
	void rejectsInvalidPlanPrice() {
		SubscriptionPlanRepository planRepository =
				mock(SubscriptionPlanRepository.class);
		SuperAdminServiceImpl service = superAdminService(
				planRepository,
				mock(SubscriptionAuditLogRepository.class),
				mock(TenantSecurityService.class)
		);
		SubscriptionPlan plan = plan(SubscriptionPlanCode.PROFESSIONAL);
		when(planRepository.findByCode(SubscriptionPlanCode.PROFESSIONAL))
				.thenReturn(Optional.of(plan));

		UpdateSubscriptionPlanRequest request =
				new UpdateSubscriptionPlanRequest();
		request.setMonthlyPrice(BigDecimal.ZERO);

		assertThrows(
				RuntimeException.class,
				() -> service.updateSubscriptionPlan(
						SubscriptionPlanCode.PROFESSIONAL,
						request
				)
		);
	}

	@Test
	void standardTrialPlanCannotBeDisabled() {
		SubscriptionPlanRepository planRepository =
				mock(SubscriptionPlanRepository.class);
		SuperAdminServiceImpl service = superAdminService(
				planRepository,
				mock(SubscriptionAuditLogRepository.class),
				mock(TenantSecurityService.class)
		);
		SubscriptionPlan plan = plan(SubscriptionPlanCode.STANDARD);
		when(planRepository.findByCode(SubscriptionPlanCode.STANDARD))
				.thenReturn(Optional.of(plan));

		UpdateSubscriptionPlanRequest request =
				new UpdateSubscriptionPlanRequest();
		request.setActive(false);

		assertThrows(
				RuntimeException.class,
				() -> service.updateSubscriptionPlan(
						SubscriptionPlanCode.STANDARD,
						request
				)
		);
	}

	@Test
	void validPlanUpdateCreatesAuditRecord() {
		SubscriptionPlanRepository planRepository =
				mock(SubscriptionPlanRepository.class);
		SubscriptionAuditLogRepository auditRepository =
				mock(SubscriptionAuditLogRepository.class);
		TenantSecurityService securityService =
				mock(TenantSecurityService.class);
		SuperAdminServiceImpl service = superAdminService(
				planRepository, auditRepository, securityService
		);
		SubscriptionPlan plan = plan(SubscriptionPlanCode.PROFESSIONAL);
		User superAdmin = new User();

		when(planRepository.findByCode(SubscriptionPlanCode.PROFESSIONAL))
				.thenReturn(Optional.of(plan));
		when(planRepository.save(any(SubscriptionPlan.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));
		when(securityService.getLoggedInUser()).thenReturn(superAdmin);

		UpdateSubscriptionPlanRequest request =
				new UpdateSubscriptionPlanRequest();
		request.setMonthlyPrice(new BigDecimal("2999.00"));
		request.setMaxActiveEvents(20);

		SubscriptionPlan updated = service.updateSubscriptionPlan(
				SubscriptionPlanCode.PROFESSIONAL,
				request
		);

		assertEquals(new BigDecimal("2999.00"), updated.getMonthlyPrice());
		assertEquals(20, updated.getMaxActiveEvents());
		verify(auditRepository).save(any(SubscriptionAuditLog.class));
	}

	private SuperAdminServiceImpl superAdminService(
			SubscriptionPlanRepository planRepository,
			SubscriptionAuditLogRepository auditRepository,
			TenantSecurityService securityService
	) {
		return new SuperAdminServiceImpl(
				mock(PortalRepository.class),
				mock(UserRepository.class),
				mock(EventRepository.class),
				mock(RegistrationRepository.class),
				securityService,
				mock(PortalSubscriptionRepository.class),
				mock(SubscriptionPaymentRepository.class),
				auditRepository,
				planRepository,
				mock(SubscriptionService.class),
				mock(NotificationService.class),
				mock(EmailService.class)
		);
	}

	private SubscriptionPlan plan(SubscriptionPlanCode code) {
		SubscriptionPlan plan = new SubscriptionPlan();
		plan.setCode(code);
		plan.setDisplayName(code.name());
		plan.setMonthlyPrice(new BigDecimal("999.00"));
		plan.setYearlyPrice(new BigDecimal("9999.00"));
		plan.setActive(true);
		return plan;
	}
}
