package com.fic.event_management_system.dto;

public record PayoutOnboardingResponse(
        String onboardingUrl,
        String verificationStatus
) {
}
