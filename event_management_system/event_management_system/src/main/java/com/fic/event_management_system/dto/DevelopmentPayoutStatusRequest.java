package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.PayoutVerificationStatus;

public record DevelopmentPayoutStatusRequest(
        PayoutVerificationStatus verificationStatus
) {
}
