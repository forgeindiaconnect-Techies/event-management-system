package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.*;
import com.fic.event_management_system.entity.*;
import com.fic.event_management_system.enums.*;
import com.fic.event_management_system.repository.*;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.PortalPayoutAccountService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@ConditionalOnProperty(
        name = "payout.gateway.mode",
        havingValue = "development",
        matchIfMissing = true
)
public class PortalPayoutAccountServiceImpl
        implements PortalPayoutAccountService {

    private final PortalPayoutAccountRepository payoutRepository;
    private final PayoutAccountAuditRepository auditRepository;
    private final TenantSecurityService tenantSecurityService;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public PortalPayoutAccountServiceImpl(
            PortalPayoutAccountRepository payoutRepository,
            PayoutAccountAuditRepository auditRepository,
            TenantSecurityService tenantSecurityService) {

        this.payoutRepository = payoutRepository;
        this.auditRepository = auditRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Override
    public PayoutAccountResponse getCurrentPortalAccount() {

        Portal portal = requirePortalAdmin();

        return payoutRepository.findByPortalId(portal.getId())
                .map(this::toResponse)
                .orElse(new PayoutAccountResponse(
                        null,
                        portal.getId(),
                        GatewayProvider.DEVELOPMENT,
                        null,
                        null,
                        null,
                        null,
                        null,
                        PayoutVerificationStatus.NOT_STARTED,
                        PayoutStatus.DISABLED,
                        null,
                        null,
                        null
                ));
    }

    @Override
    @Transactional
    public PayoutOnboardingResponse startOnboarding(
            CreatePayoutOnboardingRequest request) {

        Portal portal = requirePortalAdmin();

        PortalPayoutAccount account =
                payoutRepository.findByPortalId(portal.getId())
                        .orElseGet(PortalPayoutAccount::new);

        if (account.getId() == null) {
            account.setPortal(portal);
            account.setGatewayAccountId(
                    "dev_account_" +
                    UUID.randomUUID().toString()
                            .replace("-", "")
            );
        }

        account.setGatewayProvider(
                GatewayProvider.DEVELOPMENT
        );

        account.setVerificationStatus(
                PayoutVerificationStatus.PENDING
        );

        account.setPayoutStatus(PayoutStatus.PENDING);

        payoutRepository.save(account);

        saveAudit(
                portal.getId(),
                "DEVELOPMENT_ONBOARDING_STARTED",
                "Development payout onboarding started"
        );

        return new PayoutOnboardingResponse(
                frontendUrl +
                        "/admin/settings?payout=development",
                account.getVerificationStatus().name()
        );
    }

    @Override
    @Transactional
    public PayoutAccountResponse submitDevelopmentDetails(
            DevelopmentPayoutRequest request) {

        Portal portal = requirePortalAdmin();

        validateDevelopmentRequest(request);

        PortalPayoutAccount account =
                payoutRepository.findByPortalId(portal.getId())
                        .orElseGet(PortalPayoutAccount::new);

        if (account.getId() == null) {
            account.setPortal(portal);
            account.setGatewayAccountId(
                    "dev_account_" +
                    UUID.randomUUID().toString()
                            .replace("-", "")
            );
        }

        account.setGatewayProvider(
                GatewayProvider.DEVELOPMENT
        );

        account.setAccountHolderName(
                request.accountHolderName().trim()
        );

        account.setBankName(request.bankName().trim());

        /*
         * Raw account number, IFSC and UPI are never saved.
         * Only masked values are persisted.
         */
        account.setMaskedAccountNumber(
                maskAccountNumber(request.accountNumber())
        );

        account.setMaskedIfsc(
                maskIfsc(request.ifscCode())
        );

        account.setMaskedUpiId(
                maskUpi(request.upiId())
        );

        account.setVerificationStatus(
                PayoutVerificationStatus.PENDING
        );

        account.setPayoutStatus(PayoutStatus.PENDING);
        account.setVerifiedAt(null);

        PortalPayoutAccount saved =
                payoutRepository.save(account);

        saveAudit(
                portal.getId(),
                "DEVELOPMENT_DETAILS_SUBMITTED",
                "Masked development payout details submitted"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PayoutAccountResponse updateDevelopmentStatus(
            DevelopmentPayoutStatusRequest request) {

        Portal portal = requirePortalAdmin();

        if (request.verificationStatus() == null) {
            throw new RuntimeException(
                    "Verification status is required"
            );
        }

        PortalPayoutAccount account =
                payoutRepository.findByPortalId(portal.getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Payout account not found"
                                )
                        );

        account.setVerificationStatus(
                request.verificationStatus()
        );

        if (request.verificationStatus()
                == PayoutVerificationStatus.VERIFIED) {

            account.setPayoutStatus(PayoutStatus.ACTIVE);
            account.setVerifiedAt(LocalDateTime.now());

        } else if (request.verificationStatus()
                == PayoutVerificationStatus.REJECTED) {

            account.setPayoutStatus(PayoutStatus.DISABLED);
            account.setVerifiedAt(null);

        } else {
            account.setPayoutStatus(PayoutStatus.PENDING);
            account.setVerifiedAt(null);
        }

        PortalPayoutAccount saved =
                payoutRepository.save(account);

        saveAudit(
                portal.getId(),
                "DEVELOPMENT_STATUS_UPDATED",
                "Verification changed to " +
                        request.verificationStatus().name()
        );

        return toResponse(saved);
    }

    private Portal requirePortalAdmin() {

        if (!tenantSecurityService.isPortalAdmin()) {
            throw new RuntimeException(
                    "Only the portal admin can manage payout details"
            );
        }

        return tenantSecurityService.getLoggedInPortal();
    }

    private void validateDevelopmentRequest(
            DevelopmentPayoutRequest request) {

        if (request == null) {
            throw new RuntimeException(
                    "Payout details are required"
            );
        }

        requireText(
                request.accountHolderName(),
                "Account holder name"
        );

        requireText(request.bankName(), "Bank name");
        requireText(request.accountNumber(), "Account number");
        requireText(request.ifscCode(), "IFSC code");

        String accountNumber =
                request.accountNumber().replaceAll("\\s", "");

        if (!accountNumber.matches("\\d{8,18}")) {
            throw new RuntimeException(
                    "Enter a valid test account number"
            );
        }

        String ifsc =
                request.ifscCode()
                        .replaceAll("\\s", "")
                        .toUpperCase();

        /*
         * TEST prefix is allowed only for development testing.
         */
        if (!ifsc.matches("([A-Z]{4}0[A-Z0-9]{6}|TEST[0-9]{7})")) {
            throw new RuntimeException(
                    "Enter a valid IFSC or development TEST IFSC"
            );
        }
    }

    private void requireText(
            String value,
            String fieldName) {

        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(
                    fieldName + " is required"
            );
        }
    }

    private String maskAccountNumber(String value) {

        String clean = value.replaceAll("\\D", "");

        String lastFour =
                clean.substring(
                        Math.max(0, clean.length() - 4)
                );

        return "XXXXXX" + lastFour;
    }

    private String maskIfsc(String value) {

        String clean =
                value.trim().toUpperCase();

        if (clean.length() <= 4) {
            return "****";
        }

        return clean.substring(0, 4) + "*******";
    }

    private String maskUpi(String value) {

        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String clean = value.trim();
        int separator = clean.indexOf("@");

        if (separator <= 1) {
            return "****" +
                    (separator >= 0
                            ? clean.substring(separator)
                            : "");
        }

        return clean.substring(0, 2)
                + "****"
                + clean.substring(separator);
    }

    private void saveAudit(
            Long portalId,
            String action,
            String description) {

        User user =
                tenantSecurityService.getLoggedInUser();

        PayoutAccountAudit audit =
                new PayoutAccountAudit();

        audit.setPortalId(portalId);
        audit.setPerformedByUserId(user.getId());
        audit.setAction(action);
        audit.setDescription(description);

        auditRepository.save(audit);
    }

    private PayoutAccountResponse toResponse(
            PortalPayoutAccount account) {

        return new PayoutAccountResponse(
                account.getId(),
                account.getPortal().getId(),
                account.getGatewayProvider(),
                account.getAccountHolderName(),
                account.getBankName(),
                account.getMaskedAccountNumber(),
                account.getMaskedIfsc(),
                account.getMaskedUpiId(),
                account.getVerificationStatus(),
                account.getPayoutStatus(),
                account.getCreatedAt(),
                account.getUpdatedAt(),
                account.getVerifiedAt()
        );
    }
}