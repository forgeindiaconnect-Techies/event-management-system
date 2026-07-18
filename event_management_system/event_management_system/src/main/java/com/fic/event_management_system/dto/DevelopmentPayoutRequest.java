package com.fic.event_management_system.dto;

public record DevelopmentPayoutRequest(
        String accountHolderName,
        String bankName,
        String accountNumber,
        String ifscCode,
        String upiId
) {
}