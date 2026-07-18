package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.GatewayProvider;
import com.fic.event_management_system.enums.PayoutStatus;
import com.fic.event_management_system.enums.PayoutVerificationStatus;

import java.time.LocalDateTime;

public record PayoutAccountResponse(
        Long id,
        Long portalId,
        GatewayProvider gatewayProvider,
        String accountHolderName,
        String bankName,
        String maskedAccountNumber,
        String maskedIfsc,
        String maskedUpiId,
        PayoutVerificationStatus verificationStatus,
        PayoutStatus payoutStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime verifiedAt
) {
}
